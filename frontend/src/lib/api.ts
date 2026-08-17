const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export type ResearchDepth = "quick" | "standard" | "deep";
export type VerificationStatus = "PASS" | "FAIL" | "UNCERTAIN" | "PENDING";
export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year?: number | null;
  url?: string | null;
  doi?: string | null;
  abstract?: string | null;
  venue?: string | null;
  source_type: string;
}

export interface Evidence {
  id: string;
  paper_id: string;
  excerpt: string;
  methodology?: string | null;
  findings?: string | null;
  relevance_score: number;
}

export interface Claim {
  id: string;
  statement: string;
  paper_id: string;
  subquestion?: string | null;
  confidence_score: number;
  supporting_evidence: string[];
  verification_status: VerificationStatus;
}

export interface Contradiction {
  id: string;
  claim_id: string;
  opposing_paper_id: string;
  opposing_evidence_id?: string | null;
  explanation: string;
  severity: string;
}

export interface VerificationResult {
  id: string;
  claim_id: string;
  status: VerificationStatus;
  checks: { name: string; passed: boolean; note?: string | null }[];
  reasons: string[];
  missing_evidence: string[];
}

export interface LatestState {
  papers: Paper[];
  claims: Claim[];
  evidence: Evidence[];
  contradictions: Contradiction[];
  verification_results: VerificationResult[];
  research_brief: string | null;
  evidence_graph_data: { nodes: unknown[]; edges: unknown[] };
}

export interface AgentUpdateEvent {
  timestamp: string;
  agent: string;
  step_count: number;
  papers_count: number;
  claims_count: number;
  verified_count: number;
  contradictions_count: number;
  status: string;
}

export interface ResearchRun {
  id: string;
  question: string;
  depth: string;
  status: RunStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  events: AgentUpdateEvent[];
  latest_state: LatestState;
  error: string | null;
}

export interface AgentInspectorData {
  agent: string;
  run_id: string;
  total_calls: number;
  events: AgentUpdateEvent[];
  papers_produced: Paper[];
  claims_produced: Claim[];
  verification_results: VerificationResult[];
  contradictions_produced: Contradiction[];
}

export interface Dataset {
  name: string;
  path: string;
  size_bytes: number;
  modified_at: string;
}

export interface HistoryItem {
  id: string;
  question: string;
  status: RunStatus;
  depth: string;
  created_at: string;
  runtime_seconds: number | null;
  papers_count: number;
  claims_count: number;
  verified_count: number;
  contradictions_count: number;
  has_report: boolean;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export const api = {
  startResearch: (question: string, depth: ResearchDepth, files: string[] = []) =>
    req<{ id: string; status: string; question: string }>("/api/research", {
      method: "POST",
      body: JSON.stringify({ question, depth, files }),
    }),
  getRun: (id: string) => req<ResearchRun>(`/api/research/${id}`),
  getHistory: () => req<{ history: HistoryItem[] }>("/api/research/history"),
  getGraph: (id: string) => req<{ nodes: unknown[]; edges: unknown[] }>(`/api/research/${id}/graph`),
  getAgentInspector: (id: string, agent: string) =>
    req<AgentInspectorData>(`/api/research/${id}/agents/${agent}`),
  getDatasets: () => req<{ working_directory: string; datasets: Dataset[] }>("/api/datasets"),
  streamUrl: (id: string) => `${API_BASE}/api/research/${id}/stream`,
};
