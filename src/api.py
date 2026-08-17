"""
Anveshi AI — FastAPI Server & Real-time SSE Endpoint
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
from src.core.supabase_client import get_supabase, RESEARCH_RUNS_TABLE
from src.logger import setup_logger

logger = setup_logger()

app = FastAPI(
    title="Anveshi AI API",
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

from src.mock_data import MOCK_RESEARCH_RUNS

# In-memory store for active and historical research runs, pre-populated with mock representation data
RESEARCH_RUNS: Dict[str, Dict[str, Any]] = dict(MOCK_RESEARCH_RUNS)

# Hard ceiling on graph node executions per run. A full pass is roughly
# Planner → Supervisor → sub-agent → Ledger → Verifier, repeated up to
# max_verification_loops, then Synthesizer → EvidenceGraph — well under 40.
# This is the backstop that turns a stuck run into a fast failure instead of
# thousands of billed API calls.
GRAPH_RECURSION_LIMIT = int(os.getenv("GRAPH_RECURSION_LIMIT", "60"))

# "lean"  — deterministic search plus a single synthesis call (default).
# "agents" — the full nine-agent graph, which needs a provider tier with
#            headroom well above a free per-minute token budget.
RESEARCH_MODE = os.getenv("RESEARCH_MODE", "lean").strip().lower()


def persist_run(run_entry: Dict[str, Any]) -> None:
    """
    Best-effort write-through to Supabase. In-memory RESEARCH_RUNS stays the
    source of truth for a live run (the SSE stream polls it directly, with no
    DB round trip); this just mirrors it so history survives a restart.
    Never raises — a persistence hiccup shouldn't fail a research run.
    """
    supabase = get_supabase()
    if not supabase:
        return
    try:
        supabase.table(RESEARCH_RUNS_TABLE).upsert({
            "id": run_entry["id"],
            "question": run_entry.get("question", ""),
            "depth": run_entry.get("depth", "standard"),
            "status": run_entry["status"],
            "created_at": run_entry.get("created_at"),
            "started_at": run_entry.get("started_at"),
            "completed_at": run_entry.get("completed_at"),
            "error": run_entry.get("error"),
            "events": run_entry.get("events", []),
            "latest_state": run_entry.get("latest_state", {}),
        }).execute()
    except Exception as e:
        logger.warning(f"Supabase persist failed for run {run_entry.get('id')}: {e}")


def fetch_persisted_run(run_id: str) -> Optional[Dict[str, Any]]:
    """Look up a single run in Supabase (used when it's not in memory, e.g. after a restart)."""
    supabase = get_supabase()
    if not supabase:
        return None
    try:
        res = supabase.table(RESEARCH_RUNS_TABLE).select("*").eq("id", run_id).limit(1).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.warning(f"Supabase fetch failed for run {run_id}: {e}")
        return None


def fetch_persisted_history(exclude_ids: set[str]) -> list[Dict[str, Any]]:
    """Historical runs from Supabase not already held in memory (e.g. from before a restart)."""
    supabase = get_supabase()
    if not supabase:
        return []
    try:
        res = (
            supabase.table(RESEARCH_RUNS_TABLE)
            .select("id,question,depth,status,created_at,latest_state")
            .order("created_at", desc=True)
            .limit(200)
            .execute()
        )
        return [r for r in res.data if r["id"] not in exclude_ids]
    except Exception as e:
        logger.warning(f"Supabase history fetch failed: {e}")
        return []


class StartResearchRequest(BaseModel):
    question: str
    depth: Optional[ResearchDepth] = ResearchDepth.STANDARD
    files: Optional[list[str]] = Field(default_factory=list)


class UpdateSettingsRequest(BaseModel):
    default_model: Optional[str] = "openai/gpt-4o-mini"
    research_depth: Optional[str] = "standard"
    max_cost_usd: Optional[float] = 2.0
    max_verification_loops: Optional[int] = 3


SETTINGS_STORE: Dict[str, Any] = {
    "default_model": "openai/gpt-4o-mini",
    "research_depth": "standard",
    "max_cost_usd": 2.0,
    "max_verification_loops": 3,
}


def _dump(items: list) -> list:
    return [i.model_dump() if hasattr(i, "model_dump") else i for i in items]


def run_lean_background(run_id: str, question: str):
    """Run the single-call pipeline: deterministic search, then one synthesis."""
    from .core.lean_pipeline import run_lean_research
    from .core.language_models import LanguageModelManager

    run_entry = RESEARCH_RUNS[run_id]
    run_entry["status"] = "running"
    run_entry["started_at"] = datetime.utcnow().isoformat()
    persist_run(run_entry)

    def model_factory():
        manager = LanguageModelManager()
        config = dict(manager.get_model_config("synthesizer_agent"))
        config.setdefault("timeout", 90)
        return manager.get_provider("synthesizer_agent").get_model_class()(**config)

    def on_progress(stage: str, state: dict):
        run_entry["events"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent": "literature_agent" if stage == "search" else "synthesizer_agent",
            "step_count": len(run_entry["events"]) + 1,
            "papers_count": len(state.get("papers", [])),
            "claims_count": len(state.get("claims", [])),
            "verified_count": 0,
            "contradictions_count": 0,
            "status": "completed" if state.get("research_brief") else "running",
            "error": None,
        })
        run_entry["latest_state"] = {
            "papers": _dump(state.get("papers", [])),
            "claims": _dump(state.get("claims", [])),
            "evidence": [],
            "contradictions": [],
            "verification_results": [],
            "research_brief": state.get("research_brief"),
            "evidence_graph_data": state.get("evidence_graph_data", {}),
        }
        persist_run(run_entry)

    try:
        state = run_lean_research(question, model_factory, on_progress)
        run_entry["status"] = "completed" if state.get("research_brief") else "failed"
        run_entry["error"] = state.get("last_error")
        run_entry["completed_at"] = datetime.utcnow().isoformat()
        persist_run(run_entry)
    except Exception as e:
        logger.error(f"Error executing research run {run_id}: {e}", exc_info=True)
        run_entry["status"] = "failed"
        run_entry["error"] = str(e)
        run_entry["completed_at"] = datetime.utcnow().isoformat()
        persist_run(run_entry)


def run_research_background(run_id: str, question: str):
    """Execute the multi-agent graph in a background task and collect event logs."""
    if RESEARCH_MODE == "lean":
        return run_lean_background(run_id, question)

    run_entry = RESEARCH_RUNS[run_id]
    run_entry["status"] = "running"
    run_entry["started_at"] = datetime.utcnow().isoformat()
    persist_run(run_entry)

    try:
        system = MultiAgentSystem()
        graph = system.workflow_manager.get_graph()
        initial_state = create_initial_state(
            question, max_verification_loops=SETTINGS_STORE.get("max_verification_loops", 3)
        )

        events = graph.stream(
            initial_state,
            {"configurable": {"thread_id": run_id}, "recursion_limit": GRAPH_RECURSION_LIMIT},
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
                "error": event.get("last_error"),
            }

            # Agents swallow their own exceptions so the graph can recover, so a
            # failing run still looks "running" here. Surface the latest failure
            # on the run entry to keep it visible in the UI.
            if event.get("last_error"):
                run_entry["error"] = event.get("last_error")

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
            persist_run(run_entry)

        # Agents swallow their own exceptions so the graph can finish, which
        # means the stream ends normally even when every node failed. Only call
        # a run completed if it actually produced something.
        final_state = run_entry.get("latest_state", {})
        produced_output = bool(
            final_state.get("research_brief")
            or final_state.get("papers")
            or final_state.get("claims")
        )
        if produced_output:
            run_entry["status"] = "completed"
        else:
            run_entry["status"] = "failed"
            run_entry["error"] = run_entry.get("error") or (
                "The run finished without gathering any sources or claims. "
                "Check the backend logs for agent errors (model credentials, "
                "provider credits, or search backend)."
            )
        run_entry["completed_at"] = datetime.utcnow().isoformat()
        persist_run(run_entry)

    except Exception as e:
        logger.error(f"Error executing research run {run_id}: {e}", exc_info=True)
        run_entry["status"] = "failed"
        run_entry["error"] = str(e)
        persist_run(run_entry)


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
    persist_run(run_entry)

    # Start background execution
    asyncio.get_event_loop().run_in_executor(None, run_research_background, run_id, payload.question)

    return {"id": run_id, "status": "started", "question": payload.question}


def _count_verified(claims: list) -> int:
    return sum(1 for c in claims if (c.get("verification_status") if isinstance(c, dict) else None) == "PASS")


def _runtime_seconds(r: Dict[str, Any]) -> Optional[float]:
    started, completed = r.get("started_at"), r.get("completed_at")
    if not started or not completed:
        return None
    try:
        return (datetime.fromisoformat(completed) - datetime.fromisoformat(started)).total_seconds()
    except ValueError:
        return None


def _history_row(r: Dict[str, Any]) -> Dict[str, Any]:
    state = r.get("latest_state") or {}
    claims = state.get("claims", [])
    return {
        "id": r["id"],
        "question": r["question"],
        "status": r["status"],
        "depth": r["depth"],
        "created_at": r["created_at"],
        "runtime_seconds": _runtime_seconds(r),
        "papers_count": len(state.get("papers", [])),
        "claims_count": len(claims),
        "verified_count": _count_verified(claims),
        "contradictions_count": len(state.get("contradictions", [])),
        "has_report": bool(state.get("research_brief")),
    }


@app.get("/api/research/history")
async def get_history():
    """Get list of past and active research runs (in-memory + Supabase, deduplicated)."""
    history = [_history_row(r) for r in RESEARCH_RUNS.values()]
    history += [_history_row(r) for r in fetch_persisted_history(exclude_ids=set(RESEARCH_RUNS.keys()))]

    history.sort(key=lambda h: h["created_at"], reverse=True)
    return {"history": history}


@app.get("/api/research/{run_id}")
async def get_research_detail(run_id: str):
    """Get research run details and full state."""
    if run_id in RESEARCH_RUNS:
        return RESEARCH_RUNS[run_id]
    persisted = fetch_persisted_run(run_id)
    if persisted:
        return persisted
    raise HTTPException(status_code=404, detail="Research run not found")


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
    run_entry = RESEARCH_RUNS.get(run_id) or fetch_persisted_run(run_id)
    if not run_entry:
        raise HTTPException(status_code=404, detail="Research run not found")

    graph_data = (run_entry.get("latest_state") or {}).get("evidence_graph_data", {"nodes": [], "edges": []})
    return graph_data


@app.get("/api/research/{run_id}/agents/{agent_name}")
async def get_agent_inspector_data(run_id: str, agent_name: str):
    """Get inspection data for a specific agent node."""
    run_entry = RESEARCH_RUNS.get(run_id) or fetch_persisted_run(run_id)
    if not run_entry:
        raise HTTPException(status_code=404, detail="Research run not found")

    state = run_entry.get("latest_state") or {}

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


@app.get("/api/datasets")
async def list_datasets():
    """
    List files in WORKING_DIRECTORY — the same directory the agents' own file
    tools (list_directory, etc.) read from. Read-only: this exposes what's
    already there, it does not add an upload path.
    """
    from src.config import WORKING_DIRECTORY

    base = os.path.abspath(WORKING_DIRECTORY)
    datasets = []
    if os.path.isdir(base):
        for root, _dirs, files in os.walk(base):
            for name in files:
                if name.startswith("."):
                    continue
                full_path = os.path.join(root, name)
                try:
                    stat = os.stat(full_path)
                except OSError:
                    continue
                datasets.append({
                    "name": name,
                    "path": os.path.relpath(full_path, base),
                    "size_bytes": stat.st_size,
                    "modified_at": datetime.utcfromtimestamp(stat.st_mtime).isoformat(),
                })
    datasets.sort(key=lambda d: d["modified_at"], reverse=True)
    return {"working_directory": base, "datasets": datasets}


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
    if payload.max_verification_loops is not None:
        SETTINGS_STORE["max_verification_loops"] = payload.max_verification_loops
    return SETTINGS_STORE


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
