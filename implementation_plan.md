# Implementation Plan - Pramaan AI Evidence-Grounded Research Agent Refactor

This plan outlines the architecture, code refactoring, data models, state graph topology, and agent implementation required to repurpose the existing multi-agent infrastructure into **Pramaan AI — Evidence-Grounded Research Agent**.

## User Review Required

> [!IMPORTANT]
> **Key Architectural Decisions & Changes:**
> 1. **Data Analysis $\rightarrow$ Evidence-Grounded Research**: The system purpose is completely transformed from tabular CSV data analysis to scientific and literature research with verifiable evidence tracing.
> 2. **New Adversarial Agent (Challenger)**: A dedicated `Challenger` agent is added to search for counter-evidence, negative results, and methodological flaws.
> 3. **Verification Gating**: Research conclusions cannot pass to the `Synthesizer` without passing `Verifier` checks. Verification failures trigger automatic re-investigation via the `Supervisor`.
> 4. **Execution Trace & Cost Tracking**: Token usage, cost estimations, and agent trace events will be recorded into the Research Ledger.

---

## Status Summary Checklist

- [x] **Backend Core & Data Models** (Schemas, State, 9 Agent Modules, Prompts, Graph Routing)
- [x] **FastAPI API Layer & SSE Streaming** (`src/api.py`, REST endpoints, SSE stream)
- [x] **Frontend UI Setup & Pages** (all 8 routes, live execution graph, report viewer)
- [ ] **Legacy Code Cleanup** (Delete deprecated CSV agent files — unreferenced, pending removal)

---

## Proposed Changes

### Core Data Models & Schemas

- [x] #### [NEW] [src/core/schemas.py](file:///home/adi/Desktop/Hackathons/research-agent/src/core/schemas.py)
  - Define Pydantic models for structured research entities:
    - `ResearchQuestion`: `id`, `query`, `subquestions`, `search_queries`, `status`
    - `Hypothesis`: `id`, `statement`, `target_subquestion`, `status`
    - `Paper`: `id`, `title`, `authors`, `year`, `url`, `doi`, `abstract`, `venue`
    - `Claim`: `id`, `statement`, `paper_id`, `confidence_score`
    - `Evidence`: `id`, `claim_id`, `paper_id`, `excerpt`, `methodology`, `findings`
    - `Contradiction`: `id`, `claim_id`, `opposing_evidence_id`, `source_url`, `explanation`
    - `VerificationResult`: `claim_id`, `status` (`PASS` | `FAIL` | `UNCERTAIN`), `reasons`, `missing_evidence`
    - `AgentEvent` & `ExecutionTrace`: `agent_name`, `action`, `timestamp`, `tokens`, `cost`

- [x] #### [MODIFY] [src/core/state.py](file:///home/adi/Desktop/Hackathons/research-agent/src/core/state.py)
  - Update `ResearchState` dictionary to store:
    - `question`: `ResearchQuestion`
    - `papers`: `list[Paper]`
    - `claims`: `list[Claim]`
    - `evidence`: `list[Evidence]`
    - `contradictions`: `list[Contradiction]`
    - `verification_results`: `list[VerificationResult]`
    - `execution_trace`: `list[AgentEvent]`
    - `loop_count`: `int`
    - `max_loops`: `int`

---

### Agent Modules & System Prompts

- [x] #### [NEW] [src/agents/planner_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/planner_agent.py) *(Replaces hypothesis_agent)*
  - Takes research question; generates research plan, subquestions, initial hypotheses, and search queries.

- [x] #### [NEW] [src/agents/supervisor_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/supervisor_agent.py) *(Replaces process_agent)*
  - Orchestrates multi-agent research workflow, assigns tasks to literature researcher, extractor, or challenger, and handles verification retry logic.

- [x] #### [NEW] [src/agents/literature_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/literature_agent.py) *(Replaces search_agent)*
  - Performs academic/web search for scientific papers, articles, and preprints using Tavily/search tools; extracts structured paper metadata.

- [x] #### [NEW] [src/agents/extractor_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/extractor_agent.py) *(Replaces code_agent)*
  - Extracts granular claims, empirical evidence, numerical results, and methodology snippets from retrieved literature.

- [x] #### [NEW] [src/agents/challenger_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/challenger_agent.py) *(NEW Agent)*
  - Performs targeted counter-search for conflicting evidence, negative findings, alternative explanations, and limitations.

- [x] #### [NEW] [src/agents/verifier_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/verifier_agent.py) *(Replaces quality_review_agent)*
  - Rigorously validates claims against source evidence and citations; labels each as `PASS`, `FAIL`, or `UNCERTAIN`.

- [x] #### [NEW] [src/agents/ledger_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/ledger_agent.py) *(Replaces note_agent)*
  - Maintains state updates, structures paper/claim/evidence entries in research ledger, and tracks execution cost.

- [x] #### [NEW] [src/agents/evidence_graph_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/evidence_graph_agent.py) *(Replaces visualization_agent)*
  - Generates structured graph visual data (Mermaid diagram / JSON graph) mapping `Claim` $\rightarrow$ `Evidence` $\rightarrow$ `Source Paper` $\rightarrow$ `Contradiction`.

- [x] #### [NEW] [src/agents/synthesizer_agent.py](file:///home/adi/Desktop/Hackathons/research-agent/src/agents/synthesizer_agent.py) *(Replaces report_agent)*
  - Generates the final executive research brief with verified findings, supporting evidence tables, counter-arguments, and full citations.

- [ ] #### [DELETE] Legacy Agents
  - Remove old CSV data analysis files on disk (`hypothesis_agent.py`, `code_agent.py`, `visualization_agent.py`, `quality_review_agent.py`, `report_agent.py`, `note_agent.py`, `process_agent.py`, `search_agent.py`).

---

### LangGraph Workflow & Routing

- [x] #### [MODIFY] [src/core/workflow.py](file:///home/adi/Desktop/Hackathons/research-agent/src/core/workflow.py)
  - Rebuild state graph flow:
    ```
    START -> PLANNER -> SUPERVISOR -> (LITERATURE_RESEARCHER | EXTRACTOR | CHALLENGER) -> VERIFIER
                                                                                              │
                                                                                  ┌────────────┴───────────┐
                                                                                  ▼                        ▼
                                                                             PASS (OK)              FAIL (Retry)
                                                                                  │                        │
                                                                             SYNTHESIZER              SUPERVISOR
                                                                                  │                        │
                                                                            EVIDENCE_GRAPH           more research
                                                                                  │                        │
                                                                                 END                   (max 3)
    ```

- [x] #### [MODIFY] [src/core/node.py](file:///home/adi/Desktop/Hackathons/research-agent/src/core/node.py) & [src/core/router.py](file:///home/adi/Desktop/Hackathons/research-agent/src/core/router.py)
  - Update node handlers and routing functions to direct flow based on verification results and supervisor directives.

---

### Configurations & System Prompts

- [x] #### [MODIFY] [config/agent_models.yaml](file:///home/adi/Desktop/Hackathons/research-agent/config/agent_models.yaml)
  - Update model configurations for all new agents (`planner`, `supervisor`, `literature`, `extractor`, `challenger`, `verifier`, `ledger`, `evidence_graph`, `synthesizer`).

- [x] #### [NEW] [config/agents/](file:///home/adi/Desktop/Hackathons/research-agent/config/agents/)
  - Create/update prompt files: `planner/AGENT.md`, `supervisor/AGENT.md`, `literature/AGENT.md`, `extractor/AGENT.md`, `challenger/AGENT.md`, `verifier/AGENT.md`, `ledger/AGENT.md`, `evidence_graph/AGENT.md`, `synthesizer/AGENT.md`.

---

### Execution Entry Point

- [x] #### [MODIFY] [main.py](file:///home/adi/Desktop/Hackathons/research-agent/main.py)
  - Update user input format for research queries (e.g. `research: "What are the trade-offs of RAG vs Fine-tuning for enterprise LLMs?"`).
  - Format and write outputs to `data/Research_Brief_[Topic].md` and `data/Evidence_Graph_[Topic].md`.

---

### Backend API Layer

- [x] #### [NEW] [src/api.py](file:///home/adi/Desktop/Hackathons/research-agent/src/api.py)
  - FastAPI server exposing the research pipeline to the frontend:
    - `POST /api/research` — Start a new research run. Accepts `{ question, depth, files }`. Returns `{ id }`.
    - `GET /api/research/:id` — Get research run status, metadata, and final report.
    - `GET /api/research/:id/stream` — SSE (Server-Sent Events) endpoint streaming live agent events, metrics, and state transitions to the frontend in real-time.
    - `GET /api/research/:id/graph` — Get evidence graph data (nodes: claims, papers, contradictions; edges: supports, contradicts).
    - `GET /api/research/:id/agents/:agent` — Get agent inspector data (status, duration, findings, sources).
    - `GET /api/research/history` — List previous research runs.
    - `GET /api/settings` / `PUT /api/settings` — Read/update user settings (models, depth, cost limits).

- [x] #### [MODIFY] [requirements.txt](file:///home/adi/Desktop/Hackathons/research-agent/requirements.txt)
  - Add `fastapi`, `uvicorn[standard]`, `sse-starlette` dependencies.

---

### Frontend — Pramaan AI UI (Next.js)

- [x] #### Frontend Project Setup
  - Initialize Next.js project in `frontend/` with TypeScript, App Router, and Vanilla CSS.
  - Install dependencies: `react-flow` (for n8n-style agent canvas), `@xyflow/react`, `lucide-react` (icons).

- [x] #### [NEW] [frontend/src/app/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/page.tsx) — **Main Dashboard** `/`
  - Left sidebar: Pramaan AI logo, New Research, Research History, Saved Reports, Settings links.
  - Main area: Large research question input, file upload zone, research depth selector (Quick / Standard / Deep), `Start Research` button.
  - Below: Suggested research prompts, recent research history cards (title, date, status, source count).

- [x] #### [NEW] [frontend/src/app/research/new/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/research/new/page.tsx) — **Research Configuration** `/research/new`
  - Editable research question.
  - Auto-generated research plan preview: subquestions, hypotheses, research objectives.
  - Source type toggles: Academic papers, Preprints, Web sources, Uploaded documents.
  - Output format preview: Research brief, Evidence citations, Contradictory findings, Research gaps.
  - Actions: `← Edit Question` and `Start Research →`.

- [x] #### [NEW] [frontend/src/app/research/[id]/run/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/research/%5Bid%5D/run/page.tsx) — **Live Research Canvas** `/research/:id/run`
  - Top bar: Research question, status badge (● Running), Pause/Stop controls.
  - **Main n8n-style interactive canvas** (via `react-flow`) showing agent nodes:
    ```
    Planner → Supervisor → (Literature Researcher | Evidence Extractor | Challenger) → Verifier
                                                                                          ↓
                                                                                     PASS → Synthesizer → END
                                                                                     FAIL → Supervisor (retry, max 3)
    ```
  - Each node shows: state (`WAITING` / `RUNNING` / `COMPLETED` / `FAILED`), current action, duration, output count.
  - Bottom metrics bar: Sources found, Claims created, Verified count, Conflicts found, Runtime, Estimated Cost.
  - Live updates via SSE from `GET /api/research/:id/stream`.

- [x] #### [NEW] [frontend/src/app/research/[id]/run/[agent]/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/research/%5Bid%5D/run/%5Bagent%5D/page.tsx) — **Agent Inspector** `/research/:id/run/:agent`
  - Agent name, status, duration, sources/results produced.
  - Action log: what the agent did (not chain-of-thought).
  - Findings: structured output (e.g., for Verifier: claims evaluated / verified / rejected / uncertain, rejected claim details with reasons).
  - Links to evidence and source papers.

- [x] #### [NEW] [frontend/src/app/research/[id]/graph/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/research/%5Bid%5D/graph/page.tsx) — **Evidence Graph** `/research/:id/graph`
  - Interactive force-directed graph (via `react-flow` or `d3-force`) showing:
    - Research Question → Hypotheses → Claims → Evidence → Papers → Contradictions.
  - Click any node to open right-side detail panel:
    - For Claims: statement, confidence bar, verification status, supporting evidence excerpts, contradicting evidence excerpts, verification checks (✓ Source exists, ✓ Claim supported, ⚠ Limited generalization).
  - Collapsible claim list sidebar: `✓ C-001`, `✓ C-002`, `⚠ C-003`, `✕ C-004` — clicking centers graph on that claim.

- [x] #### [NEW] [frontend/src/app/research/[id]/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/research/%5Bid%5D/page.tsx) — **Final Research Report** `/research/:id`
  - Header: Research title, metrics (sources count, verified claims, runtime).
  - Body sections: Executive Summary, Key Findings (with confidence level, source count, `[View Evidence]` links), Research Gaps, Limitations, Full Sources list.
  - Action bar: Export PDF, Export Markdown, Share Report, View Research Process, View Evidence Graph.

- [x] #### [NEW] [frontend/src/app/history/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/history/page.tsx) — **Research History** `/history`
  - Research cards: title, status, source count, date, runtime, open button.
  - Filter tabs: All / Running / Completed / Failed.

- [x] #### [NEW] [frontend/src/app/settings/page.tsx](file:///home/adi/Desktop/Hackathons/research-agent/frontend/src/app/settings/page.tsx) — **Settings** `/settings`
  - Model Settings: Default model, Research model, Verification model.
  - Research Settings: Default depth, Preferred sources, Max iterations.
  - Cost Settings: Max run cost, Cost warning threshold.

- [x] #### Shared Components
  - `frontend/src/components/Sidebar.tsx` — Navigation sidebar.
  - `frontend/src/components/AgentNode.tsx` — Agent node component for react-flow canvas.
  - `frontend/src/components/MetricsBar.tsx` — Bottom metrics bar for live research.
  - `frontend/src/components/EvidencePanel.tsx` — Right-side detail panel for evidence graph.
  - `frontend/src/components/ResearchCard.tsx` — Reusable card for dashboard and history.

- [x] #### Design System
  - `frontend/src/app/globals.css` — Dark theme, glassmorphism cards, smooth gradients, micro-animations, Google Font (Inter).
  - Color palette: Deep navy background, emerald/teal accents for verified, amber for uncertain, red for failed.
  - Agent node states: Green glow (completed), blue pulse (running), gray (waiting), red border (failed).

---

## Implementation Priority

### Phase 1 — Backend Core (Build First)
- [x] Data models & schemas (`src/core/schemas.py`)
- [x] Updated state (`src/core/state.py`)
- [x] All 9 agent modules (planner through synthesizer)
- [x] LangGraph workflow & routing updates
- [x] Agent configurations & system prompts
- [x] FastAPI backend (`src/api.py`) with SSE streaming

### Phase 2 — Frontend MVP
- [x] Main Dashboard
- [x] Research Configuration page
- [x] Live Research Canvas (n8n-style agent flow with real-time SSE)
- [x] Final Research Report page
- [x] Evidence Graph with embedded evidence inspection

### Phase 3 — Polish & Secondary Pages
- [x] Agent Inspector
- [x] Research History
- [x] Settings page
- [x] Export (PDF/Markdown)
- [x] Design polish, animations, and responsive layout

---

## Verification Plan

### Automated Verification
- [x] Verify schemas & models: `python -c "from src.core.schemas import ResearchQuestion, Claim, Evidence; print('Schemas valid')"`
- [ ] Run test suite: `python -m unittest discover tests`
- [x] Verify FastAPI starts: `python -m uvicorn src.api:app --port 8000`
- [x] Verify frontend builds: `cd frontend && npm run build`

### Manual Verification
- [ ] Execute research query via the UI dashboard.
- [ ] Verify live research canvas shows real-time agent state transitions via SSE.
- [ ] Verify `Literature Researcher` finds papers/sources.
- [ ] Verify `Challenger Agent` searches for counter-evidence.
- [ ] Verify `Verifier Agent` validates claims with `PASS`/`FAIL` metrics.
- [ ] Verify Evidence Graph renders interactive claim → evidence → source nodes.
- [ ] Inspect the generated research brief on the Final Report page.
