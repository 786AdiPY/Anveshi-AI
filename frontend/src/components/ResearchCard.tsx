import Link from "next/link";
import { FileText, Layers, Clock } from "lucide-react";
import type { HistoryItem } from "@/lib/api";

const statusColor: Record<string, string> = {
  pending: "var(--text-muted)",
  running: "var(--accent-cyan)",
  completed: "var(--accent-emerald)",
  failed: "var(--accent-rose)",
};

export function ResearchCard({ item }: { item: HistoryItem }) {
  const href = item.status === "completed" && item.has_report
    ? `/research/${item.id}`
    : `/research/${item.id}/run`;

  return (
    <Link href={href} className="research-card glass-card">
      <div className="research-card-top">
        <span
          className="research-card-status"
          style={{ color: statusColor[item.status] ?? "var(--text-muted)" }}
        >
          ● {item.status}
        </span>
        <span className="research-card-date">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="research-card-question">{item.question}</p>
      <div className="research-card-meta">
        <span><Layers size={13} /> {item.papers_count} sources</span>
        <span><FileText size={13} /> {item.claims_count} claims</span>
        <span><Clock size={13} /> {item.depth}</span>
      </div>
    </Link>
  );
}
