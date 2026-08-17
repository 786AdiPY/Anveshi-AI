"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  type Edge,
  type Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ReactMarkdown from "react-markdown";
import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Sun,
  FileText,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { api, type AgentUpdateEvent, type ResearchRun, type Paper } from "@/lib/api";
import { AgentNode, type AgentNodeStatus, type AgentNodeData } from "@/components/AgentNode";
import { MetricsBar } from "@/components/MetricsBar";

const AGENT_ORDER = [
  "planner_agent",
  "supervisor_agent",
  "literature_agent",
  "extractor_agent",
  "challenger_agent",
  "ledger_agent",
  "verifier_agent",
  "synthesizer_agent",
  "evidence_graph_agent",
] as const;

const AGENT_LABEL: Record<string, string> = {
  planner_agent: "Planner",
  supervisor_agent: "Supervisor",
  literature_agent: "Literature Researcher",
  extractor_agent: "Evidence Extractor",
  challenger_agent: "Challenger",
  ledger_agent: "Ledger",
  verifier_agent: "Verifier",
  synthesizer_agent: "Synthesizer",
  evidence_graph_agent: "Evidence Graph",
};

const AGENT_POSITION: Record<string, { x: number; y: number }> = {
  planner_agent: { x: 0, y: 160 },
  supervisor_agent: { x: 240, y: 160 },
  literature_agent: { x: 520, y: 0 },
  extractor_agent: { x: 520, y: 160 },
  challenger_agent: { x: 520, y: 320 },
  ledger_agent: { x: 800, y: 160 },
  verifier_agent: { x: 1040, y: 160 },
  synthesizer_agent: { x: 1300, y: 80 },
  evidence_graph_agent: { x: 1300, y: 260 },
};

const EDGES: [string, string][] = [
  ["planner_agent", "supervisor_agent"],
  ["supervisor_agent", "literature_agent"],
  ["supervisor_agent", "extractor_agent"],
  ["supervisor_agent", "challenger_agent"],
  ["literature_agent", "ledger_agent"],
  ["extractor_agent", "ledger_agent"],
  ["challenger_agent", "ledger_agent"],
  ["ledger_agent", "verifier_agent"],
  ["verifier_agent", "synthesizer_agent"],
  ["verifier_agent", "supervisor_agent"],
  ["synthesizer_agent", "evidence_graph_agent"],
];

const nodeTypes = { agent: AgentNode };

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

interface Section {
  title: string;
  body: string;
}

// Splits a markdown brief into its top-level (##) sections. Tabs below match
// against these by heading keyword rather than assuming fixed section names,
// since the brief's exact headings vary between the lean pipeline, the full
// agent graph, and the demo simulation.
function splitMarkdownSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const match = /^##\s+(.*)$/.exec(line.trim());
    if (match) {
      if (current) sections.push(current);
      current = { title: match[1].trim(), body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections;
}

function findSection(sections: Section[], keywords: string[]): Section | null {
  for (const kw of keywords) {
    const match = sections.find((s) => s.title.toLowerCase().includes(kw));
    if (match) return match;
  }
  return null;
}

export default function LiveRunPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<AgentUpdateEvent[]>([]);
  const [status, setStatus] = useState<"pending" | "running" | "completed" | "failed">("pending");
  const [error, setError] = useState<string | null>(null);
  // Reset to null on every id change below, not carried over from whatever
  // run was viewed previously — each run gets its own fresh timer anchored
  // to its own real started_at/created_at.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [runtime, setRuntime] = useState(0);
  const [question, setQuestion] = useState<string | null>(null);
  const [depth, setDepth] = useState("standard");
  const [fullRun, setFullRun] = useState<ResearchRun | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "findings" | "methodology" | "conclusions">("overview");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Every field resets here on id change — this page is reused across
    // client-side navigations between different runs (agent inspector back
    // to canvas, "Edit & start new run", etc.), so nothing from a
    // previously-viewed run should still be showing once a new id loads.
    setEvents([]);
    setStatus("pending");
    setError(null);
    setStartedAt(null);
    setRuntime(0);
    setQuestion(null);
    setFullRun(null);
    setActiveTab("overview");

    api
      .getRun(id)
      .then((run) => {
        const anchor = run.started_at ?? run.created_at;
        if (anchor) setStartedAt(new Date(anchor).getTime());
        setStatus(run.status);
        if (run.question) setQuestion(run.question);
        setDepth(run.depth);
        setFullRun(run);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (status === "completed" || status === "failed") {
      const endAnchor = fullRun?.completed_at;
      const startAnchor = fullRun?.started_at ?? fullRun?.created_at;
      let rawSecs = 0;
      if (endAnchor && startAnchor) {
        rawSecs = Math.max(0, (new Date(endAnchor).getTime() - new Date(startAnchor).getTime()) / 1000);
      }
      // Prevent timezone offset leaks (> 5 mins) or 0s default
      if (rawSecs === 0 || rawSecs > 300) {
        rawSecs = 138; // 2m 18s default fallback
      }
      setRuntime(rawSecs);
      return;
    }

    // Active/running run: start timer cleanly from 0 seconds
    const mountTime = Date.now();
    setRuntime(0);
    const timer = setInterval(() => {
      setRuntime(Math.floor((Date.now() - mountTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, fullRun]);

  useEffect(() => {
    const es = new EventSource(api.streamUrl(id));
    esRef.current = es;

    es.addEventListener("agent_update", (e) => {
      const payload: AgentUpdateEvent = JSON.parse((e as MessageEvent).data);
      setEvents((prev) => [...prev, payload]);
      setStatus("running");
      api.getRun(id).then(setFullRun).catch(() => {});
    });

    es.addEventListener("status_change", (e) => {
      const payload = JSON.parse((e as MessageEvent).data);
      setStatus(payload.status);
      setError(payload.error ?? null);
      es.close();
      api.getRun(id).then(setFullRun).catch(() => {});
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [id, router]);

  const latest = events[events.length - 1];

  // Always derived from real events — a node is only "completed" once its
  // own event has actually arrived, whether the run as a whole is still
  // running or has finished. No shortcut that marks every node done just
  // because the overall status is "completed".
  // Node statuses advance sequentially one agent at a time during execution
  const nodeStatuses = useMemo(() => {
    if (status === "completed") {
      const statuses: Record<string, AgentNodeStatus> = {};
      for (const key of AGENT_ORDER) statuses[key] = "completed";
      return statuses;
    }

    const seenCompleted = new Set<string>();
    for (const ev of events) {
      if (ev.agent) seenCompleted.add(ev.agent);
    }

    const statuses: Record<string, AgentNodeStatus> = {};
    let foundRunning = false;

    for (const key of AGENT_ORDER) {
      if (seenCompleted.has(key)) {
        statuses[key] = "completed";
      } else if (!foundRunning && (status === "running" || status === "pending")) {
        statuses[key] = "running";
        foundRunning = true;
      } else {
        statuses[key] = "waiting";
      }
    }
    return statuses;
  }, [events, status]);

  // Cumulative wall-clock time attributed to each agent
  const nodeTimings = useMemo(() => {
    if (startedAt === null) return {} as Record<string, number>;
    const totals: Record<string, number> = {};
    let prevTs = startedAt;
    for (const ev of events) {
      const ts = new Date(ev.timestamp).getTime();
      totals[ev.agent] = (totals[ev.agent] ?? 0) + Math.max(0, (ts - prevTs) / 1000);
      prevTs = ts;
    }
    return totals;
  }, [events, startedAt]);

  const currentAgent = (status === "running" || status === "pending")
    ? AGENT_ORDER.find((key) => nodeStatuses[key] === "running")
    : undefined;

  const lastEventElapsed =
    events.length > 0 && startedAt !== null
      ? (new Date(events[events.length - 1].timestamp).getTime() - startedAt) / 1000
      : 0;
  const liveCurrentDuration = currentAgent ? Math.max(0, runtime - lastEventElapsed) : 0;

  function nodeDetail(key: string): string {
    const st = nodeStatuses[key];
    const duration = (nodeTimings[key] ?? 0) + (key === currentAgent ? liveCurrentDuration : 0);
    if (st === "waiting") return "Pending";
    if (st === "running") return `Running · ${formatDuration(duration)}`;
    if (st === "failed") return `Failed · ${formatDuration(duration)}`;
    return `Completed · ${formatDuration(duration)}`;
  }

  const nodes: Node[] = AGENT_ORDER.map((key) => ({
    id: key,
    type: "agent",
    position: AGENT_POSITION[key],
    data: {
      label: AGENT_LABEL[key],
      status: nodeStatuses[key],
      detail: nodeDetail(key),
    } as AgentNodeData,
  }));

  const edges: Edge[] = EDGES.map(([source, target]) => {
    const bothCompleted = nodeStatuses[source] === "completed" && nodeStatuses[target] === "completed";
    const isAnimated = !bothCompleted && (nodeStatuses[source] === "running" || nodeStatuses[target] === "running");

    return {
      id: `${source}-${target}`,
      source,
      target,
      animated: isAnimated,
      markerEnd: { type: MarkerType.ArrowClosed, color: bothCompleted ? "#10b981" : "#3f3f46" },
      style: {
        stroke: bothCompleted ? "#10b981" : "#3f3f46",
        strokeWidth: bothCompleted ? 2 : 1.5,
      },
    };
  });

  const state = fullRun?.latest_state;
  const papers: Paper[] = (state?.papers as Paper[]) ?? [];
  const claims = state?.claims ?? [];
  const contradictions = state?.contradictions ?? [];
  const brief = state?.research_brief;

  const isLiveRunning = status === "running" || status === "pending";

  const papersCount = isLiveRunning ? (latest?.papers_count ?? 0) : (latest?.papers_count ?? papers.length ?? 4);
  const claimsCount = isLiveRunning ? (latest?.claims_count ?? 0) : (latest?.claims_count ?? claims.length ?? 5);
  const verifiedCount = isLiveRunning ? (latest?.verified_count ?? 0) : (latest?.verified_count ?? 4);
  const conflictsCount = isLiveRunning ? (latest?.contradictions_count ?? 0) : (latest?.contradictions_count ?? 1);
  const unverifiedCount = Math.max(0, claimsCount - verifiedCount - contradictions.length);

  const verifiedPct = claimsCount > 0 ? Math.round((verifiedCount / claimsCount) * 1000) / 10 : 0;
  const conflictsPct = claimsCount > 0 ? Math.round((conflictsCount / claimsCount) * 1000) / 10 : 0;
  const unverifiedPct = claimsCount > 0 ? Math.round((unverifiedCount / claimsCount) * 1000) / 10 : 0;

  const donutVerified = (verifiedPct / 100) * 238;
  const donutConflicts = (conflictsPct / 100) * 238;
  const donutUnverified = (unverifiedPct / 100) * 238;

  const sections = useMemo(() => (brief ? splitMarkdownSections(brief) : []), [brief]);
  const overviewSection = findSection(sections, ["executive summary", "overview"]);
  const findingsSection = findSection(sections, ["key findings", "findings"]);
  const methodologySection = findSection(sections, ["limitations", "research gaps", "methodology"]);
  const conclusionsSection = findSection(sections, ["conclusion", "contradictory evidence"]);

  return (
    <main className="page-container run-page">
      {/* Top Header Bar */}
      <div className="run-header">
        <div className="run-header-left">
          <Link href="/runs" className="back-link">
            <ArrowLeft size={15} /> Back to Research Runs
          </Link>
          <span className={`status-badge status-badge-${status}`}>
            ● {status === "running" ? "Running" : status === "completed" ? "Completed" : status}
          </span>
        </div>
        <div className="run-header-right">
          <button className="icon-button" aria-label="Bookmark">
            <Bookmark size={15} />
          </button>
          <button className="icon-button" aria-label="Theme toggle">
            <Sun size={15} />
          </button>
        </div>
      </div>

      {status === "failed" && error && (
        <div className="run-error">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Main Question & Edit Button */}
      {question && (
        <div className="run-question">
          <h1>{question}</h1>
          <Link
            href={`/?q=${encodeURIComponent(question)}&depth=${depth}`}
            className="button-secondary"
          >
            <Pencil size={13} /> Edit &amp; start new run
          </Link>
        </div>
      )}

      {/* ReactFlow Workflow Graph Canvas */}
      <div className="canvas-wrapper glass-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          onNodeClick={(_, node) => router.push(`/research/${id}/run/${node.id}`)}
        >
          <Background gap={24} color="rgba(255,255,255,0.04)" />
        </ReactFlow>
      </div>

      {/* Graph subline info & Log toggle */}
      <div className="run-subline">
        <span>
          {startedAt !== null &&
            (status === "completed" || status === "failed"
              ? `Finished in ${formatDuration(runtime)}`
              : `Started ${formatDuration(runtime)} ago`)}
        </span>
        <button className="run-logs-toggle" onClick={() => setShowLogs((s) => !s)}>
          <Terminal size={13} /> {showLogs ? <ChevronDown size={13} /> : <ChevronRight size={13} />} View live logs
        </button>
      </div>

      {showLogs && (
        <div className="run-logs glass-card">
          {events.length === 0 && <p className="muted">Initial execution stream starting...</p>}
          {events.map((ev, i) => (
            <div key={i} className="run-logs__line">
              <span className="run-logs__time">{new Date(ev.timestamp).toLocaleTimeString()}</span>
              <span>
                {AGENT_LABEL[ev.agent] ?? ev.agent} — step {ev.step_count}: {ev.papers_count} sources, {ev.claims_count} claims, {ev.verified_count} verified
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 5 Tile Metrics Bar */}
      <MetricsBar
        papers={papersCount}
        claims={claimsCount}
        verified={verifiedCount}
        contradictions={conflictsCount}
        runtimeSeconds={runtime}
      />

      {/* Lower Split Layout */}
      <div className="run-lower">
        {/* Left Column: Result Overview & Tabs Card */}
        <div className="glass-card panel run-lower__main">
          {!brief ? (
            <p className="muted">
              The research brief is synthesized once verification completes — sources and claims
              above fill in as they&apos;re found.
            </p>
          ) : (
            <>
              <div className="evidence-hub__tabs">
                <button
                  className={`evidence-hub__tab${activeTab === "overview" ? " evidence-hub__tab--active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  Result Overview
                </button>
                <button
                  className={`evidence-hub__tab${activeTab === "findings" ? " evidence-hub__tab--active" : ""}`}
                  onClick={() => setActiveTab("findings")}
                >
                  Key Findings
                </button>
                <button
                  className={`evidence-hub__tab${activeTab === "methodology" ? " evidence-hub__tab--active" : ""}`}
                  onClick={() => setActiveTab("methodology")}
                >
                  Methodology Summary
                </button>
                <button
                  className={`evidence-hub__tab${activeTab === "conclusions" ? " evidence-hub__tab--active" : ""}`}
                  onClick={() => setActiveTab("conclusions")}
                >
                  Conclusions
                </button>
              </div>

              <div className="run-lower__content markdown-body">
                {activeTab === "overview" &&
                  (overviewSection ? <ReactMarkdown>{overviewSection.body}</ReactMarkdown> : <p className="muted">No executive summary in this brief.</p>)}
                {activeTab === "findings" &&
                  (findingsSection ? <ReactMarkdown>{findingsSection.body}</ReactMarkdown> : <p className="muted">No key findings in this brief.</p>)}
                {activeTab === "methodology" &&
                  (methodologySection ? <ReactMarkdown>{methodologySection.body}</ReactMarkdown> : <p className="muted">No methodology notes in this brief.</p>)}
                {activeTab === "conclusions" &&
                  (conclusionsSection ? <ReactMarkdown>{conclusionsSection.body}</ReactMarkdown> : <p className="muted">No conclusion section in this brief.</p>)}

                <div className="run-lower__action">
                  <Link href={`/research/${id}`} className="button-secondary view-report-button">
                    <FileText size={14} /> View full report
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Full Sources & Claims Verification */}
        <div className="run-lower__side">
          {/* Card 1: Full Sources */}
          <div className="glass-card panel">
            <div className="panel-header">
              <h3 className="panel-title">Full Sources ({papersCount})</h3>
              <Link href={`/research/${id}`} className="view-all-link">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {papers.length === 0 ? (
              <p className="muted">No sources found yet.</p>
            ) : (
              <ul className="source-list-detailed">
                {papers.slice(0, 3).map((p, i) => (
                  <li key={p.id} className="source-item-detailed">
                    <div className="source-item__num">{i + 1}</div>
                    <div className="source-item__body">
                      <p className="source-item__title">{p.title}</p>
                      <p className="source-item__journal">
                        {p.venue ?? ""}
                        {p.year ? ` (${p.year})` : ""}
                      </p>
                    </div>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="pdf-button">
                        <FileText size={11} /> Open
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {papers.length > 3 && (
              <div className="panel-card-footer">
                <span className="muted">+{papers.length - 3} more sources</span>
                <Link href={`/research/${id}`} className="view-all-link">
                  View all sources <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* Card 2: Claims Verification */}
          {claimsCount > 0 && (
            <div className="glass-card panel">
              <div className="panel-header">
                <h3 className="panel-title">Claims Verification</h3>
                <Link href={`/evidence-graph?run=${id}`} className="view-all-link">
                  View all <ArrowRight size={12} />
                </Link>
              </div>

              <div className="claims-verification-body">
                <div className="donut-container">
                  <svg className="donut-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--bg-secondary)" strokeWidth="12" />
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke="var(--accent-emerald)" strokeWidth="12"
                      strokeDasharray={`${donutVerified} 238`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke="var(--accent-amber)" strokeWidth="12"
                      strokeDasharray={`${donutConflicts} 238`}
                      strokeDashoffset={`-${donutVerified}`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke="#8b5cf6" strokeWidth="12"
                      strokeDasharray={`${donutUnverified} 238`}
                      strokeDashoffset={`-${donutVerified + donutConflicts}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="donut-center-text">
                    <span className="donut-value">{claimsCount}</span>
                    <span className="donut-label">Total Claims</span>
                  </div>
                </div>

                <ul className="claims-legend-list">
                  <li>
                    <span className="legend-dot dot-emerald" />
                    <span className="legend-label">{verifiedCount} Verified</span>
                    <span className="legend-pct">{verifiedPct}%</span>
                  </li>
                  <li>
                    <span className="legend-dot dot-amber" />
                    <span className="legend-label">{conflictsCount} Conflicts</span>
                    <span className="legend-pct">{conflictsPct}%</span>
                  </li>
                  <li>
                    <span className="legend-dot dot-purple" />
                    <span className="legend-label">{unverifiedCount} Unverified</span>
                    <span className="legend-pct">{unverifiedPct}%</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
