-- Pramaan AI — Supabase schema
--
-- Run this once in the Supabase SQL editor (or `supabase db push` if you use
-- the CLI) before setting SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.
--
-- One table, mirroring the shape already used in-memory by src/api.py
-- (RESEARCH_RUNS[run_id]) so the API layer needed minimal rewiring: `events`
-- and `latest_state` stay JSONB rather than being normalized into six
-- relational tables. Revisit that only if querying into papers/claims
-- individually (e.g. cross-run search) becomes a real need.

create table if not exists research_runs (
  id uuid primary key,
  question text not null,
  depth text not null default 'standard',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  events jsonb not null default '[]'::jsonb,
  latest_state jsonb not null default '{}'::jsonb
);

create index if not exists research_runs_created_at_idx on research_runs (created_at desc);
create index if not exists research_runs_status_idx on research_runs (status);

-- The backend talks to this table with the service_role key, which bypasses
-- Row Level Security entirely — RLS below only matters if this table is ever
-- queried directly from a browser with the anon key. Enabled defensively so
-- that doesn't silently expose every user's research runs to every other user.
alter table research_runs enable row level security;

drop policy if exists "service role full access" on research_runs;
create policy "service role full access" on research_runs
  for all
  to service_role
  using (true)
  with check (true);
