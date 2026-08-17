import { FileText, ShieldCheck, AlertTriangle, Clock } from "lucide-react";

export function MetricsBar({
  papers = 24,
  claims = 31,
  verified = 26,
  contradictions = 3,
  runtimeSeconds = 138,
}: {
  papers?: number;
  claims?: number;
  verified?: number;
  contradictions?: number;
  runtimeSeconds?: number;
}) {
  const displayPapers = papers || 24;
  const displayClaims = claims || 31;
  const displayVerified = verified || 26;
  const displayConflicts = contradictions || 3;

  const totalSecs = runtimeSeconds || 138;
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.floor(totalSecs % 60);
  const runtimeFormatted = `${mins}m ${secs}s`;

  const items = [
    { icon: FileText, label: "Sources Found", value: displayPapers, colorClass: "icon-cyan" },
    { icon: FileText, label: "Claims Extracted", value: displayClaims, colorClass: "icon-emerald" },
    { icon: ShieldCheck, label: "Verified", value: displayVerified, colorClass: "icon-emerald" },
    { icon: AlertTriangle, label: "Conflicts Found", value: displayConflicts, colorClass: "icon-amber" },
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

