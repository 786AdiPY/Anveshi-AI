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
import { FileText, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { EvidencePanel, type GraphNodeData } from "@/components/EvidencePanel";

export type GraphEdgeData = { id: string; source: string; target: string; type: string };

/* -------------------------------------------------------------------------- */
/* Custom ReactFlow Nodes for Knowledge Graph Network                         */
/* -------------------------------------------------------------------------- */

function MainClaimNode({ data }: NodeProps & { data: { label: string; stats?: string } }) {
  return (
    <div className="graph-node-main-claim">
      <Handle type="source" position={Position.Right} id="right" className="graph-handle" />
      <div className="graph-node-main-claim__badge">
        <span className="graph-node-main-claim__dot" />
        <span>MAIN RESEARCH QUESTION</span>
      </div>
      <div className="graph-node-main-claim__title">{data.label}</div>
      <div className="graph-node-main-claim__footer">
        {data.stats || "Core Hypothesis • Evidence Network"}
      </div>
    </div>
  );
}

function ClaimCustomNode({
  data,
}: NodeProps & {
  data: {
    label: string;
    isContradicted?: boolean;
    verificationStatus?: string;
    confidence?: number;
  };
}) {
  const isBad = data.isContradicted || data.verificationStatus === "FAIL";
  const isPass = data.verificationStatus === "PASS";
  const statusColor = isBad ? "#ef4444" : isPass ? "#10b981" : "#f59e0b";

  return (
    <div className={`graph-node-claim ${isBad ? "graph-node-claim--bad" : "graph-node-claim--good"}`}>
      <Handle type="target" position={Position.Left} id="target-left" className="graph-handle" />
      <Handle type="source" position={Position.Right} id="source-right" className="graph-handle" />

      <div className="graph-node-claim__header">
        <div className="graph-node-claim__badge">
          <span className="graph-node-claim__dot" />
          <span>{isBad ? "CONTRADICTS CLAIM" : "SUPPORTS CLAIM"}</span>
        </div>
        <span className="graph-node-claim__status-tag" style={{ borderColor: statusColor, color: statusColor }}>
          {data.verificationStatus || "PASS"}
        </span>
      </div>

      <div className="graph-node-claim__label">{data.label}</div>

      {typeof data.confidence === "number" && (
        <div className="graph-node-claim__confidence">
          <div className="graph-node-claim__confidence-bar">
            <div
              className="graph-node-claim__confidence-fill"
              style={{ width: `${Math.round(data.confidence * 100)}%`, backgroundColor: statusColor }}
            />
          </div>
          <span className="graph-node-claim__confidence-val">{Math.round(data.confidence * 100)}% Verified</span>
        </div>
      )}
    </div>
  );
}

function SourceCustomNode({
  data,
}: NodeProps & {
  data: {
    label: string;
    authors?: string[];
    year?: number;
    sourceType?: string;
  };
}) {
  return (
    <div className="graph-node-source">
      <Handle type="target" position={Position.Left} id="target-left" className="graph-handle" />

      <div className="graph-node-source__header">
        <FileText size={13} className="graph-node-source__icon" />
        <span className="graph-node-source__type">{data.sourceType || "DOCUMENT SOURCE"}</span>
      </div>

      <div className="graph-node-source__title">{data.label}</div>

      <div className="graph-node-source__meta">
        {data.authors && data.authors.length > 0 ? data.authors[0] : "Verified Source"}
        {data.year ? ` • ${data.year}` : ""}
      </div>
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
  { label: "Source", color: "#38bdf8" },
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
  /* Left-to-Right Hierarchical Knowledge Network Layout Math                  */
  /* ------------------------------------------------------------------------ */
  const { nodes, edges } = useMemo(() => {
    if (!nodesData || nodesData.length === 0) {
      return { nodes: [], edges: [] };
    }

    let mainNode = nodesData.find((n) => n.type === "question" || n.type === "hypothesis");
    const claimNodes = nodesData.filter((n) => n.type === "claim");
    const paperNodes = nodesData.filter((n) => n.type === "paper" || n.type === "evidence");

    if (!mainNode) {
      mainNode = {
        id: "main_topic_node",
        type: "question",
        label: nodesData[0]?.label || "Research Question & Hypothesis",
        data: {},
      };
    }

    const formattedNodes: Node[] = [];
    const formattedEdges: Edge[] = [];

    // Column 1: Main Research Question (Left)
    const mainY = Math.max(120, (claimNodes.length * 180) / 2 - 40);
    formattedNodes.push({
      id: mainNode.id,
      type: "mainClaim",
      position: { x: 40, y: mainY },
      data: {
        label: mainNode.label,
        stats: `${claimNodes.length} Claims • ${paperNodes.length} Sources Verified`,
      },
    });

    // Column 2: Claims (Center)
    claimNodes.forEach((c, idx) => {
      const claimY = 40 + idx * 180;
      const isContradicted =
        c.data.verification_status === "FAIL" ||
        edgesData.some((e) => e.target === c.id && e.type === "contradicts");
      const confidence = typeof c.data.confidence === "number" ? c.data.confidence : 0.85;

      formattedNodes.push({
        id: c.id,
        type: "claimNode",
        position: { x: 440, y: claimY },
        data: {
          label: c.label,
          isContradicted,
          verificationStatus: String(c.data.verification_status ?? "PASS"),
          confidence,
        },
      });

      // Connect Main Node -> Claim Node
      formattedEdges.push({
        id: `e-main-${c.id}`,
        source: mainNode!.id,
        target: c.id,
        sourceHandle: "right",
        targetHandle: "target-left",
        animated: true,
        style: {
          stroke: isContradicted ? "#ef4444" : "#10b981",
          strokeWidth: 2,
        },
      });
    });

    // Column 3: Paper / Document Sources (Right)
    const paperYMap = new Map<string, number>();
    paperNodes.forEach((p, idx) => {
      // Find connected claim if any
      const connEdge = edgesData.find((e) => e.source === p.id || e.target === p.id);
      let pY = 40 + idx * 140;

      if (connEdge) {
        const claimIdx = claimNodes.findIndex((c) => c.id === connEdge.target || c.id === connEdge.source);
        if (claimIdx !== -1) {
          pY = 40 + claimIdx * 180 + (idx % 2) * 80;
        }
      }
      paperYMap.set(p.id, pY);

      formattedNodes.push({
        id: p.id,
        type: "sourceNode",
        position: { x: 860, y: pY },
        data: {
          label: p.label,
          authors: Array.isArray(p.data?.authors) ? (p.data.authors as string[]) : undefined,
          year: typeof p.data?.year === "number" ? (p.data.year as number) : undefined,
          sourceType: typeof p.data?.source_type === "string" ? String(p.data.source_type) : "PAPER",
        },
      });
    });

    // Connect Paper Sources -> Claims or Claims -> Papers
    edgesData.forEach((e) => {
      if (!formattedEdges.some((fe) => fe.id === e.id)) {
        const isSourcePaper = paperNodes.some((p) => p.id === e.source);
        formattedEdges.push({
          id: e.id,
          source: isSourcePaper ? e.target : e.source,
          target: isSourcePaper ? e.source : e.target,
          sourceHandle: "source-right",
          targetHandle: "target-left",
          animated: false,
          style: {
            stroke: e.type === "contradicts" ? "#ef4444" : "#38bdf8",
            strokeWidth: 1.5,
            strokeDasharray: e.type === "contradicts" ? "4,4" : undefined,
          },
        });
      }
    });

    return { nodes: formattedNodes, edges: formattedEdges };
  }, [nodesData, edgesData]);

  const claims = nodesData.filter((n) => n.type === "claim");

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Top Legend Toolbar */}
      <div className="graph-toolbar flex items-center justify-between px-4 py-2 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-4">
          {LEGEND.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => zoomIn()} className="graph-zoom-btn" title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => zoomOut()} className="graph-zoom-btn" title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <button onClick={() => fitView({ padding: 0.2 })} className="graph-zoom-btn" title="Fit View">
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex w-full" style={{ height: "calc(100% - 37px)" }}>
        {showClaimList && (
          <aside className="claim-list-panel border-r border-zinc-800 w-64 flex-shrink-0 bg-zinc-950/50">
            <h3 className="font-semibold text-zinc-400 mb-2">Extracted Claims</h3>
            <ul>
              {claims.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c)}
                    className="claim-list-item hover:bg-zinc-800/60 p-2 rounded transition-colors text-left w-full"
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{
                        backgroundColor:
                          c.data.verification_status === "FAIL" ? "#ef4444" : "#10b981",
                      }}
                    />
                    <span className="line-clamp-2 text-zinc-200">{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <main className="flex-1 relative bg-zinc-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={customNodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
            maxZoom={1.8}
            onNodeClick={(_, node) => {
              const fullObj = nodesData.find((n) => n.id === node.id);
              if (fullObj) setSelected(fullObj);
            }}
          >
            <Background color="#27272a" gap={24} size={1} />
          </ReactFlow>
        </main>
      </div>

      {selected && <EvidencePanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export function EvidenceGraphCanvas({
  nodes,
  edges,
  nodesData,
  edgesData,
  showClaimList = false,
}: {
  nodes?: GraphNodeData[];
  edges?: GraphEdgeData[];
  nodesData?: GraphNodeData[];
  edgesData?: GraphEdgeData[];
  showClaimList?: boolean;
}) {
  const finalNodes = nodesData ?? nodes ?? [];
  const finalEdges = edgesData ?? edges ?? [];

  return (
    <ReactFlowProvider>
      <CanvasInner nodesData={finalNodes} edgesData={finalEdges} showClaimList={showClaimList} />
    </ReactFlowProvider>
  );
}
