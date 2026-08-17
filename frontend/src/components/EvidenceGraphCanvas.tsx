"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useReactFlow,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CheckCircle2, XCircle, FileText, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { EvidencePanel, type GraphNodeData } from "@/components/EvidencePanel";

export type GraphEdgeData = { id: string; source: string; target: string; type: string };

/* -------------------------------------------------------------------------- */
/* Custom ReactFlow Nodes for Radial Mind-Map Evidence Network               */
/* -------------------------------------------------------------------------- */

function MainClaimNode({ data }: NodeProps & { data: { label: string } }) {
  return (
    <div className="graph-node-main-claim">
      <Handle type="target" position={Position.Top} className="graph-handle" />
      <Handle type="target" position={Position.Left} className="graph-handle" />
      <Handle type="source" position={Position.Right} className="graph-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-handle" />
      <span className="graph-node-main-claim__title">{data.label}</span>
    </div>
  );
}

function ClaimCustomNode({ data }: NodeProps & { data: { label: string; isContradicted?: boolean; verificationStatus?: string } }) {
  const isBad = data.isContradicted || data.verificationStatus === "FAIL";
  return (
    <div className={`graph-node-claim ${isBad ? "graph-node-claim--bad" : "graph-node-claim--good"}`}>
      <Handle type="target" position={Position.Top} className="graph-handle" />
      <Handle type="target" position={Position.Left} className="graph-handle" />
      <Handle type="source" position={Position.Right} className="graph-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-handle" />
      <span className="graph-node-claim__dot" />
      <span className="graph-node-claim__label">{data.label}</span>
    </div>
  );
}

function SourceCustomNode({ data }: NodeProps & { data: { label: string } }) {
  return (
    <div className="graph-node-source">
      <Handle type="target" position={Position.Top} className="graph-handle" />
      <Handle type="target" position={Position.Left} className="graph-handle" />
      <Handle type="source" position={Position.Right} className="graph-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-handle" />
      <FileText size={12} className="graph-node-source__icon" />
      <span className="graph-node-source__label">{data.label}</span>
    </div>
  );
}

const customNodeTypes = {
  mainClaim: MainClaimNode,
  claimNode: ClaimCustomNode,
  sourceNode: SourceCustomNode,
};

const LEGEND: { label: string; color: string }[] = [
  { label: "Supports", color: "#10b981" },
  { label: "Contradicts", color: "#ef4444" },
  { label: "Main Claim", color: "#a855f7" },
  { label: "Source", color: "#6b7280" },
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
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [selected, setSelected] = useState<GraphNodeData | null>(null);

  /* ------------------------------------------------------------------------ */
  /* Radial Layout Node Positioning                                            */
  /* ------------------------------------------------------------------------ */
  const { nodes, edges } = useMemo(() => {
    if (!nodesData || nodesData.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Separate main topic node vs claim nodes vs paper/source nodes
    let mainNode = nodesData.find((n) => n.type === "question" || n.type === "hypothesis");
    const claimNodes = nodesData.filter((n) => n.type === "claim");
    const paperNodes = nodesData.filter((n) => n.type === "paper" || n.type === "evidence");

    // If no explicit main node, treat first claim or synthesized topic as main node
    if (!mainNode) {
      mainNode = {
        id: "main_topic_node",
        type: "question",
        label: nodesData[0]?.label || "Research Topic",
        data: {},
      };
    }

    const CENTER_X = 500;
    const CENTER_Y = 270;

    const formattedNodes: Node[] = [];

    // 1. Center Main Claim Node
    formattedNodes.push({
      id: mainNode.id,
      type: "mainClaim",
      position: { x: CENTER_X - 70, y: CENTER_Y - 25 },
      data: { label: mainNode.label },
    });

    // Map paper connections to claims
    const papersByClaim = new Map<string, GraphNodeData[]>();
    edgesData.forEach((e) => {
      if (e.source.startsWith("paper_") || e.source.startsWith("paper")) {
        const list = papersByClaim.get(e.target) || [];
        const paperObj = paperNodes.find((p) => p.id === e.source);
        if (paperObj && !list.some((p) => p.id === paperObj.id)) {
          list.push(paperObj);
        }
        papersByClaim.set(e.target, list);
      }
    });

    // 2. Radial Ring 1: Claims around Center
    const numClaims = claimNodes.length || 1;
    const RX_CLAIM = 250;
    const RY_CLAIM = 160;

    claimNodes.forEach((c, idx) => {
      const angle = (2 * Math.PI * idx) / numClaims - Math.PI / 2;
      const cx = CENTER_X + RX_CLAIM * Math.cos(angle);
      const cy = CENTER_Y + RY_CLAIM * Math.sin(angle);

      const isContradicted =
        c.data.verification_status === "FAIL" ||
        edgesData.some((e) => e.target === c.id && e.type === "contradicts");

      formattedNodes.push({
        id: c.id,
        type: "claimNode",
        position: { x: cx - 80, y: cy - 20 },
        data: {
          label: c.label,
          isContradicted,
          verificationStatus: String(c.data.verification_status ?? "PASS"),
        },
      });

      // 3. Radial Ring 2: Sources near connected Claim Node
      const connectedPapers = papersByClaim.get(c.id) || [];
      const numPapers = connectedPapers.length;

      connectedPapers.forEach((p, pIdx) => {
        const angleSpread = 0.55;
        const startAngle = angle - (numPapers > 1 ? angleSpread / 2 : 0);
        const pAngle = startAngle + (numPapers > 1 ? (angleSpread * pIdx) / (numPapers - 1) : 0);

        const px = cx + 175 * Math.cos(pAngle);
        const py = cy + 130 * Math.sin(pAngle);

        if (!formattedNodes.some((n) => n.id === p.id)) {
          formattedNodes.push({
            id: p.id,
            type: "sourceNode",
            position: { x: px - 60, y: py - 18 },
            data: { label: p.label },
          });
        }
      });
    });

    // Add remaining orphan paper nodes
    paperNodes.forEach((p, pIdx) => {
      if (!formattedNodes.some((n) => n.id === p.id)) {
        const angle = (2 * Math.PI * pIdx) / (paperNodes.length || 1) + Math.PI / 4;
        formattedNodes.push({
          id: p.id,
          type: "sourceNode",
          position: { x: CENTER_X + 420 * Math.cos(angle) - 60, y: CENTER_Y + 260 * Math.sin(angle) - 18 },
          data: { label: p.label },
        });
      }
    });

    // 4. Edges construction
    const formattedEdges: Edge[] = [];

    // Center -> Claims edges
    claimNodes.forEach((c) => {
      const isContradicted =
        c.data.verification_status === "FAIL" ||
        edgesData.some((e) => e.target === c.id && e.type === "contradicts");

      formattedEdges.push({
        id: `e-main-${c.id}`,
        source: mainNode!.id,
        target: c.id,
        animated: false,
        style: {
          stroke: isContradicted ? "#ef4444" : "#10b981",
          strokeWidth: 1.8,
        },
      });
    });

    // Papers -> Claims edges
    edgesData.forEach((e) => {
      if (!formattedEdges.some((fe) => fe.id === e.id)) {
        formattedEdges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          style: {
            stroke: e.type === "contradicts" ? "#ef4444" : "#4b5563",
            strokeWidth: 1.2,
            strokeDasharray: e.type === "contradicts" ? "4,4" : undefined,
          },
        });
      }
    });

    return { nodes: formattedNodes, edges: formattedEdges };
  }, [nodesData, edgesData]);

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
                  {c.data.verification_status === "FAIL" ? (
                    <XCircle size={13} color="var(--accent-rose)" />
                  ) : (
                    <CheckCircle2 size={13} color="var(--accent-emerald)" />
                  )}
                  <span>{c.label}</span>
                </button>
              </li>
            ))}
            {claims.length === 0 && <p className="muted">No claims yet.</p>}
          </ul>
        </aside>
      )}

      <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
        {/* Top Control Bar with Legend & Zoom Controls matching Expected UI */}
        <div className="graph-toolbar">
          <div className="graph-legend">
            {LEGEND.map(({ label, color }) => (
              <span key={label} className="graph-legend__item">
                <i style={{ background: color }} /> {label}
              </span>
            ))}
          </div>
          <div className="graph-zoom-controls">
            <button className="graph-zoom-btn" onClick={() => zoomOut()} aria-label="Zoom out">
              <ZoomOut size={13} />
            </button>
            <span className="graph-zoom-val">100%</span>
            <button className="graph-zoom-btn" onClick={() => zoomIn()} aria-label="Zoom in">
              <ZoomIn size={13} />
            </button>
            <button className="graph-zoom-btn" onClick={() => fitView({ duration: 300 })} aria-label="Fit view">
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        <div className="canvas-wrapper glass-card">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={customNodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            nodesDraggable
            nodesConnectable={false}
            onNodeClick={(_, node) => {
              const match = nodesData.find((n) => n.id === node.id);
              if (match) focusNode(match);
            }}
          >
            <Background gap={24} color="rgba(255,255,255,0.06)" />
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
