import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";

export type AgentNodeStatus = "waiting" | "running" | "completed" | "failed";

export interface AgentNodeData {
  label: string;
  status: AgentNodeStatus;
  detail?: string;
  [key: string]: unknown;
}

const statusIcon: Record<AgentNodeStatus, React.ReactNode> = {
  waiting: <Circle size={14} />,
  running: <Loader2 size={14} className="spin" />,
  completed: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
};

export function AgentNode({ data }: NodeProps & { data: AgentNodeData }) {
  return (
    <div className={`agent-node agent-node-${data.status}`}>
      <Handle type="target" position={Position.Left} />
      <div className="agent-node-header">
        {statusIcon[data.status]}
        <span>{data.label}</span>
      </div>
      {data.detail && <div className="agent-node-detail">{data.detail}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
