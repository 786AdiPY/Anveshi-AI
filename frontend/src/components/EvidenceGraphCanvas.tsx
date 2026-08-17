"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useReactFlow,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { EvidencePanel, type GraphNodeData } from "@/components/EvidencePanel";

export type GraphEdgeData = { id: string; source: string; target: string; type: string };

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

const LEGEND: { label: string; color: string }[] = [
  { label: "Claim", color: TYPE_COLOR.claim },
  { label: "Contradicts", color: TYPE_COLOR.contradiction },
  { label: "Source", color: TYPE_COLOR.paper },
  { label: "Hypothesis", color: TYPE_COLOR.hypothesis },
];

function CanvasInner({
  nodesData,
  edgesData,
  showClaimList,
}: {
  nodesData: GraphNodeData[];
  edgesData: GraphEdgeData[];
  showClaimList: boolean;
}) {
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
    <div className={showClaimList ? "graph-layout" : "graph-layout graph-layout--no-list"}>
      {showClaimList && (
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
      )}

      <div>
        <div className="graph-legend">
          {LEGEND.map(({ label, color }) => (
            <span key={label} className="graph-legend__item">
              <i style={{ background: color }} /> {label}
            </span>
          ))}
        </div>
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
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>

      {selected && <EvidencePanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export function EvidenceGraphCanvas({
  nodesData,
  edgesData,
  showClaimList = true,
}: {
  nodesData: GraphNodeData[];
  edgesData: GraphEdgeData[];
  showClaimList?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner nodesData={nodesData} edgesData={edgesData} showClaimList={showClaimList} />
    </ReactFlowProvider>
  );
}
