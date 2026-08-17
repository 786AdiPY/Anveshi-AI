"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  ListChecks,
  CheckSquare,
  Percent,
  Clock,
  Layers,
  GitBranch,
  Bookmark,
  Database,
  Settings,
  ChevronDown,
} from "lucide-react";
import { api, type HistoryItem, type ResearchDepth } from "@/lib/api";

const SUGGESTIONS = [
  { q: "What are the trade-offs of RAG vs fine-tuning for enterprise LLMs?", icon: Layers },
  { q: "Does intermittent fasting improve metabolic health markers?", icon: Search },
  { q: "How effective are CRISPR-based therapies for sickle cell disease?", icon: BookOpen },
];

function DepthDropdown({
  value,
  onChange,
}: {
  value: ResearchDepth;
  onChange: (d: ResearchDepth) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options: { key: ResearchDepth; label: string }[] = [
    { key: "quick", label: "Quick" },
    { key: "standard", label: "Standard" },
    { key: "deep", label: "Deep" },
  ];

  const activeLabel = options.find((o) => o.key === value)?.label ?? "Standard";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-depth-dropdown" ref={ref}>
      <button
        type="button"
        className="custom-depth-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{activeLabel}</span>
        <ChevronDown size={13} className={`dropdown-chevron${open ? " is-open" : ""}`} />
      </button>
      {open && (
        <div className="custom-depth-menu glass-card">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`custom-depth-option${value === opt.key ? " is-selected" : ""}`}
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: "/runs", label: "Research Runs", icon: ListChecks },
  { href: "/evidence-graph", label: "Evidence Graph", icon: GitBranch },
  { href: "/reports", label: "Saved Reports", icon: Bookmark },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings },
];

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [question, setQuestion] = useState(() => params.get("q") ?? "");
  const [depth, setDepth] = useState<ResearchDepth>(
    (params.get("depth") as ResearchDepth) || "standard"
  );
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [statsRange, setStatsRange] = useState<"month" | "all">("month");

  useEffect(() => {
    api.getHistory().then((r) => setHistory(r.history)).catch(() => {});
  }, []);

  async function startResearch(q: string) {
    if (!q.trim() || starting) return;
    setStarting(true);
    try {
      const { id } = await api.startResearch(q.trim(), depth);
      router.push(`/research/${id}/run`);
    } catch {
      setStarting(false);
    }
  }

  const statsSource = useMemo(() => {
    if (statsRange === "all") return history;
    const now = new Date();
    return history.filter((h) => {
      const d = new Date(h.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [history, statsRange]);

  const stats = useMemo(() => {
    const runs = statsSource.length;
    const sources = statsSource.reduce((sum, h) => sum + h.papers_count, 0);
    const claims = statsSource.reduce((sum, h) => sum + h.claims_count, 0);
    const verified = statsSource.reduce((sum, h) => sum + h.verified_count, 0);
    const rate = claims > 0 ? Math.round((verified / claims) * 100) : 0;
    return { runs, sources, verified, rate };
  }, [statsSource]);

  const recent = useMemo(
    () =>
      [...history]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [history]
  );

  return (
    <main className="page-container dashboard-page">
      <section className="hero">
        <h1>What do you want to research?</h1>
        <p className="hero-sub">
          Anveshi AI searches the literature, extracts claims, challenges them with counter-evidence,
          and verifies every conclusion before reporting.
        </p>

        <div className="hero-input glass-card">
          <Search size={18} className="hero-input-icon" />
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a research question..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                startResearch(question);
              }
            }}
          />
          <div className="hero-input-actions">
            <DepthDropdown value={depth} onChange={setDepth} />
            <button
              className="button-primary"
              disabled={!question.trim() || starting}
              onClick={() => startResearch(question)}
            >
              {starting ? "Starting…" : "Start Research"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="suggestions-header">
          <span><Sparkles size={13} /> Try these research questions</span>
          <Link href="/runs">View all →</Link>
        </div>
        <div className="suggestion-grid">
          {SUGGESTIONS.map(({ q, icon: Icon }) => (
            <button key={q} className="suggestion-card glass-card" onClick={() => setQuestion(q)}>
              <Icon size={15} />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card panel dashboard-stats">
        <div className="panel-header">
          <h2 className="panel-title">Your Research at a Glance</h2>
          <select
            className="stats-range-select"
            value={statsRange}
            onChange={(e) => setStatsRange(e.target.value as "month" | "all")}
          >
            <option value="month">This month</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div className="glance-grid glance-grid--wide">
          <div className="glance-tile">
            <ListChecks size={16} />
            <span className="glance-value">{stats.runs}</span>
            <span className="glance-label">Research Runs</span>
          </div>
          <div className="glance-tile">
            <BookOpen size={16} />
            <span className="glance-value">{stats.sources}</span>
            <span className="glance-label">Sources Found</span>
          </div>
          <div className="glance-tile">
            <CheckSquare size={16} />
            <span className="glance-value">{stats.verified}</span>
            <span className="glance-label">Claims Verified</span>
          </div>
          <div className="glance-tile">
            <Percent size={16} />
            <span className="glance-value">{stats.rate}%</span>
            <span className="glance-label">Verification Rate</span>
          </div>
        </div>
      </section>

      <section className="dashboard-lower">
        <div className="glass-card panel dashboard-lower__main">
          <h2 className="panel-title">Recent Research</h2>
          {recent.length === 0 ? (
            <p className="muted">No research runs yet — ask a question above to get started.</p>
          ) : (
            <ul className="recent-list">
              {recent.map((item) => (
                <li key={item.id}>
                  <Link
                    href={
                      item.status === "completed" && item.has_report
                        ? `/research/${item.id}`
                        : `/research/${item.id}/run`
                    }
                  >
                    <div>
                      <span className="recent-list__question">{item.question}</span>
                      <span className="recent-list__meta">
                        <Clock size={11} /> {new Date(item.created_at).toLocaleDateString()} · {item.depth}
                      </span>
                    </div>
                    <span className={`status-badge status-badge-${item.status}`}>{item.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/runs" className="panel-footer-link">
            View all research runs →
          </Link>
        </div>

        <div className="glass-card panel dashboard-lower__side">
          <h2 className="panel-title">Quick Actions</h2>
          <div className="quick-actions-list">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="quick-actions-list__item">
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}
