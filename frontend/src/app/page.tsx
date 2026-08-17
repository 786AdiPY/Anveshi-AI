// Landing — the marketing front door at "/". The app itself (research canvas,
// history, settings) lives behind the sidebar at /dashboard and friends.
//
// Editorial register: an achromatic palette, Lexend, and scroll mechanics that
// carry the argument rather than decorate it. Five chapters: the problem with
// ungrounded answers → the nine-agent pipeline (scroll-pinned, horizontal) →
// the verifier gate that can send work back → the evidence graph every claim
// traces through → the platform surface underneath it.
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import {
  Reveal,
  RevealWords,
  useActiveSection,
  useLinePlayback,
  useMagnetic,
  usePageProgress,
  useReducedMotion,
  useScrolled,
  useSectionProgress,
  useTilt3D,
} from "@/lib/motion";
import "./landing.css";

const CHAPTERS = [
  { id: "problem", label: "The problem" },
  { id: "agents", label: "Agents" },
  { id: "gate", label: "The gate" },
  { id: "graph", label: "Evidence graph" },
  { id: "platform", label: "Platform" },
];

export default function Landing() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    });
  }, []);

  return (
    <div className="lp" id="top">
      <ProgressRail />
      <Nav />
      <ChapterRail />
      <main className="lp-main">
        <Hero />
        <Ticker />
        <Problem />
        <Pipeline />
        <Gate />
        <EvidenceGraph />
        <Platform />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

// ── reading progress ─────────────────────────────────────────────────────────
function ProgressRail() {
  const p = usePageProgress();
  return (
    <div className="lp-rail" aria-hidden="true">
      <div className="lp-rail__fill" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

// ── nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const scrolled = useScrolled(24);
  return (
    <header className={`lp-nav ${scrolled ? "is-scrolled" : ""}`}>
      <a className="lp-nav__brand" href="#top">
        <Mark />
        <span>Anveshi AI</span>
      </a>
      <nav className="lp-nav__links" aria-label="Sections">
        <a href="#problem">Problem</a>
        <a href="#agents">Agents</a>
        <a href="#gate">Gate</a>
        <a href="#platform">Platform</a>
      </nav>
      <Link href="/dashboard" className="lp-nav__cta">
        Open the console
        <Arrow />
      </Link>
    </header>
  );
}

import Image from "next/image";

function Mark() {
  return (
    <span className="lp-mark" aria-hidden="true">
      <Image src="/logo.png" alt="Anveshi AI Logo" width={22} height={22} className="brand-logo-img" priority unoptimized />
    </span>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" className="lp-arrow" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── chapter rail ─────────────────────────────────────────────────────────────
const CHAPTER_IDS = CHAPTERS.map((c) => c.id);

function ChapterRail() {
  const active = useActiveSection(CHAPTER_IDS);
  return (
    <nav className="lp-chapters" aria-label="Chapters">
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              className={active === c.id ? "is-active" : ""}
              aria-current={active === c.id ? "location" : undefined}
            >
              <span className="lp-chapters__n lp-mono">{String(i + 1).padStart(2, "0")}</span>
              <span className="lp-chapters__l">{c.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ── hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const reduced = useReducedMotion();
  const tiltRef = useTilt3D<HTMLDivElement>(reduced ? 0 : 7);

  return (
    <section className="lp-hero">
      <div className="lp-wrap">
        <Reveal className="lp-hero__eyebrow">
          <span className="lp-dot" aria-hidden="true" />
          Multi-agent evidence verification for deep research
        </Reveal>

        <h1 className="lp-hero__title">
          <RevealWords text="Answers you can" as="span" className="lp-hero__line" />
          <RevealWords
            text="actually prove."
            as="span"
            className="lp-hero__line lp-hero__line--em"
            start={2}
          />
        </h1>

        <Reveal as="p" className="lp-hero__body" delay={2}>
          Anveshi AI coordinates specialized agents to search literature, extract claims, hunt for
          counter-evidence, and enforce strict verification gates — so every sentence in your
          brief traces directly back to source text.
        </Reveal>

        <Reveal className="lp-hero__cta-row" delay={3}>
          <Link href="/dashboard" className="lp-btn lp-btn--primary">
            Start a research run
            <Arrow />
          </Link>
          <a href="#agents" className="lp-btn lp-btn--ghost">
            Explore the 9 agents
          </a>
        </Reveal>

        <Reveal className="lp-hero__stage" delay={4}>
          <div className="lp-card-stage" ref={tiltRef}>
            <div className="lp-card-stage__glow" aria-hidden="true" />
            <div className="lp-card-stage__card">
              <div className="lp-card-stage__head">
                <span className="lp-card-stage__status">
                  <i className="lp-dot lp-dot--live" /> VERIFYING CLAIM 14/22
                </span>
                <span className="lp-mono lp-card-stage__id">RUN #8F2A</span>
              </div>
              <p className="lp-card-stage__query">
                &ldquo;Does early time-restricted feeding improve insulin sensitivity independent of
                weight loss?&rdquo;
              </p>
              <div className="lp-card-stage__split">
                <div className="lp-card-stage__claim">
                  <span className="lp-mono lp-card-stage__tag">EXTRACTED CLAIM</span>
                  <p>
                    &ldquo;eTRF improved insulin sensitivity by 24% (p=0.01) without significant
                    changes in body mass.&rdquo;
                  </p>
                </div>
                <div className="lp-card-stage__verdict">
                  <span className="lp-mono lp-card-stage__tag lp-card-stage__tag--pass">
                    VERIFIED · 98% FIDELITY
                  </span>
                  <p>
                    Matched to <i>Sutton et al., Cell Metabolism 2018</i>, p.461, par. 3.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── ticker ───────────────────────────────────────────────────────────────────
const PROOFS = [
  "Zero hallucinated citations",
  "Adversarial counter-evidence hunting",
  "Automated claim deduplication",
  "Dagre Directed Evidence Graphs",
  "Exportable PDF & Markdown reports",
  "Human-in-the-loop plan review",
];

function Ticker() {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <div className="lp-ticker lp-ticker--static" aria-label="Key features">
        <div className="lp-wrap lp-ticker__static-wrap">
          {PROOFS.map((p) => (
            <span key={p} className="lp-ticker__item">
              <i className="lp-dot" aria-hidden="true" />
              {p}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lp-ticker" aria-hidden="true">
      <div className="lp-ticker__track">
        {[...PROOFS, ...PROOFS].map((p, i) => (
          <span key={`${p}-${i}`} className="lp-ticker__item">
            <i className="lp-dot" />
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 01 problem ───────────────────────────────────────────────────────────────
function Problem() {
  return (
    <section className="lp-section" id="problem">
      <div className="lp-wrap">
        <SectionLabel n="01" t="The problem" />
        <h2 className="lp-h2">
          <RevealWords text="Confident answers are easy." as="span" className="lp-h2__l" />
          <RevealWords
            text="Trusting them is the hard part."
            as="span"
            className="lp-h2__l lp-h2__l--em"
            start={4}
          />
        </h2>

        <div className="lp-cols">
          <Reveal as="p" delay={1}>
            Ask a language model a research question and it will answer — fluently, and with a
            citation that sounds real. Sometimes the paper exists and says something close to
            what was claimed. Sometimes the excerpt has been quietly stretched past what it
            actually supports. From the outside, both look identical.
          </Reveal>
          <Reveal as="p" delay={2}>
            So teams either trust it and hope, or refuse to let AI touch research at all —
            re-deriving by hand what a model could have found in minutes. Neither is really a
            choice about the answer. It&rsquo;s a choice about how much proof you&rsquo;re
            willing to go without.
          </Reveal>
        </div>

        <Reveal className="lp-quote" delay={3}>
          <blockquote>The blocker was never generating an answer. It was proving it.</blockquote>
        </Reveal>
      </div>
    </section>
  );
}

function SectionLabel({ n, t }: { n: string; t: string }) {
  return (
    <Reveal className="lp-label">
      <span className="lp-mono">{n}</span>
      <i aria-hidden="true" />
      <span>{t}</span>
    </Reveal>
  );
}

// ── 02 agents — scroll-pinned horizontal ───────────────────────────────────
const STAGES = [
  {
    k: "Planner",
    t: "Turn a question into an investigation.",
    d: "Decomposes the research question into targeted subquestions, initial hypotheses, and exact web search queries — zero prompt engineering required.",
    m: "subquestions · hypotheses · queries",
  },
  {
    k: "Supervisor",
    t: "Decide what happens next.",
    d: "Orchestrates execution state and dynamically routes work to literature search, claim extraction, verification, or final synthesis. Verification failures route back here automatically.",
    m: "state → dynamic agent routing",
  },
  {
    k: "Literature",
    t: "Go find what's actually out there.",
    d: "Discovers peer-reviewed academic papers, preprints, and web sources for every subquestion using Tavily search and fastCRW scraping.",
    m: "papers · preprints · web sources",
  },
  {
    k: "Extractor",
    t: "Pull out claims that can be checked.",
    d: "Reads raw source text and extracts specific, falsifiable claims paired with verbatim supporting excerpts — not vague summaries.",
    m: "claim + verbatim excerpt pairs",
  },
  {
    k: "Challenger",
    t: "Actively seek counter-evidence.",
    d: "Executes an adversarial pass to specifically search for opposing studies, failed replications, and methodological flaws across all claims.",
    m: "counter-evidence · anti-bias pass",
  },
  {
    k: "Ledger",
    t: "Maintain ground-truth state.",
    d: "Logs all extracted claim-evidence pairs into a structured ledger with deduplication, confidence scores, and source provenance tracking.",
    m: "claims ledger · provenance log",
  },
  {
    k: "Verifier",
    t: "Check it, or send it back.",
    d: "Evaluates claim fidelity against cited source texts: flags hallucinated citations, checks relevance, and routes failing work back to the Supervisor.",
    m: "PASS · FAIL · UNCERTAIN gates",
  },
  {
    k: "Synthesizer",
    t: "Write only what survived.",
    d: "Synthesizes the final research brief strictly from verified claims — inserting citations, highlighting contradictions, and surfacing research gaps.",
    m: "research brief · citations · gaps",
  },
  {
    k: "Evidence Graph",
    t: "Make the trail visible.",
    d: "Constructs a directed top-down DAG tree mapping research question -> verified claims -> source papers with Dagre Sugiyama topology.",
    m: "question → claims → source papers",
  },
];

function Pipeline() {
  const reduced = useReducedMotion();
  const [progressRef, p] = useSectionProgress<HTMLElement>("pin");
  const vpRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion bypass, not derived state
      setOverflow(0);
      return;
    }
    const measure = () => {
      const vp = vpRef.current;
      const track = trackRef.current;
      if (!vp || !track) return;
      setOverflow(Math.max(0, track.scrollWidth - vp.clientWidth));
    };
    measure();
    window.addEventListener("resize", measure);
    const t = window.setTimeout(measure, 300);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [reduced]);

  const activeIndex = Math.min(STAGES.length - 1, Math.round(p * (STAGES.length - 1)));

  return (
    <section
      className={`lp-pin ${reduced ? "is-static" : ""}`}
      id="agents"
      ref={progressRef}
      style={overflow ? { height: `calc(100vh + ${overflow}px)` } : undefined}
    >
      <div className="lp-pin__stage">
        <div className="lp-wrap lp-pin__head">
          <SectionLabel n="02" t="The Agents" />
          <h2 className="lp-h2 lp-h2--tight">Nine specialized agents, every single one auditable.</h2>
          <div className="lp-pin__meter" aria-hidden="true">
            <div className="lp-pin__meter-fill" style={{ transform: `scaleX(${p})` }} />
          </div>
        </div>

        <div className="lp-pin__vp" ref={vpRef}>
          <div
            className="lp-pin__track"
            ref={trackRef}
            style={reduced ? undefined : { transform: `translate3d(${-p * overflow}px,0,0)` }}
          >
            {STAGES.map((s, i) => (
              <article className={`lp-stage ${i === activeIndex ? "is-active" : ""}`} key={s.k}>
                <header>
                  <span className="lp-stage__n lp-mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="lp-stage__k lp-mono">{s.k}</span>
                </header>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <footer className="lp-mono">{s.m}</footer>
              </article>
            ))}
          </div>
        </div>

        <div className="lp-wrap lp-pin__dots" aria-hidden="true">
          {STAGES.map((s, i) => (
            <span key={s.k} className={i <= activeIndex ? "is-on" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 03 the gate ──────────────────────────────────────────────────────────────
const CLAIMS = [
  {
    n: "RAG reduces hallucination ~23% vs baseline",
    check: "Excerpt confirms the figure and its scope",
    pass: true,
  },
  {
    n: "Fine-tuning always wins at scale",
    check: "Overgeneralized — no scale-specific evidence",
    pass: false,
  },
  {
    n: "Cost is the primary driver of RAG adoption",
    check: "Cited source never makes this claim",
    pass: false,
  },
];

const TERMINAL = [
  { t: "cmd", v: 'anveshi research "RAG vs fine-tuning for enterprise LLMs?"' },
  { t: "out", v: "planner      3 subquestions · 7 search queries" },
  { t: "out", v: "literature   14 sources discovered" },
  { t: "out", v: "extractor    9 claims extracted" },
  { t: "bad", v: "verifier     claim_03   FAIL      overgeneralized, no scale evidence" },
  { t: "out", v: "supervisor   routing back → literature (attempt 2 / 3)" },
  { t: "out", v: "challenger   3 contradicting studies found" },
  { t: "ok", v: "verifier     claim_03   PASS      re-scoped, evidence relevant" },
  { t: "ok", v: "synthesizer  brief compiled → 8 claims, 3 contradictions surfaced" },
];

function Gate() {
  const [ref, shown] = useLinePlayback(TERMINAL.length, 240);

  return (
    <section className="lp-section lp-section--ink" id="gate">
      <div className="lp-wrap">
        <SectionLabel n="03" t="The gate" />
        <h2 className="lp-h2">
          <RevealWords text="The most valuable thing" as="span" className="lp-h2__l" />
          <RevealWords
            text="it does is say no."
            as="span"
            className="lp-h2__l lp-h2__l--em"
            start={4}
          />
        </h2>

        <div className="lp-gate">
          <div className="lp-gate__copy">
            <Reveal as="p" delay={1}>
              A claim that cites a real paper and reads well can still be wrong — overgeneralized,
              mis-scoped, or resting on an excerpt that never says what&rsquo;s claimed. The
              Verifier checks all four before anything ships.
            </Reveal>
            <Reveal as="p" delay={2}>
              A claim that fails isn&rsquo;t softened into a caveat. It&rsquo;s sent back to the
              Supervisor for another round — up to three times — before an unresolved question
              shows up honestly as a research gap instead of a confident guess.
            </Reveal>

            <Reveal className="lp-table" delay={3}>
              <table>
                <caption className="lp-visually-hidden">
                  Example claims and their verifier outcome
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Claim</th>
                    <th scope="col">Verifier check</th>
                    <th scope="col">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {CLAIMS.map((c) => (
                    <tr key={c.n} className={c.pass ? "is-pass" : ""}>
                      <td>{c.n}</td>
                      <td className="lp-mono">{c.check}</td>
                      <td>
                        <span className={`lp-tag ${c.pass ? "lp-tag--pass" : "lp-tag--block"}`}>
                          {c.pass ? "Shipped" : "Blocked"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
            <Reveal as="p" className="lp-fineprint" delay={4}>
              Illustrative — the same four checks the Verifier applies to every claim in your
              report, and the same loop the Supervisor runs on a fail. Not a captured transcript.
            </Reveal>
          </div>

          <div className="lp-term" ref={ref}>
            <div className="lp-term__bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span className="lp-mono">run · rag_vs_finetune</span>
            </div>
            <pre className="lp-term__body" aria-label="Example pipeline run output">
              {TERMINAL.slice(0, shown).map((l, i) => (
                <div className={`lp-term__l lp-term__l--${l.t}`} key={i}>
                  {l.t === "cmd" && <span className="lp-term__p">$</span>}
                  {l.v}
                </div>
              ))}
              {shown < TERMINAL.length && <span className="lp-term__caret" />}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 04 evidence graph ────────────────────────────────────────────────────────
function EvidenceGraph() {
  return (
    <section className="lp-section" id="graph">
      <div className="lp-wrap">
        <SectionLabel n="04" t="Evidence graph" />
        <h2 className="lp-h2">
          <RevealWords text="Every claim has a receipt." as="span" className="lp-h2__l" />
          <RevealWords
            text="Including the ones that don't hold up."
            as="span"
            className="lp-h2__l lp-h2__l--em"
            start={5}
          />
        </h2>

        <div className="lp-egraph">
          <Reveal className="lp-egraph__copy" delay={1}>
            <p>
              A claim in the final report isn&rsquo;t a floating sentence. It&rsquo;s a node with
              edges — to the evidence excerpt that supports it, to the paper that excerpt came
              from, and to any contradiction the Challenger turned up along the way.
            </p>
            <p>
              Open the graph and walk that trail yourself: claim → evidence → source, and
              separately, claim → contradiction → source. Nothing in the brief exists without a
              path back to where it came from.
            </p>
          </Reveal>

          <Reveal className="lp-graphviz" delay={2}>
            <GraphDiagram />
            <p className="lp-fineprint">
              Every node here mirrors a real field on the evidence-graph response — claim,
              evidence, source paper, contradiction.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function GraphNode({ label, sub, tone }: { label: string; sub: string; tone?: "claim" | "block" }) {
  return (
    <div className={`lp-node ${tone === "claim" ? "lp-node--claim" : ""} ${tone === "block" ? "lp-node--block" : ""}`}>
      <span className="lp-node__l">{label}</span>
      <span className="lp-node__s lp-mono">{sub}</span>
    </div>
  );
}

function GraphDiagram() {
  return (
    <div
      className="lp-graph"
      role="img"
      aria-label="Claim traced through evidence to a source paper, and separately to a contradiction and its source"
    >
      <div className="lp-graph__row">
        <GraphNode label="Evidence" sub="excerpt · p. 4" />
        <GraphEdge text="from" />
        <GraphNode label="Paper" sub="Smith et al., 2023" />
      </div>

      <div className="lp-graph__link" aria-hidden="true">
        <i />
        <span className="lp-mono">supports</span>
      </div>

      <div className="lp-graph__spine">
        <GraphNode label="Claim" sub="claim_03" tone="claim" />
      </div>

      <div className="lp-graph__link lp-graph__link--block" aria-hidden="true">
        <i />
        <span className="lp-mono">contradicted by</span>
      </div>

      <div className="lp-graph__row">
        <GraphNode label="Contradiction" sub="counter-finding" tone="block" />
        <GraphEdge text="from" />
        <GraphNode label="Source" sub="Lin et al., 2024" />
      </div>
    </div>
  );
}

function GraphEdge({ text }: { text: string }) {
  return (
    <span className="lp-edge lp-mono" aria-hidden="true">
      <i />
      {text}
      <i />
    </span>
  );
}

// ── 05 platform — sticky stacked cards ───────────────────────────────────────
const CAPS = [
  {
    k: "One workflow, any question",
    d: "The Planner decomposes whatever research question you ask into subquestions and search queries — no per-topic prompt engineering, no manual workflow setup.",
  },
  {
    k: "A gate you can't talk your way past",
    d: "Verification is enforced in the graph itself, via LangGraph routing, not left as a review step a human has to remember to run.",
  },
  {
    k: "An adversary built in",
    d: "The Challenger actively searches for counter-evidence and methodological flaws before you ever see the report — not a fact-check you have to request afterward.",
  },
  {
    k: "Config over code",
    d: "MCP servers cover filesystem, web search, and GitHub access. agent_models.yaml lets you swap providers and models per agent without touching a line of code.",
  },
  {
    k: "Progressive disclosure for agents",
    d: "Reusable skills and per-agent prompts live under one CONFIG_DIRECTORY, inspired by Claude Agent Skills — switching dev and prod is a folder swap, not a redeploy.",
  },
  {
    k: "Live, not a spinner",
    d: "Server-sent events stream every agent action, token count, and state transition to the UI as it happens, with a per-agent inspector for exactly what each one found.",
  },
  {
    k: "A ledger, not a black box",
    d: "Every run threads its execution trace, token usage, and cost estimate through the Research Ledger, so you can answer exactly what ran and what it cost.",
  },
];

function Platform() {
  return (
    <section className="lp-section" id="platform">
      <div className="lp-wrap">
        <SectionLabel n="05" t="Platform" />
        <h2 className="lp-h2 lp-h2--tight">Built to be handed to a team.</h2>
      </div>

      <div className="lp-wrap lp-stack">
        {CAPS.map((c, i) => (
          <article className="lp-stack__card" key={c.k} style={{ ["--i" as string]: i }}>
            <span className="lp-stack__n lp-mono">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{c.k}</h3>
              <p>{c.d}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── cta ──────────────────────────────────────────────────────────────────────
function Cta() {
  const ref = useMagnetic<HTMLAnchorElement>(0.2);
  return (
    <section className="lp-cta">
      <div className="lp-wrap">
        <h2 className="lp-display lp-display--cta">
          <RevealWords as="span" className="lp-display__line" text="Ask something." />
        </h2>
        <Reveal className="lp-cta__actions" delay={2}>
          <Link ref={ref} href="/dashboard" className="lp-btn lp-btn--solid lp-btn--lg">
            Open the console
            <Arrow />
          </Link>
          <Link href="/research/new" className="lp-btn lp-btn--ghost lp-btn--lg">
            Start a research question
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

// ── footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer__in">
        <a className="lp-nav__brand" href="#top">
          <Mark />
          <span>Anveshi AI</span>
        </a>
        <nav aria-label="Footer">
          <Link href="/dashboard">Console</Link>
          <Link href="/research/new">New research</Link>
          <Link href="/history">History</Link>
          <a href="#pipeline">Pipeline</a>
        </nav>
        <p className="lp-mono">Plan · Research · Challenge · Verify · Synthesize</p>
      </div>
    </footer>
  );
}
