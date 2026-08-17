"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useReactFlow,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { EvidencePanel, type GraphNodeData } from "@/components/EvidencePanel";

const COLUMN: Record<string, number> = {
  question: 0,
  hypothesis: 1,
  claim: 2,
  evidence: 3,
  paper: 4,
  contradiction: 5,
};

const TYPE_COLOR: Record<string, string> = {
  question: "var(--accent-purple)",
  hypothesis: "var(--accent-blue)",
  claim: "var(--accent-cyan)",
  evidence: "var(--text-secondary)",
  paper: "var(--accent-emerald)",
  contradiction: "var(--accent-rose)",
};

const claimIcon: Record<string, React.ReactNode> = {
  PASS: <CheckCircle2 size={13} color="var(--accent-emerald)" />,
  FAIL: <XCircle size={13} color="var(--accent-rose)" />,
  UNCERTAIN: <AlertTriangle size={13} color="var(--accent-amber)" />,
  PENDING: <AlertTriangle size={13} color="var(--text-muted)" />,
};

function GraphInner({ nodesData, edgesData }: { nodesData: GraphNodeData[]; edgesData: { id: string; source: string; target: string; type: string }[] }) {
  const { fitView } = useReactFlow();
  const [selected, setSelected] = useState<GraphNodeData | null>(null);

  // Lay nodes out in columns by type. Row index is derived per render from a
  // local tally so positions stay stable and never accumulate across renders.
  const nodes: Node[] = useMemo(() => {
    const rowsPerColumn: Record<number, number> = {};
    return nodesData.map((n) => {
      const col = COLUMN[n.type] ?? 6;
      const row = rowsPerColumn[col] ?? 0;
      rowsPerColumn[col] = row + 1;
      return {
        id: n.id,
        position: { x: col * 260, y: row * 90 },
        data: { label: n.label },
        style: {
          background: "var(--bg-card)",
          border: `1.5px solid ${TYPE_COLOR[n.type] ?? "var(--border-color)"}`,
          borderRadius: 10,
          color: "var(--text-primary)",
          fontSize: 12,
          width: 220,
          padding: 8,
        },
      };
    });
  }, [nodesData]);

  const edges: Edge[] = edgesData.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: {
      stroke: e.type === "contradicts" ? "var(--accent-rose)" : "var(--border-color)",
    },
  }));

  const claims = nodesData.filter((n) => n.type === "claim");

  function focusNode(node: GraphNodeData) {
    setSelected(node);
    fitView({ nodes: [{ id: node.id }], duration: 400, maxZoom: 1.2 });
  }

  return (
    <div className="graph-layout">
      <aside className="claim-list-panel glass-card">
        <h3>Claims</h3>
        <ul>
          {claims.map((c) => (
            <li key={c.id}>
              <button onClick={() => focusNode(c)} className="claim-list-item">
                {claimIcon[String(c.data.verification_status ?? "PENDING")]}
                <span>{c.label}</span>
              </button>
            </li>
          ))}
          {claims.length === 0 && <p className="muted">No claims yet.</p>}
        </ul>
      </aside>

      <div className="canvas-wrapper glass-card">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, node) => {
            const match = nodesData.find((n) => n.id === node.id);
            if (match) focusNode(match);
          }}
        >
          <Background gap={24} color="rgba(255,255,255,0.05)" />
        </ReactFlow>
      </div>

      {selected && <EvidencePanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function EvidenceGraphPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ nodes: GraphNodeData[]; edges: { id: string; source: string; target: string; type: string }[] } | null>(null);

  useEffect(() => {
    api.getGraph(id).then((d) => setData(d as never)).catch(() => setData({ nodes: [], edges: [] }));
  }, [id]);

  if (!data) return <main className="page-container"><p className="muted">Loading graph…</p></main>;

  return (
    <main className="page-container run-page">
      <Link href={`/research/${id}`} className="back-link">
        <ArrowLeft size={15} /> Back to report
      </Link>
      <h1 className="graph-title">Evidence Graph</h1>
      <ReactFlowProvider>
        <GraphInner nodesData={data.nodes} edgesData={data.edges} />
      </ReactFlowProvider>
    </main>
  );
}
