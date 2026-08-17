"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { api, type HistoryItem } from "@/lib/api";
import { BookOpen, CheckCircle2 } from "lucide-react";

export function CompletedRunsList({
  title,
  emptyText,
  offlineText,
  linkFor,
}: {
  title: string;
  emptyText: string;
  offlineText: string;
  linkFor: (item: HistoryItem) => string;
}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api
      .getHistory()
      .then((r) => setHistory(r.history.filter((h) => h.has_report)))
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-container">
      <h1>{title}</h1>

      {offline && (
        <div className="notice-banner">
          <AlertCircle size={15} />
          <span>{offlineText}</span>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {!loading && !offline && history.length === 0 && <p className="muted">{emptyText}</p>}

      <div className="research-card-grid">
        {history.map((item) => (
          <Link key={item.id} href={linkFor(item)} className="research-card glass-card">
            <div className="research-card-top">
              <span className="research-card-status" style={{ color: "var(--accent-emerald)" }}>
                <CheckCircle2 size={12} style={{ display: "inline", marginRight: 4 }} />
                completed
              </span>
              <span className="research-card-date">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="research-card-question">{item.question}</p>
            <div className="research-card-meta">
              <span>
                <BookOpen size={13} /> {item.papers_count} sources
              </span>
              <span>{item.verified_count}/{item.claims_count} verified</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
