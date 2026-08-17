"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { api, type HistoryItem, type RunStatus } from "@/lib/api";
import { ResearchCard } from "@/components/ResearchCard";

const TABS: { key: RunStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
];

export default function RunsContent() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState<RunStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api
      .getHistory()
      .then((r) => setHistory(r.history))
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === "all" ? history : history.filter((h) => h.status === tab);

  return (
    <main className="page-container">
      <h1>Research Runs</h1>

      <div className="filter-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`filter-tab${tab === t.key ? " filter-tab-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {offline && (
        <div className="notice-banner">
          <AlertCircle size={15} />
          <span>API not reachable — start the backend to see your research runs.</span>
        </div>
      )}

      {loading && <p className="muted">Loading…</p>}
      {!loading && !offline && filtered.length === 0 && (
        <p className="muted">No research runs yet.</p>
      )}

      <div className="research-card-grid">
        {filtered.map((item) => (
          <ResearchCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
