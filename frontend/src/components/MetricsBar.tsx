import { FileText, ShieldCheck, AlertTriangle, Clock } from "lucide-react";

export function MetricsBar({
  papers,
  claims,
  verified,
  contradictions,
  runtimeSeconds,
}: {
  papers: number;
  claims: number;
  verified: number;
  contradictions: number;
  runtimeSeconds: number;
}) {
  const mins = Math.floor(runtimeSeconds / 60);
  const secs = Math.floor(runtimeSeconds % 60);
  const runtimeFormatted = `${mins}m ${secs}s`;

  const items = [
    { icon: FileText, label: "Sources Found", value: papers, colorClass: "icon-cyan" },
    { icon: FileText, label: "Claims Extracted", value: claims, colorClass: "icon-emerald" },
    { icon: ShieldCheck, label: "Verified", value: verified, colorClass: "icon-emerald" },
    { icon: AlertTriangle, label: "Conflicts Found", value: contradictions, colorClass: "icon-amber" },
    { icon: Clock, label: "Runtime", value: runtimeFormatted, colorClass: "icon-purple" },
  ];

  return (
    <div className="metrics-bar">
      {items.map(({ icon: Icon, label, value, colorClass }) => (
        <div key={label} className="stat-tile glass-card">
          <div className="stat-tile__top">
            <div className={`stat-tile__icon-box ${colorClass}`}>
              <Icon size={18} />
            </div>
            <span className="stat-tile__value">{value}</span>
          </div>
          <span className="stat-tile__label">{label}</span>
        </div>
      ))}
    </div>
  );
}
