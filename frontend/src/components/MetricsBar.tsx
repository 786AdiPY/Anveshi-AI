import { BookOpen, CheckCircle2, AlertTriangle, ShieldCheck, Timer } from "lucide-react";

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

  const items = [
    { icon: BookOpen, label: "Sources", value: papers },
    { icon: ShieldCheck, label: "Claims", value: claims },
    { icon: CheckCircle2, label: "Verified", value: verified },
    { icon: AlertTriangle, label: "Conflicts", value: contradictions },
    { icon: Timer, label: "Runtime", value: `${mins}m ${secs}s` },
  ];

  return (
    <div className="metrics-bar">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="stat-tile">
          <div className="stat-tile__label">
            <Icon size={13} />
            <span>{label}</span>
          </div>
          <span className="stat-tile__value">{value}</span>
        </div>
      ))}
    </div>
  );
}
