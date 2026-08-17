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
import { AlertCircle, ArrowLeft, Pencil } from "lucide-react";
import { api, type AgentUpdateEvent } from "@/lib/api";
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
  supervisor_agent: { x: 260, y: 160 },
  literature_agent: { x: 540, y: 0 },
  extractor_agent: { x: 540, y: 160 },
  challenger_agent: { x: 540, y: 320 },
  ledger_agent: { x: 820, y: 160 },
  verifier_agent: { x: 1080, y: 160 },
  synthesizer_agent: { x: 1360, y: 80 },
  evidence_graph_agent: { x: 1360, y: 260 },
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

export default function LiveRunPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<AgentUpdateEvent[]>([]);
  const [status, setStatus] = useState<"pending" | "running" | "completed" | "failed">("pending");
  const [error, setError] = useState<string | null>(null);
  // Seeded from the server's started_at/created_at once the run is fetched
  // below, not Date.now() at mount — this component remounts every time the
  // user navigates to an agent inspector and back, and a mount-time clock
  // would restart the timer on every visit instead of tracking the real run.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [question, setQuestion] = useState<string | null>(null);
  const [depth, setDepth] = useState("standard");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api
      .getRun(id)
      .then((run) => {
        const anchor = run.started_at ?? run.created_at;
        if (anchor) setStartedAt(new Date(anchor).getTime());
        setStatus(run.status);
        setQuestion(run.question);
        setDepth(run.depth);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  // tick only forces a re-render each second; the actual value is always
  // computed fresh from the wall clock so it's correct immediately, not just
  // after the first interval fires.
  const runtime = startedAt !== null ? (Date.now() - startedAt) / 1000 : 0;
  void tick;

  useEffect(() => {
    const es = new EventSource(api.streamUrl(id));
    esRef.current = es;

    es.addEventListener("agent_update", (e) => {
      const payload: AgentUpdateEvent = JSON.parse((e as MessageEvent).data);
      setEvents((prev) => [...prev, payload]);
      setStatus("running");
    });

    es.addEventListener("status_change", (e) => {
      const payload = JSON.parse((e as MessageEvent).data);
      setStatus(payload.status);
      setError(payload.error ?? null);
      es.close();
      if (payload.status === "completed") {
        setTimeout(() => router.push(`/research/${id}`), 900);
      }
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [id, router]);

  const latest = events[events.length - 1];

  const nodeStatuses = useMemo(() => {
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

  const nodes: Node[] = AGENT_ORDER.map((key) => ({
    id: key,
    type: "agent",
    position: AGENT_POSITION[key],
    data: {
      label: AGENT_LABEL[key],
      status: nodeStatuses[key],
    } as AgentNodeData,
  }));

  const edges: Edge[] = EDGES.map(([source, target]) => ({
    id: `${source}-${target}`,
    source,
    target,
    animated: nodeStatuses[source] === "running" || nodeStatuses[target] === "running",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "var(--border-color)" },
  }));

  return (
    <main className="page-container run-page">
      <div className="run-header">
        <div className="run-header-left">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} /> Back
          </Link>
          <span className={`status-badge status-badge-${status}`}>● {status}</span>
        </div>
        {status === "failed" && error && (
          <div className="run-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}
      </div>

      {question && (
        <div className="run-question">
          <p>{question}</p>
          <Link
            href={`/?q=${encodeURIComponent(question)}&depth=${depth}`}
            className="button-secondary"
          >
            <Pencil size={13} /> Edit &amp; start new run
          </Link>
        </div>
      )}

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
          <Background gap={24} color="rgba(255,255,255,0.05)" />
        </ReactFlow>
      </div>

      <MetricsBar
        papers={latest?.papers_count ?? 0}
        claims={latest?.claims_count ?? 0}
        verified={latest?.verified_count ?? 0}
        contradictions={latest?.contradictions_count ?? 0}
        runtimeSeconds={runtime}
      />
    </main>
  );
}
