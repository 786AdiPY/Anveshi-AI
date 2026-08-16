"""
Verity — FastAPI Server & Real-time SSE Endpoint
Exposes research execution, state streaming, evidence graph, and settings to the frontend.
"""
from __future__ import annotations
import asyncio
import json
import uuid
import os
from datetime import datetime
from typing import Dict, Any, Optional, AsyncGenerator
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from src.system import MultiAgentSystem
from src.core.schemas import ResearchDepth, VerificationStatus
from src.core.state import create_initial_state
from src.core.mcp_manager import get_mcp_manager
from src.logger import setup_logger

logger = setup_logger()

app = FastAPI(
    title="Verity API",
    description="Evidence-Grounded Multi-Agent Research Engine API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for active and historical research runs
RESEARCH_RUNS: Dict[str, Dict[str, Any]] = {}


class StartResearchRequest(BaseModel):
    question: str
    depth: Optional[ResearchDepth] = ResearchDepth.STANDARD
    files: Optional[list[str]] = Field(default_factory=list)


class UpdateSettingsRequest(BaseModel):
    default_model: Optional[str] = "openai/gpt-4o-mini"
    research_depth: Optional[str] = "standard"
    max_cost_usd: Optional[float] = 2.0


SETTINGS_STORE: Dict[str, Any] = {
    "default_model": "openai/gpt-4o-mini",
    "research_depth": "standard",
    "max_cost_usd": 2.0,
}


def run_research_background(run_id: str, question: str):
    """Execute the multi-agent graph in a background task and collect event logs."""
    run_entry = RESEARCH_RUNS[run_id]
    run_entry["status"] = "running"
    run_entry["started_at"] = datetime.utcnow().isoformat()

    try:
        system = MultiAgentSystem()
        graph = system.workflow_manager.get_graph()
        initial_state = create_initial_state(question)

        events = graph.stream(
            initial_state,
            {"configurable": {"thread_id": run_id}, "recursion_limit": 3000},
            stream_mode="values",
            debug=False,
        )

        for event in events:
            # Capture snapshot update
            last_agent = event.get("last_active_agent", "system")
            step_count = event.get("step_count", 0)

            # Update metrics
            papers = event.get("papers", [])
            claims = event.get("claims", [])
            evidence = event.get("evidence", [])
            contradictions = event.get("contradictions", [])
            verification_results = event.get("verification_results", [])
            brief = event.get("research_brief")
            graph_data = event.get("evidence_graph_data", {})

            verified_count = sum(
                1 for c in claims if getattr(c, "verification_status", "") == VerificationStatus.PASS
            )

            event_payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "agent": last_agent,
                "step_count": step_count,
                "papers_count": len(papers),
                "claims_count": len(claims),
                "verified_count": verified_count,
                "contradictions_count": len(contradictions),
                "status": "running" if not brief else "completed",
            }

            run_entry["events"].append(event_payload)
            run_entry["latest_state"] = {
                "papers": [p.model_dump() if hasattr(p, "model_dump") else p for p in papers],
                "claims": [c.model_dump() if hasattr(c, "model_dump") else c for c in claims],
                "evidence": [e.model_dump() if hasattr(e, "model_dump") else e for e in evidence],
                "contradictions": [ct.model_dump() if hasattr(ct, "model_dump") else ct for ct in contradictions],
                "verification_results": [vr.model_dump() if hasattr(vr, "model_dump") else vr for vr in verification_results],
                "research_brief": brief,
                "evidence_graph_data": graph_data,
            }

        run_entry["status"] = "completed"
        run_entry["completed_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        logger.error(f"Error executing research run {run_id}: {e}", exc_info=True)
        run_entry["status"] = "failed"
        run_entry["error"] = str(e)


@app.post("/api/research")
async def start_research(payload: StartResearchRequest):
    """Start a new research investigation."""
    run_id = str(uuid.uuid4())
    run_entry = {
        "id": run_id,
        "question": payload.question,
        "depth": payload.depth.value if payload.depth else "standard",
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "events": [],
        "latest_state": {},
        "error": None,
    }
    RESEARCH_RUNS[run_id] = run_entry

    # Start background execution
    asyncio.get_event_loop().run_in_executor(None, run_research_background, run_id, payload.question)

    return {"id": run_id, "status": "started", "question": payload.question}


@app.get("/api/research/history")
async def get_history():
    """Get list of past and active research runs."""
    history = []
    for r in RESEARCH_RUNS.values():
        state = r.get("latest_state", {})
        history.append({
            "id": r["id"],
            "question": r["question"],
            "status": r["status"],
            "depth": r["depth"],
            "created_at": r["created_at"],
            "papers_count": len(state.get("papers", [])),
            "claims_count": len(state.get("claims", [])),
            "has_report": bool(state.get("research_brief")),
        })
    return {"history": history}


@app.get("/api/research/{run_id}")
async def get_research_detail(run_id: str):
    """Get research run details and full state."""
    if run_id not in RESEARCH_RUNS:
        raise HTTPException(status_code=404, detail="Research run not found")
    return RESEARCH_RUNS[run_id]


@app.get("/api/research/{run_id}/stream")
async def stream_research_events(run_id: str):
    """SSE endpoint for streaming real-time research progress updates."""
    if run_id not in RESEARCH_RUNS:
        raise HTTPException(status_code=404, detail="Research run not found")

    async def event_generator() -> AsyncGenerator[dict, None]:
        last_idx = 0
        while True:
            run_entry = RESEARCH_RUNS.get(run_id)
            if not run_entry:
                break

            events = run_entry.get("events", [])
            while last_idx < len(events):
                ev = events[last_idx]
                last_idx += 1
                yield {"event": "agent_update", "data": json.dumps(ev)}

            if run_entry["status"] in ["completed", "failed"]:
                yield {
                    "event": "status_change",
                    "data": json.dumps({
                        "status": run_entry["status"],
                        "error": run_entry.get("error"),
                        "research_brief": run_entry.get("latest_state", {}).get("research_brief"),
                    })
                }
                break

            await asyncio.sleep(0.5)

    return EventSourceResponse(event_generator())


@app.get("/api/research/{run_id}/graph")
async def get_evidence_graph(run_id: str):
    """Get JSON evidence graph data for the interactive graph UI."""
    if run_id not in RESEARCH_RUNS:
        raise HTTPException(status_code=404, detail="Research run not found")

    run_entry = RESEARCH_RUNS[run_id]
    graph_data = run_entry.get("latest_state", {}).get("evidence_graph_data", {"nodes": [], "edges": []})
    return graph_data


@app.get("/api/research/{run_id}/agents/{agent_name}")
async def get_agent_inspector_data(run_id: str, agent_name: str):
    """Get inspection data for a specific agent node."""
    if run_id not in RESEARCH_RUNS:
        raise HTTPException(status_code=404, detail="Research run not found")

    run_entry = RESEARCH_RUNS[run_id]
    state = run_entry.get("latest_state", {})

    agent_events = [
        ev for ev in run_entry.get("events", []) if ev.get("agent") == agent_name
    ]

    return {
        "agent": agent_name,
        "run_id": run_id,
        "total_calls": len(agent_events),
        "events": agent_events,
        "papers_produced": state.get("papers", []) if agent_name in ["literature_agent", "Literature"] else [],
        "claims_produced": state.get("claims", []) if agent_name in ["extractor_agent", "Extractor"] else [],
        "verification_results": state.get("verification_results", []) if agent_name in ["verifier_agent", "Verifier"] else [],
        "contradictions_produced": state.get("contradictions", []) if agent_name in ["challenger_agent", "Challenger"] else [],
    }


@app.get("/api/settings")
async def get_settings():
    return SETTINGS_STORE


@app.put("/api/settings")
async def update_settings(payload: UpdateSettingsRequest):
    if payload.default_model:
        SETTINGS_STORE["default_model"] = payload.default_model
    if payload.research_depth:
        SETTINGS_STORE["research_depth"] = payload.research_depth
    if payload.max_cost_usd is not None:
        SETTINGS_STORE["max_cost_usd"] = payload.max_cost_usd
    return SETTINGS_STORE


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
