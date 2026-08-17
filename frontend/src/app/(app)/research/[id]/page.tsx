"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import {
  Download,
  Printer,
  Share2,
  Workflow,
  GitBranch,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  FileText,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { api, type ResearchRun } from "@/lib/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  for (const line of markdown.split("\n")) {
    const match = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (match) {
      const text = match[2].trim();
      headings.push({ level: match[1].length, text, id: slugify(text) });
    }
  }
  return headings;
}

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

  const brief = run?.latest_state.research_brief ?? "";
  const headings = useMemo(() => extractHeadings(brief), [brief]);

  const markdownComponents: Components = useMemo(
    () => ({
      h1: ({ children, ...props }) => (
        <h1 id={slugify(String(children))} {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2 id={slugify(String(children))} {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 id={slugify(String(children))} {...props}>
          {children}
        </h3>
      ),
    }),
    []
  );

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
  const failedCount = state.claims.filter((c) => c.verification_status === "FAIL").length;
  const otherCount = state.claims.length - verifiedCount - failedCount;
  const claimsTotal = state.claims.length || 1;
  const verifiedPct = (verifiedCount / claimsTotal) * 100;
  const failedPct = (failedCount / claimsTotal) * 100;
  const runtime =
    run.started_at && run.completed_at
      ? Math.max(0, (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
      : null;

  return (
    <main className="page-container report-page">
      <Link href="/runs" className="back-link">
        <ArrowLeft size={15} /> Back to results
      </Link>

      <header className="report-header glass-card">
        <h1>{run.question}</h1>
        <div className="report-header-meta">
          <span><BookOpen size={14} /> {state.papers.length} sources</span>
          <span><CheckCircle2 size={14} /> {verifiedCount}/{state.claims.length} claims verified</span>
          {runtime !== null && <span><Clock size={13} /> {Math.round(runtime / 60)}m {Math.round(runtime % 60)}s runtime</span>}
          <span>{new Date(run.created_at).toLocaleDateString()}</span>
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
          <Link href={`/evidence-graph?run=${id}`} className="button-secondary">
            <GitBranch size={14} /> Evidence Graph
          </Link>
        </div>
      </header>

      {run.status !== "completed" && (
        <p className="muted">This run is {run.status}. The brief below may be partial.</p>
      )}

      <div className="report-layout">
        <div className="report-layout__main">
          <article className="report-body glass-card markdown-body">
            {state.research_brief ? (
              <ReactMarkdown components={markdownComponents}>{state.research_brief}</ReactMarkdown>
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

          <section id="full-sources" className="report-body glass-card">
            <h2>Full Sources ({state.papers.length})</h2>
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
        </div>

        <aside className="report-layout__side">
          {headings.length > 0 && (
            <div className="glass-card panel">
              <h3 className="panel-title">Table of Contents</h3>
              <nav className="toc-list">
                {headings
                  .filter((h) => h.level <= 2)
                  .map((h) => (
                    <a key={h.id} href={`#${h.id}`} className={`toc-list__item toc-list__item--h${h.level}`}>
                      {h.text}
                    </a>
                  ))}
                <a href="#full-sources" className="toc-list__item toc-list__item--h2">
                  Full Sources ({state.papers.length})
                </a>
              </nav>
            </div>
          )}

          <div className="glass-card panel">
            <h3 className="panel-title">Quick Stats</h3>
            <ul className="quick-stats-list">
              <li><span><FileText size={13} /> Sources Analyzed</span><strong>{state.papers.length}</strong></li>
              <li><span><CheckCircle2 size={13} /> Claims Extracted</span><strong>{state.claims.length}</strong></li>
              <li><span><CheckCircle2 size={13} /> Verified</span><strong>{verifiedCount}</strong></li>
              <li><span><AlertTriangle size={13} /> Conflicts Found</span><strong>{state.contradictions.length}</strong></li>
              {runtime !== null && (
                <li><span><Clock size={13} /> Runtime</span><strong>{Math.round(runtime / 60)}m {Math.round(runtime % 60)}s</strong></li>
              )}
            </ul>
          </div>

          <div className="glass-card panel">
            <h3 className="panel-title">Verification Summary</h3>
            <div className="insights-donut-row">
              <div
                className="insights-donut"
                style={{
                  background: `conic-gradient(var(--accent-emerald) 0 ${verifiedPct}%, var(--accent-rose) ${verifiedPct}% ${verifiedPct + failedPct}%, var(--border-color) ${verifiedPct + failedPct}% 100%)`,
                }}
              >
                <div className="insights-donut__center">
                  <strong>{state.claims.length}</strong>
                  <span>Total Claims</span>
                </div>
              </div>
              <ul className="insights-legend">
                <li>
                  <i style={{ background: "var(--accent-emerald)" }} />
                  {verifiedCount} Verified <span className="muted">({Math.round(verifiedPct)}%)</span>
                </li>
                <li>
                  <i style={{ background: "var(--accent-rose)" }} />
                  {failedCount} Conflicts <span className="muted">({Math.round(failedPct)}%)</span>
                </li>
                <li>
                  <i style={{ background: "var(--border-glow)" }} />
                  {otherCount} Unverified
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
