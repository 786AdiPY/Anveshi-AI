import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

export type AgentNodeStatus = "waiting" | "running" | "completed" | "failed";

export interface AgentNodeData {
  label: string;
  status: AgentNodeStatus;
  detail?: string;
  [key: string]: unknown;
}

const statusIcon: Record<AgentNodeStatus, React.ReactNode> = {
  waiting: <Clock size={13} className="node-icon node-icon-waiting" />,
  running: <Loader2 size={13} className="spin node-icon node-icon-running" />,
  completed: <CheckCircle2 size={13} className="node-icon node-icon-completed" />,
  failed: <XCircle size={13} className="node-icon node-icon-failed" />,
};

export function AgentNode({ data }: NodeProps & { data: AgentNodeData }) {
  return (
    <div className={`agent-node agent-node-${data.status}`}>
      <Handle type="target" position={Position.Left} />
      <div className="agent-node-header">
        {statusIcon[data.status]}
        <span className="agent-node-title">{data.label}</span>
      </div>
      {data.detail && <div className="agent-node-detail">{data.detail}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

