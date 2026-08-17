import { X, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface GraphNodeData {
  id: string;
  type: "question" | "hypothesis" | "claim" | "evidence" | "paper" | "contradiction";
  label: string;
  data: Record<string, unknown>;
}

const verificationIcon: Record<string, React.ReactNode> = {
  PASS: <CheckCircle2 size={14} color="var(--accent-emerald)" />,
  FAIL: <XCircle size={14} color="var(--accent-rose)" />,
  UNCERTAIN: <AlertTriangle size={14} color="var(--accent-amber)" />,
  PENDING: <AlertTriangle size={14} color="var(--text-muted)" />,
};

export function EvidencePanel({ node, onClose }: { node: GraphNodeData; onClose: () => void }) {
  const d = node.data ?? {};

  return (
    <div className="evidence-panel glass-card">
      <div className="evidence-panel-header">
        <span className="evidence-panel-type">{node.type}</span>
        <button onClick={onClose} className="icon-button" aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <p className="evidence-panel-label">{node.label}</p>

      {node.type === "claim" && (
        <>
          <div className="evidence-panel-row">
            {verificationIcon[String(d.verification_status ?? "PENDING")]}
            <span>{String(d.verification_status ?? "PENDING")}</span>
          </div>
          {typeof d.confidence === "number" && (
            <div className="confidence-bar">
              <div
                className="confidence-bar-fill"
                style={{ width: `${Math.round((d.confidence as number) * 100)}%` }}
              />
            </div>
          )}
        </>
      )}

      {node.type === "evidence" && (
        <>
          {typeof d.methodology === "string" && d.methodology && (
            <p className="evidence-panel-field"><strong>Methodology:</strong> {d.methodology}</p>
          )}
          {typeof d.findings === "string" && d.findings && (
            <p className="evidence-panel-field"><strong>Findings:</strong> {d.findings}</p>
          )}
        </>
      )}

      {node.type === "contradiction" && typeof d.explanation === "string" && (
        <p className="evidence-panel-field">{d.explanation}</p>
      )}

      {node.type === "paper" && (
        <>
          {typeof d.authors === "object" && Array.isArray(d.authors) && (
            <p className="evidence-panel-field">{(d.authors as string[]).join(", ")}</p>
          )}
          {typeof d.url === "string" && d.url && (
            <a href={d.url} target="_blank" rel="noopener noreferrer" className="evidence-panel-link">
              View source ↗
            </a>
          )}
        </>
      )}
    </div>
  );
}
