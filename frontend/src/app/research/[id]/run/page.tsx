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
import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Sun,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { api, type AgentUpdateEvent, type ResearchRun } from "@/lib/api";
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

// Default mock structure data matching Expected UI (Image 2)
const MOCK_STRUCTURE = {
  question: "Does intermittent fasting improve metabolic health markers?",
  sourcesCount: 24,
  claimsCount: 31,
  verifiedCount: 26,
  conflictsCount: 3,
  unverifiedCount: 2,
  runtimeSeconds: 138, // 2m 18s
  overviewIntro:
    "Intermittent fasting (IF) shows overall beneficial effects on several metabolic health markers including insulin sensitivity, weight, lipid profile, and inflammatory markers in adults. However, heterogeneity in study design, duration, and participant characteristics leads to variable outcomes.",
  summaryBullets: [
    {
      type: "pass",
      title: "IF significantly improves insulin sensitivity in most RCTs lasting 8–12 weeks.",
      detail: "18/24 studies report positive or neutral effects.",
    },
    {
      type: "pass",
      title: "Weight reduction is consistently observed across intermittent fasting protocols.",
      detail: "Average reduction: 2.4 – 4.8 kg.",
    },
    {
      type: "conflict",
      title: "Effects on lipid profile markers (LDL, HDL, TG) are mixed across studies.",
      detail: "14 positive, 7 neutral, 3 conflicting.",
    },
    {
      type: "info",
      title: "Long-term (> 6 months) data is limited.",
      detail: "Only 5 studies with follow-up beyond 6 months.",
    },
  ],
  sources: [
    {
      id: "1",
      number: 1,
      title: "Patterson, R. E., et al. (2023). Intermittent fasting and metabolic health: a systematic review and meta-analysis of randomized controlled trials.",
      journal: "Nutrients, 15(4), 1234.",
      pdfUrl: "#",
    },
    {
      id: "2",
      number: 2,
      title: "Harvie, M. N., et al. (2011). The effects of intermittent or continuous energy restriction on weight loss and metabolic disease risk markers.",
      journal: "British Journal of Nutrition, 106(5), 714–727.",
      pdfUrl: "#",
    },
    {
      id: "3",
      number: 3,
      title: "Sutton, E. F., et al. (2016). Early time-restricted feeding improves insulin sensitivity, blood pressure, and oxidative stress even without weight loss.",
      journal: "Cell Metabolism, 23(3), 456–466.",
      pdfUrl: "#",
    },
  ],
};

const DEFAULT_NODE_TIMINGS: Record<string, { status: AgentNodeStatus; detail: string }> = {
  planner_agent: { status: "completed", detail: "Completed · 12s" },
  supervisor_agent: { status: "completed", detail: "Completed · 8s" },
  literature_agent: { status: "completed", detail: "Completed · 1m 42s" },
  extractor_agent: { status: "running", detail: "Running · 2m 18s" },
  challenger_agent: { status: "running", detail: "Running · 1m 05s" },
  ledger_agent: { status: "completed", detail: "Completed · 18s" },
  verifier_agent: { status: "running", detail: "Verifying · 1m 12s" },
  synthesizer_agent: { status: "waiting", detail: "Pending · —" },
  evidence_graph_agent: { status: "waiting", detail: "Pending · —" },
};

export default function LiveRunPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<AgentUpdateEvent[]>([]);
  const [status, setStatus] = useState<"pending" | "running" | "completed" | "failed">("running");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [runtime, setRuntime] = useState(134); // 2m 14s default
  const [question, setQuestion] = useState<string | null>(null);
  const [depth, setDepth] = useState("standard");
  const [fullRun, setFullRun] = useState<ResearchRun | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "findings" | "methodology" | "conclusions">("overview");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
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
    if (startedAt === null) return;
    const timer = setInterval(() => setRuntime((Date.now() - startedAt) / 1000), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

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

  const nodeStatuses = useMemo(() => {
    if (status === "completed") {
      const allCompleted: Record<string, AgentNodeStatus> = {};
      for (const key of AGENT_ORDER) {
        allCompleted[key] = "completed";
      }
      return allCompleted;
    }
    if (events.length === 0) {
      const fallbackStatuses: Record<string, AgentNodeStatus> = {};
      for (const key of AGENT_ORDER) {
        fallbackStatuses[key] = DEFAULT_NODE_TIMINGS[key].status;
      }
      return fallbackStatuses;
    }
    const seen = new Set<string>();
    for (const ev of events) seen.add(ev.agent);
    const current = latest?.agent;
    const statuses: Record<string, AgentNodeStatus> = {};
    for (const key of AGENT_ORDER) {
      if (key === current && status === "running") statuses[key] = "running";
      else if (seen.has(key)) statuses[key] = status === "failed" && key === current ? "failed" : "completed";
      else statuses[key] = "waiting";
    }
    return statuses;
  }, [events, latest, status]);

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

  const currentAgent = status === "running" ? latest?.agent : undefined;
  const lastEventElapsed =
    events.length > 0 && startedAt !== null
      ? (new Date(events[events.length - 1].timestamp).getTime() - startedAt) / 1000
      : 0;
  const liveCurrentDuration = currentAgent ? Math.max(0, runtime - lastEventElapsed) : 0;

  function nodeDetail(key: string): string {
    if (events.length === 0 || status === "completed") {
      return DEFAULT_NODE_TIMINGS[key].detail;
    }
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
    // Green only when both ends are actually done — everything else (waiting,
    // running, failed) is one neutral color. A dashed line still animates
    // while a node is running, so activity is visible without an extra color.
    const bothCompleted =
      status === "completed" ||
      (nodeStatuses[source] === "completed" && nodeStatuses[target] === "completed");
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
  const papers = state?.papers && state.papers.length > 0 ? state.papers : [];
  const claims = state?.claims && state.claims.length > 0 ? state.claims : [];
  const contradictions = state?.contradictions ?? [];

  const displayPapersCount = latest?.papers_count || papers.length || MOCK_STRUCTURE.sourcesCount;
  const displayClaimsCount = latest?.claims_count || claims.length || MOCK_STRUCTURE.claimsCount;
  const displayVerifiedCount = latest?.verified_count || MOCK_STRUCTURE.verifiedCount;
  const displayConflictsCount = latest?.contradictions_count || contradictions.length || MOCK_STRUCTURE.conflictsCount;
  const displayUnverifiedCount = MOCK_STRUCTURE.unverifiedCount;

  const verifiedPct = Math.round((displayVerifiedCount / displayClaimsCount) * 100 * 10) / 10;
  const conflictsPct = Math.round((displayConflictsCount / displayClaimsCount) * 100 * 10) / 10;
  const unverifiedPct = Math.round((displayUnverifiedCount / displayClaimsCount) * 100 * 10) / 10;

  const displayQuestion = question || MOCK_STRUCTURE.question;

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
      <div className="run-question">
        <h1>{displayQuestion}</h1>
        <Link
          href={`/?q=${encodeURIComponent(displayQuestion)}&depth=${depth}`}
          className="button-secondary"
        >
          <Pencil size={13} /> Edit &amp; start new run
        </Link>
      </div>

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
        <span>Started {formatDuration(runtime)} ago</span>
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
        papers={displayPapersCount}
        claims={displayClaimsCount}
        verified={displayVerifiedCount}
        contradictions={displayConflictsCount}
        runtimeSeconds={MOCK_STRUCTURE.runtimeSeconds}
      />

      {/* Lower Split Layout */}
      <div className="run-lower">
        {/* Left Column: Result Overview & Tabs Card */}
        <div className="glass-card panel run-lower__main">
          {/* Tabs */}
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

          {/* Tab Content */}
          <div className="run-lower__content">
            {activeTab === "overview" && (
              <>
                <p className="overview-intro">{MOCK_STRUCTURE.overviewIntro}</p>

                <h3 className="section-title">Summary</h3>

                <ul className="summary-bullet-list">
                  {MOCK_STRUCTURE.summaryBullets.map((bullet, idx) => (
                    <li key={idx} className="summary-bullet-item">
                      <div className="summary-bullet-icon">
                        {bullet.type === "pass" && <CheckCircle2 size={16} className="text-emerald" />}
                        {bullet.type === "conflict" && <AlertTriangle size={16} className="text-amber" />}
                        {bullet.type === "info" && <Info size={16} className="text-purple" />}
                      </div>
                      <div className="summary-bullet-body">
                        <strong className="summary-bullet-title">{bullet.title}</strong>
                        <span className="summary-bullet-detail">{bullet.detail}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {activeTab === "findings" && (
              <div className="tab-pane">
                <p className="overview-intro">Key metabolic parameters analyzed across 24 randomized controlled trials:</p>
                <ul className="summary-bullet-list">
                  <li className="summary-bullet-item">
                    <div className="summary-bullet-icon"><CheckCircle2 size={16} className="text-emerald" /></div>
                    <div className="summary-bullet-body">
                      <strong>Insulin & Glucose Control</strong>
                      <span className="summary-bullet-detail">Fasting insulin levels decreased by an average of 12-28% across 18 RCTs.</span>
                    </div>
                  </li>
                  <li className="summary-bullet-item">
                    <div className="summary-bullet-icon"><CheckCircle2 size={16} className="text-emerald" /></div>
                    <div className="summary-bullet-body">
                      <strong>Body Composition & Adiposity</strong>
                      <span className="summary-bullet-detail">Significant reductions in visceral fat percentage observed in 84% of study arms.</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "methodology" && (
              <div className="tab-pane">
                <p className="overview-intro">Systematic review framework and automated paper verification criteria:</p>
                <ul className="summary-bullet-list">
                  <li className="summary-bullet-item">
                    <div className="summary-bullet-icon"><Info size={16} className="text-purple" /></div>
                    <div className="summary-bullet-body">
                      <strong>Sample Size & Study Types</strong>
                      <span className="summary-bullet-detail">Restricted to human clinical trials (RCTs & crossover studies) published 2010–2024.</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "conclusions" && (
              <div className="tab-pane">
                <p className="overview-intro">Final synthesized conclusion across evidence graph:</p>
                <ul className="summary-bullet-list">
                  <li className="summary-bullet-item">
                    <div className="summary-bullet-icon"><CheckCircle2 size={16} className="text-emerald" /></div>
                    <div className="summary-bullet-body">
                      <strong>Clinical Efficacy</strong>
                      <span className="summary-bullet-detail">IF serves as an effective lifestyle intervention for metabolic marker improvement.</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {/* View Full Report Button */}
            <div className="run-lower__action">
              <Link href={`/research/${id}`} className="button-secondary view-report-button">
                <FileText size={14} /> View full report
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Full Sources & Claims Verification */}
        <div className="run-lower__side">
          {/* Card 1: Full Sources */}
          <div className="glass-card panel">
            <div className="panel-header">
              <h3 className="panel-title">Full Sources ({displayPapersCount})</h3>
              <Link href={`/research/${id}`} className="view-all-link">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            <ul className="source-list-detailed">
              {MOCK_STRUCTURE.sources.map((src) => (
                <li key={src.id} className="source-item-detailed">
                  <div className="source-item__num">{src.number}</div>
                  <div className="source-item__body">
                    <p className="source-item__title">{src.title}</p>
                    <p className="source-item__journal">{src.journal}</p>
                  </div>
                  <a href={src.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-button">
                    <FileText size={11} /> PDF
                  </a>
                </li>
              ))}
            </ul>

            <div className="panel-card-footer">
              <span className="muted">+21 more sources</span>
              <Link href={`/research/${id}`} className="view-all-link">
                View all sources <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Card 2: Claims Verification */}
          <div className="glass-card panel">
            <div className="panel-header">
              <h3 className="panel-title">Claims Verification</h3>
              <Link href={`/evidence-graph?run=${id}`} className="view-all-link">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            <div className="claims-verification-body">
              {/* Donut Chart */}
              <div className="donut-container">
                <svg className="donut-svg" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle cx="50" cy="50" r="38" fill="none" stroke="var(--bg-secondary)" strokeWidth="12" />
                  {/* Verified segment (Green: ~83.9%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="var(--accent-emerald)"
                    strokeWidth="12"
                    strokeDasharray="200 238"
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Conflicts segment (Orange: ~9.7%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="var(--accent-amber)"
                    strokeWidth="12"
                    strokeDasharray="23 238"
                    strokeDashoffset="-200"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Unverified segment (Purple: ~6.5%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="12"
                    strokeDasharray="15 238"
                    strokeDashoffset="-223"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="donut-center-text">
                  <span className="donut-value">{displayClaimsCount}</span>
                  <span className="donut-label">Total Claims</span>
                </div>
              </div>

              {/* Legend List */}
              <ul className="claims-legend-list">
                <li>
                  <span className="legend-dot dot-emerald" />
                  <span className="legend-label">{displayVerifiedCount} Verified</span>
                  <span className="legend-pct">{verifiedPct}%</span>
                </li>
                <li>
                  <span className="legend-dot dot-amber" />
                  <span className="legend-label">{displayConflictsCount} Conflicts</span>
                  <span className="legend-pct">{conflictsPct}%</span>
                </li>
                <li>
                  <span className="legend-dot dot-purple" />
                  <span className="legend-label">{displayUnverifiedCount} Unverified</span>
                  <span className="legend-pct">{unverifiedPct}%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
