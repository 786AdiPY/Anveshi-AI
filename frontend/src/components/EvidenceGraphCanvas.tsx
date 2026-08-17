"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useReactFlow,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { FileText, Maximize2, ZoomIn, ZoomOut, Check, AlertTriangle, ArrowDown } from "lucide-react";
import { EvidencePanel, type GraphNodeData } from "@/components/EvidencePanel";

export type GraphEdgeData = { id: string; source: string; target: string; type: string };

/* -------------------------------------------------------------------------- */
/* Custom ReactFlow Nodes (Card-based matching DAG layout)                    */
/* -------------------------------------------------------------------------- */

function MainClaimNode({ data }: NodeProps & { data: { label: string; stats?: string } }) {
  return (
    <div className="graph-node-main-claim">
      <Handle type="target" position={Position.Top} className="graph-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-handle" />
      <div className="graph-node-main-claim__badge">
        <span className="graph-node-main-claim__dot" />
        <span>RESEARCH QUESTION</span>
      </div>
      <div className="graph-node-main-claim__title">{data.label}</div>
      {data.stats && <div className="graph-node-main-claim__footer">{data.stats}</div>}
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
      <Handle type="target" position={Position.Top} className="graph-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-handle" />

      <div className="graph-node-claim__header">
        <div className="graph-node-claim__badge">
          {isBad ? <AlertTriangle size={12} color="#f87171" /> : <Check size={12} color="#34d399" />}
          <span>{isBad ? "! CONTRADICTING" : "✓ CLAIM"}</span>
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
          <span className="graph-node-claim__confidence-val">{Math.round(data.confidence * 100)}% confidence</span>
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
      <Handle type="target" position={Position.Top} className="graph-handle" />
      <Handle type="source" position={Position.Bottom} className="graph-handle" />

      <div className="graph-node-source__header">
        <FileText size={12} className="graph-node-source__icon" />
        <span className="graph-node-source__type">{data.sourceType || "SOURCE"}</span>
      </div>

      <div className="graph-node-source__title">{data.label}</div>

      <div className="graph-node-source__meta">
        {data.authors && data.authors.length > 0 ? data.authors[0] : "Verified Source"}
        {data.year ? ` '${String(data.year).slice(-2)}` : ""}
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
  { label: "Challenges", color: "#ef4444" },
  { label: "Research Question", color: "#a855f7" },
  { label: "Source", color: "#38bdf8" },
];

/* -------------------------------------------------------------------------- */
/* Dagre Automatic Directed Acyclic Graph (DAG) Sugiyama Layout              */
/* -------------------------------------------------------------------------- */

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 90 });

  nodes.forEach((node) => {
    const width = node.type === "mainClaim" ? 320 : node.type === "claimNode" ? 300 : 260;
    const height = node.type === "mainClaim" ? 120 : node.type === "claimNode" ? 130 : 90;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.type === "mainClaim" ? 320 : node.type === "claimNode" ? 300 : 260;
    const height = node.type === "mainClaim" ? 120 : node.type === "claimNode" ? 130 : 90;

    return {
      ...node,
      targetPosition: direction === "TB" ? Position.Top : Position.Left,
      sourcePosition: direction === "TB" ? Position.Bottom : Position.Right,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

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
  const [layoutDirection, setLayoutDirection] = useState<"TB" | "LR">("TB");

  /* ------------------------------------------------------------------------ */
  /* Build Raw Nodes and Edges then apply Dagre Layout                        */
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

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    // 1. Root Question Node
    rawNodes.push({
      id: mainNode.id,
      type: "mainClaim",
      position: { x: 0, y: 0 },
      data: {
        label: mainNode.label,
        stats: `${claimNodes.length} Claims • ${paperNodes.length} Sources Verified`,
      },
    });

    // 2. Claim Nodes
    claimNodes.forEach((c) => {
      const isContradicted =
        c.data.verification_status === "FAIL" ||
        edgesData.some((e) => e.target === c.id && e.type === "contradicts");
      const confidence = typeof c.data.confidence === "number" ? c.data.confidence : 0.88;

      rawNodes.push({
        id: c.id,
        type: "claimNode",
        position: { x: 0, y: 0 },
        data: {
          label: c.label,
          isContradicted,
          verificationStatus: String(c.data.verification_status ?? "PASS"),
          confidence,
        },
      });

      // Question -> Claim Edge
      rawEdges.push({
        id: `e-main-${c.id}`,
        source: mainNode!.id,
        target: c.id,
        label: isContradicted ? "challenges" : "supports",
        labelStyle: { fill: isContradicted ? "#f87171" : "#34d399", fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: "#111827", fillOpacity: 0.9, rx: 4, ry: 4 },
        labelBgPadding: [6, 3],
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isContradicted ? "#ef4444" : "#10b981",
          width: 16,
          height: 16,
        },
        style: {
          stroke: isContradicted ? "#ef4444" : "#10b981",
          strokeWidth: 2,
        },
      });
    });

    // 3. Paper / Source Nodes
    paperNodes.forEach((p) => {
      rawNodes.push({
        id: p.id,
        type: "sourceNode",
        position: { x: 0, y: 0 },
        data: {
          label: p.label,
          authors: Array.isArray(p.data?.authors) ? (p.data.authors as string[]) : undefined,
          year: typeof p.data?.year === "number" ? (p.data.year as number) : undefined,
          sourceType: typeof p.data?.source_type === "string" ? String(p.data.source_type) : "SOURCE",
        },
      });
    });

    // 4. Edges from Sources -> Claims or Claims -> Sources
    edgesData.forEach((e) => {
      if (!rawEdges.some((re) => re.id === e.id)) {
        const isContradicts = e.type === "contradicts";
        const strokeColor = isContradicts ? "#ef4444" : "#38bdf8";

        rawEdges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          label: isContradicts ? "challenges" : "supports",
          labelStyle: { fill: isContradicts ? "#f87171" : "#38bdf8", fontWeight: 600, fontSize: 11 },
          labelBgStyle: { fill: "#111827", fillOpacity: 0.9, rx: 4, ry: 4 },
          labelBgPadding: [6, 3],
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 14,
            height: 14,
          },
          style: {
            stroke: strokeColor,
            strokeWidth: 1.6,
            strokeDasharray: isContradicts ? "4,4" : undefined,
          },
        });
      }
    });

    // Apply Dagre Sugiyama Layout
    return getLayoutedElements(rawNodes, rawEdges, layoutDirection);
  }, [nodesData, edgesData, layoutDirection]);

  const claims = nodesData.filter((n) => n.type === "claim");

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Top Legend & Layout Direction Controls Toolbar */}
      <div className="graph-toolbar flex items-center justify-between px-4 py-2 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-4">
          {LEGEND.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"))}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors font-medium text-[11px] flex items-center gap-1"
            title="Toggle Top-to-Bottom / Left-to-Right layout"
          >
            <span>Layout: {layoutDirection === "TB" ? "Vertical (TB)" : "Horizontal (LR)"}</span>
          </button>

          <button onClick={() => zoomIn()} className="graph-zoom-btn" title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => zoomOut()} className="graph-zoom-btn" title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <button onClick={() => fitView({ padding: 0.25 })} className="graph-zoom-btn" title="Fit View">
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
