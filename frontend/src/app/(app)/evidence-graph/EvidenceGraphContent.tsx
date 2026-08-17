"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Share2,
  FileText,
  Clock,
} from "lucide-react";
import { api, type HistoryItem, type ResearchRun, type Claim, type Paper } from "@/lib/api";
import { EvidenceGraphCanvas } from "@/components/EvidenceGraphCanvas";

type Tab = "graph" | "claims" | "sources" | "conflicts";

const verdictIcon: Record<string, React.ReactNode> = {
  PASS: <CheckCircle2 size={14} color="var(--accent-emerald)" />,
  FAIL: <XCircle size={14} color="var(--accent-rose)" />,
  UNCERTAIN: <AlertTriangle size={14} color="var(--accent-amber)" />,
  PENDING: <AlertTriangle size={14} color="var(--text-muted)" />,
};

const EMPTY_CLAIMS: Claim[] = [];
const EMPTY_PAPERS: Paper[] = [];
const EMPTY_CONTRADICTIONS: ResearchRun["latest_state"]["contradictions"] = [];

function formatRuntime(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

export default function EvidenceGraphContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<"month" | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(() => params.get("run"));
  const [run, setRun] = useState<ResearchRun | null>(null);
  const [runLoading, setRunLoading] = useState(() => params.get("run") !== null);
  const [tab, setTab] = useState<Tab>("graph");

  function selectRun(id: string) {
    setSelectedId(id);
    setRunLoading(true);
    setTab("graph");
  }

  useEffect(() => {
    api
      .getHistory()
      .then((r) => {
        const completed = r.history.filter((h) => h.has_report);
        setHistory(completed);
        if (!selectedId && completed.length > 0) {
          setSelectedId(completed[0].id);
          setRunLoading(true);
        }
      })
      .catch(() => setOffline(true))
      .finally(() => setHistoryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    router.replace(`/evidence-graph?run=${selectedId}`, { scroll: false });
    api
      .getRun(selectedId)
      .then(setRun)
      .catch(() => setRun(null))
      .finally(() => setRunLoading(false));
  }, [selectedId, router]);

  const filteredHistory = useMemo(() => {
    let list = history;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((h) => h.question.toLowerCase().includes(q));
    }
    if (range === "month") {
      const now = new Date();
      list = list.filter((h) => {
        const d = new Date(h.created_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }
    return list;
  }, [history, search, range]);

  const state = run?.latest_state;
  const claims = state?.claims ?? EMPTY_CLAIMS;
  const papers = state?.papers ?? EMPTY_PAPERS;
  const contradictions = state?.contradictions ?? EMPTY_CONTRADICTIONS;
  const graphData = state?.evidence_graph_data ?? { nodes: [], edges: [] };

  const insights = useMemo(() => {
    const pass = claims.filter((c) => c.verification_status === "PASS").length;
    const fail = claims.filter((c) => c.verification_status === "FAIL").length;
    const other = claims.length - pass - fail;
    const total = claims.length || 1;
    return {
      pass,
      fail,
      other,
      total: claims.length,
      passPct: (pass / total) * 100,
      failPct: (fail / total) * 100,
    };
  }, [claims]);

  const paperById = useMemo(() => new Map(papers.map((p) => [p.id, p])), [papers]);

  const topSupporting = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of claims) counts.set(c.paper_id, (counts.get(c.paper_id) ?? 0) + 1);
    return [...counts.entries()]
      .map(([paperId, count]) => ({ paper: paperById.get(paperId), count }))
      .filter((x) => x.paper)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [claims, paperById]);

  const topContradicting = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of contradictions) counts.set(c.opposing_paper_id, (counts.get(c.opposing_paper_id) ?? 0) + 1);
    return [...counts.entries()]
      .map(([paperId, count]) => ({ paper: paperById.get(paperId), count }))
      .filter((x) => x.paper)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [contradictions, paperById]);

  const selectedHistoryItem = history.find((h) => h.id === selectedId);

  return (
    <main className="page-container evidence-hub">
      <div className="evidence-hub__header">
        <div>
          <h1>Evidence Graph</h1>
          <p className="muted">Visualize how evidence supports or contradicts claims across your research runs.</p>
        </div>
        <div className="evidence-hub__search">
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search research runs..."
          />
        </div>
        <select className="stats-range-select" value={range} onChange={(e) => setRange(e.target.value as "month" | "all")}>
          <option value="all">All time</option>
          <option value="month">This month</option>
        </select>
      </div>

      {offline && (
        <div className="notice-banner">
          <AlertCircle size={15} />
          <span>API not reachable — start the backend to browse evidence graphs.</span>
        </div>
      )}

      <div className="evidence-hub__layout">
        <aside className="evidence-hub__list glass-card">
          <div className="evidence-hub__list-title">All Research Runs ({filteredHistory.length})</div>
          {historyLoading && <p className="muted evidence-hub__empty">Loading…</p>}
          {!historyLoading && filteredHistory.length === 0 && (
            <p className="muted evidence-hub__empty">No completed research runs yet.</p>
          )}
          <ul>
            {filteredHistory.map((item) => (
              <li key={item.id}>
                <button
                  className={`evidence-run-card${item.id === selectedId ? " evidence-run-card--active" : ""}`}
                  onClick={() => selectRun(item.id)}
                >
                  <div className="evidence-run-card__top">
                    <span className="evidence-run-card__question">{item.question}</span>
                    <span className={`status-badge status-badge-${item.status}`}>{item.status}</span>
                  </div>
                  <span className="evidence-run-card__meta">
                    {new Date(item.created_at).toLocaleDateString()} · {formatRuntime(item.runtime_seconds)}
                  </span>
                  <div className="evidence-run-card__stats">
                    <span><FileText size={11} /> {item.papers_count}</span>
                    <span><CheckCircle2 size={11} /> {item.claims_count}</span>
                    <span><AlertTriangle size={11} /> {item.contradictions_count}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="evidence-hub__detail">
          {!selectedId && !historyLoading && (
            <div className="glass-card panel evidence-hub__placeholder">
              <p className="muted">Select a research run to view its evidence graph.</p>
            </div>
          )}

          {selectedId && runLoading && (
            <div className="glass-card panel evidence-hub__placeholder">
              <p className="muted">Loading run…</p>
            </div>
          )}

          {selectedId && !runLoading && run && selectedHistoryItem && (
            <>
              <div className="glass-card panel evidence-hub__detail-header">
                <div>
                  <div className="evidence-hub__detail-title">
                    <h2>{run.question}</h2>
                    <span className={`status-badge status-badge-${run.status}`}>{run.status}</span>
                  </div>
                  <div className="evidence-hub__detail-meta">
                    <span><Clock size={12} /> {new Date(run.created_at).toLocaleString()}</span>
                    <span>{formatRuntime(selectedHistoryItem.runtime_seconds)} runtime</span>
                    <span><FileText size={12} /> {papers.length} sources</span>
                    <span>{claims.length} claims extracted</span>
                    <span><AlertTriangle size={12} /> {contradictions.length} conflicts found</span>
                  </div>
                </div>
                <div className="evidence-hub__detail-actions">
                  <Link href={`/research/${run.id}`} className="button-secondary">
                    <BookOpen size={13} /> View Report
                  </Link>
                  <button
                    className="button-secondary"
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  >
                    <Share2 size={13} /> Share
                  </button>
                </div>
              </div>

              <div className="evidence-hub__tabs">
                {([
                  ["graph", "Evidence Graph"],
                  ["claims", `Claims (${claims.length})`],
                  ["sources", `Sources (${papers.length})`],
                  ["conflicts", `Conflicts (${contradictions.length})`],
                ] as [Tab, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    className={`evidence-hub__tab${tab === key ? " evidence-hub__tab--active" : ""}`}
                    onClick={() => setTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "graph" && (
                <>
                  <div className="canvas-wrapper-outer">
                    <EvidenceGraphCanvas
                      nodesData={graphData.nodes as never}
                      edgesData={graphData.edges as never}
                      showClaimList={false}
                    />
                  </div>

                  <div className="evidence-insights-grid">
                    <div className="glass-card panel">
                      <h3 className="panel-title">Graph Insights</h3>
                      <div className="insights-donut-row">
                        <div
                          className="insights-donut"
                          style={{
                            background: `conic-gradient(var(--accent-emerald) 0 ${insights.passPct}%, var(--accent-rose) ${insights.passPct}% ${insights.passPct + insights.failPct}%, var(--border-color) ${insights.passPct + insights.failPct}% 100%)`,
                          }}
                        >
                          <div className="insights-donut__center">
                            <strong>{insights.total}</strong>
                            <span>Total Claims</span>
                          </div>
                        </div>
                        <ul className="insights-legend">
                          <li>
                            <i style={{ background: "var(--accent-emerald)" }} />
                            {insights.pass} claims supported by evidence
                            <span className="muted"> · {Math.round(insights.passPct)}%</span>
                          </li>
                          <li>
                            <i style={{ background: "var(--accent-rose)" }} />
                            {insights.fail} claims contradicted by evidence
                            <span className="muted"> · {Math.round(insights.failPct)}%</span>
                          </li>
                          <li>
                            <i style={{ background: "var(--border-glow)" }} />
                            {insights.other} claims neutral or unresolved
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="glass-card panel">
                      <h3 className="panel-title">Top Supporting Sources</h3>
                      {topSupporting.length === 0 && <p className="muted">No sources yet.</p>}
                      <ul className="source-rank-list">
                        {topSupporting.map(({ paper, count }) => (
                          <li key={paper!.id}>
                            <span>{paper!.title}</span>
                            <span className="source-rank-count">{count} claims</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-card panel">
                      <h3 className="panel-title">Top Contradicting Sources</h3>
                      {topContradicting.length === 0 && <p className="muted">No contradictions found.</p>}
                      <ul className="source-rank-list">
                        {topContradicting.map(({ paper, count }) => (
                          <li key={paper!.id}>
                            <span>{paper!.title}</span>
                            <span className="source-rank-count source-rank-count--bad">{count} conflicts</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {tab === "claims" && (
                <div className="glass-card panel">
                  <ul className="findings-list">
                    {claims.map((c) => (
                      <li key={c.id}>
                        {verdictIcon[c.verification_status]}
                        <span>{c.statement}</span>
                      </li>
                    ))}
                    {claims.length === 0 && <p className="muted">No claims extracted.</p>}
                  </ul>
                </div>
              )}

              {tab === "sources" && (
                <div className="glass-card panel">
                  <ul className="source-list">
                    {papers.map((p) => (
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
                    {papers.length === 0 && <p className="muted">No sources found.</p>}
                  </ul>
                </div>
              )}

              {tab === "conflicts" && (
                <div className="glass-card panel">
                  <ul className="contradiction-list">
                    {contradictions.map((c) => (
                      <li key={c.id}>
                        <span className={`severity-tag severity-${c.severity}`}>{c.severity}</span>
                        {c.explanation}
                      </li>
                    ))}
                    {contradictions.length === 0 && <p className="muted">No contradictions found.</p>}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
