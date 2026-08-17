"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { api, type AgentInspectorData } from "@/lib/api";

const AGENT_LABEL: Record<string, string> = {
  planner_agent: "Planner",
  supervisor_agent: "Supervisor",
  literature_agent: "Literature Researcher",
  extractor_agent: "Evidence Extractor",
  challenger_agent: "Challenger",
  ledger_agent: "Ledger",
  verifier_agent: "Verifier",
  synthesizer_agent: "Synthesizer",
  evidence_graph_agent: "Evidence Graph",
};

const verdictIcon: Record<string, React.ReactNode> = {
  PASS: <CheckCircle2 size={14} color="var(--accent-emerald)" />,
  FAIL: <XCircle size={14} color="var(--accent-rose)" />,
  UNCERTAIN: <AlertTriangle size={14} color="var(--accent-amber)" />,
  PENDING: <AlertTriangle size={14} color="var(--text-muted)" />,
};

export default function AgentInspectorPage() {
  const { id, agent } = useParams<{ id: string; agent: string }>();
  const [data, setData] = useState<AgentInspectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    api
      .getAgentInspector(id, agent)
      .then(setData)
      .catch(() => setOffline(true))
      .finally(() => setLoading(false));
  }, [id, agent]);

  const label = AGENT_LABEL[agent] ?? agent;

  if (loading) {
    return (
      <main className="page-container">
        <p className="muted">Loading agent data…</p>
      </main>
    );
  }

  const lastEvent = data?.events[data.events.length - 1];

  return (
    <main className="page-container">
      <Link href={`/research/${id}/run`} className="back-link">
        <ArrowLeft size={15} /> Back to canvas
      </Link>

      <header className="report-header glass-card">
        <h1>{label}</h1>
        <div className="report-header-meta">
          <span>
            <Activity size={14} /> {data?.total_calls ?? 0} calls
          </span>
          {lastEvent && <span>step {lastEvent.step_count}</span>}
        </div>
      </header>

      {offline && (
        <div className="notice-banner">
          <AlertCircle size={15} />
          <span>API not reachable — start the backend to inspect this agent.</span>
        </div>
      )}

      {data && (
        <>
          <section className="report-body glass-card">
            <h2>Action Log</h2>
            {data.events.length === 0 ? (
              <p className="muted">This agent has not run yet.</p>
            ) : (
              <ul className="action-log">
                {data.events.map((ev, i) => (
                  <li key={i}>
                    <span className="action-log__time">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                    <span>
                      step {ev.step_count} — {ev.papers_count} sources, {ev.claims_count} claims,{" "}
                      {ev.verified_count} verified
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.papers_produced.length > 0 && (
            <section className="report-body glass-card">
              <h2>Sources Found ({data.papers_produced.length})</h2>
              <ul className="source-list">
                {data.papers_produced.map((p) => (
                  <li key={p.id}>
                    <span className="source-title">{p.title}</span>
                    {p.year && <span className="muted"> ({p.year})</span>}
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="source-link"
                      >
                        ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.claims_produced.length > 0 && (
            <section className="report-body glass-card">
              <h2>Claims Extracted ({data.claims_produced.length})</h2>
              <ul className="findings-list">
                {data.claims_produced.map((c) => (
                  <li key={c.id}>
                    {verdictIcon[c.verification_status]}
                    <span>{c.statement}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.verification_results.length > 0 && (
            <section className="report-body glass-card">
              <h2>Verification Results ({data.verification_results.length})</h2>
              <ul className="findings-list">
                {data.verification_results.map((v) => (
                  <li key={v.id}>
                    {verdictIcon[v.status]}
                    <div>
                      <strong>{v.status}</strong>
                      {v.reasons.length > 0 && (
                        <ul className="reason-list">
                          {v.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                      {v.missing_evidence.length > 0 && (
                        <p className="muted">Missing: {v.missing_evidence.join("; ")}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.contradictions_produced.length > 0 && (
            <section className="report-body glass-card">
              <h2>Counter-Evidence ({data.contradictions_produced.length})</h2>
              <ul className="contradiction-list">
                {data.contradictions_produced.map((c) => (
                  <li key={c.id}>
                    <span className={`severity-tag severity-${c.severity}`}>{c.severity}</span>
                    {c.explanation}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
