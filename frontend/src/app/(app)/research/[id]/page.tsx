"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Download, Printer, Share2, Workflow, GitBranch, BookOpen, CheckCircle2 } from "lucide-react";
import { api, type ResearchRun } from "@/lib/api";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getRun(id)
      .then(setRun)
      .catch(() => setRun(null))
      .finally(() => setLoading(false));
  }, [id]);

  function exportMarkdown() {
    if (!run?.latest_state.research_brief) return;
    const blob = new Blob([run.latest_state.research_brief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-brief-${id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <main className="page-container"><p className="muted">Loading report…</p></main>;
  if (!run) return <main className="page-container"><p className="muted">Research run not found.</p></main>;

  const state = run.latest_state;
  const verifiedCount = state.claims.filter((c) => c.verification_status === "PASS").length;
  const runtime =
    run.started_at && run.completed_at
      ? Math.max(0, (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
      : null;

  return (
    <main className="page-container report-page">
      <header className="report-header glass-card">
        <h1>{run.question}</h1>
        <div className="report-header-meta">
          <span><BookOpen size={14} /> {state.papers.length} sources</span>
          <span><CheckCircle2 size={14} /> {verifiedCount}/{state.claims.length} claims verified</span>
          {runtime !== null && <span>{Math.round(runtime)}s runtime</span>}
        </div>
        <div className="report-actions">
          <button className="button-secondary" onClick={exportMarkdown}>
            <Download size={14} /> Export Markdown
          </button>
          <button className="button-secondary" onClick={() => window.print()}>
            <Printer size={14} /> Export PDF
          </button>
          <button
            className="button-secondary"
            onClick={() => navigator.clipboard?.writeText(window.location.href)}
          >
            <Share2 size={14} /> Share
          </button>
          <Link href={`/research/${id}/run`} className="button-secondary">
            <Workflow size={14} /> Research Process
          </Link>
          <Link href={`/research/${id}/graph`} className="button-secondary">
            <GitBranch size={14} /> Evidence Graph
          </Link>
        </div>
      </header>

      {run.status !== "completed" && (
        <p className="muted">This run is {run.status}. The brief below may be partial.</p>
      )}

      <article className="report-body glass-card markdown-body">
        {state.research_brief ? (
          <ReactMarkdown>{state.research_brief}</ReactMarkdown>
        ) : (
          <p className="muted">No research brief has been generated yet.</p>
        )}
      </article>

      {state.contradictions.length > 0 && (
        <section className="report-body glass-card">
          <h2>Contradictory Findings</h2>
          <ul className="contradiction-list">
            {state.contradictions.map((c) => (
              <li key={c.id}>
                <span className={`severity-tag severity-${c.severity}`}>{c.severity}</span>
                {c.explanation}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="report-body glass-card">
        <h2>Full Sources</h2>
        <ul className="source-list">
          {state.papers.map((p) => (
            <li key={p.id}>
              <span className="source-title">{p.title}</span>
              {p.authors.length > 0 && <span className="muted"> — {p.authors.join(", ")}</span>}
              {p.year && <span className="muted"> ({p.year})</span>}
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="source-link">
                  ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
