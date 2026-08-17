"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { api, type HistoryItem, type ResearchDepth } from "@/lib/api";
import { ResearchCard } from "@/components/ResearchCard";

const SUGGESTIONS = [
  "What are the trade-offs of RAG vs fine-tuning for enterprise LLMs?",
  "Does intermittent fasting improve metabolic health markers?",
  "How effective are CRISPR-based therapies for sickle cell disease?",
];

export default function DashboardContent() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>("standard");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [starting, setStarting] = useState(false);

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

  return (
    <main className="page-container">
      <section className="hero">
        <h1>What do you want to research?</h1>
        <p className="hero-sub">
          Pramaan AI searches the literature, extracts claims, challenges them with counter-evidence,
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
          <button
            className="button-primary"
            disabled={!question.trim() || starting}
            onClick={() => startResearch(question)}
          >
            {starting ? "Starting…" : "Start Research"}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="depth-selector">
          {(["quick", "standard", "deep"] as ResearchDepth[]).map((d) => (
            <button
              key={d}
              className={`depth-pill${depth === d ? " depth-pill-active" : ""}`}
              onClick={() => setDepth(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="suggestion-chip glass-pill" onClick={() => setQuestion(s)}>
              {s}
            </button>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="recent-section">
          <h2>Recent Research</h2>
          <div className="research-card-grid">
            {history.slice(0, 6).map((item) => (
              <ResearchCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
