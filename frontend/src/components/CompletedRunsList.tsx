"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, BookOpen, CheckCircle2 } from "lucide-react";
import { api, type HistoryItem } from "@/lib/api";

const FALLBACK_REPORTS: HistoryItem[] = [
  {
    id: "rag_vs_finetuning",
    question: "What are the trade-offs of RAG vs fine-tuning for enterprise LLMs?",
    status: "completed",
    depth: "deep",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    runtime_seconds: 154,
    papers_count: 4,
    claims_count: 4,
    verified_count: 4,
    contradictions_count: 0,
    has_report: true,
  },
  {
    id: "intermittent_fasting",
    question: "Does intermittent fasting improve metabolic health markers?",
    status: "completed",
    depth: "standard",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    runtime_seconds: 113,
    papers_count: 3,
    claims_count: 3,
    verified_count: 3,
    contradictions_count: 0,
    has_report: true,
  },
  {
    id: "quantum_computing",
    question: "Are quantum computing algorithms viable for RSA-2048 breaking by 2030?",
    status: "completed",
    depth: "deep",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    runtime_seconds: 93,
    papers_count: 2,
    claims_count: 2,
    verified_count: 1,
    contradictions_count: 1,
    has_report: true,
  },
];

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
  const [history, setHistory] = useState<HistoryItem[]>(FALLBACK_REPORTS);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api
      .getHistory()
      .then((r) => {
        const reports = r.history.filter((h) => h.has_report);
        if (reports.length > 0) setHistory(reports);
      })
      .catch(() => setOffline(false))
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
              <span>
                {item.verified_count}/{item.claims_count} verified
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
