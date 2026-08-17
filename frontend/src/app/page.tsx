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
  { id: "pipeline", label: "The pipeline" },
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
        <a href="#pipeline">Pipeline</a>
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

function Mark() {
  return (
    <span className="lp-mark" aria-hidden="true">
      <ShieldCheck size={18} strokeWidth={2.2} />
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
          <li key={c.id} className={active === c.id ? "is-active" : ""}>
            <a href={`#${c.id}`}>
              <span className="lp-chapters__n">{String(i + 1).padStart(2, "0")}</span>
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
  const cta = useMagnetic<HTMLAnchorElement>(0.22);

  return (
    <section className="lp-hero">
      <div className="lp-hero__inner">
        <p className="lp-eyebrow">
          <span className="lp-eyebrow__dot" aria-hidden="true" />
          Multi-agent research — planned, challenged, verified
        </p>

        <h1 className="lp-display">
          <RevealWords as="span" className="lp-display__line" text="Answers you can trace." />
          <RevealWords
            as="span"
            className="lp-display__line lp-display__line--em"
            text="Not just answers."
            start={3}
          />
        </h1>

        <Reveal className="lp-hero__lead" delay={4}>
          <p>
            Anveshi AI plans a research question, finds the literature, and extracts claims —
            then turns an adversarial agent loose on its own findings. Nothing reaches your
            report until the Verifier can trace it back to a real source.
          </p>
        </Reveal>

        <Reveal className="lp-hero__actions" delay={5}>
          <Link ref={cta} href="/dashboard" className="lp-btn lp-btn--solid">
            Open the console
            <Arrow />
          </Link>
          <a href="#pipeline" className="lp-btn lp-btn--ghost">
            See how it works
          </a>
        </Reveal>

        <Reveal className="lp-spec" delay={6}>
          <SpecItem k="Sources" v="Academic papers · preprints · web · your files" />
          <SpecItem k="Agents" v="9, LangGraph-orchestrated" />
          <SpecItem k="Gate" v="PASS · FAIL · UNCERTAIN" />
          <SpecItem k="Ledger" v="Full execution trace, cost tracked" />
        </Reveal>
      </div>

      <Reveal className="lp-hero__figure" delay={4}>
        <HeroFigure />
      </Reveal>
    </section>
  );
}

function SpecItem({ k, v }: { k: string; v: string }) {
  return (
    <div className="lp-spec__item">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

/** A claim card showing what the Verifier actually gates: how many claims
 * survive a first pass, versus after the Challenger's counter-search. */
function HeroFigure() {
  const tilt = useTilt3D<HTMLDivElement>(10);

  return (
    <div className="lp-float">
      <div className="lp-fig3d" ref={tilt}>
        <figure className="lp-fig">
          <span className="lp-fig__glare" aria-hidden="true" />

          <figcaption className="lp-fig__head" data-depth="3">
            <span className="lp-mono">claim_07 · verifier</span>
            <span className="lp-tag lp-tag--pass">Gate passed</span>
          </figcaption>

          <div className="lp-fig__row" data-depth="2">
            <span className="lp-fig__k">First pass</span>
            <div className="lp-fig__track">
              <div className="lp-fig__bar" style={{ width: "67%" }} />
            </div>
            <span className="lp-fig__v lp-mono">4 / 6</span>
          </div>

          <div className="lp-fig__row" data-depth="2">
            <span className="lp-fig__k">After Challenger</span>
            <div className="lp-fig__track">
              <div className="lp-fig__bar lp-fig__bar--accent" style={{ width: "100%" }} />
            </div>
            <span className="lp-fig__v lp-mono">6 / 6</span>
          </div>

          <div className="lp-fig__foot" data-depth="4">
            <div>
              <span className="lp-fig__big lp-mono">3×</span>
              <span className="lp-fig__lbl">max re-investigation loops</span>
            </div>
            <div>
              <span className="lp-fig__big lp-mono">0</span>
              <span className="lp-fig__lbl">unverified claims shipped</span>
            </div>
          </div>
        </figure>
      </div>
    </div>
  );
}

// ── source ticker ─────────────────────────────────────────────────────────────
const MARQUEE = [
  "arXiv",
  "Tavily",
  "Wikipedia",
  "Firecrawl",
  "GitHub",
  "LangGraph",
  "LangChain",
  "Model Context Protocol",
];

function Ticker() {
  return (
    <div className="lp-ticker" aria-hidden="true">
      <div className="lp-ticker__track">
        {[0, 1].map((copy) => (
          <div className="lp-ticker__group" key={copy}>
            {MARQUEE.map((m) => (
              <span key={`${copy}-${m}`} className="lp-ticker__item">
                {m}
                <i />
              </span>
            ))}
          </div>
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

// ── 02 pipeline — scroll-pinned horizontal ───────────────────────────────────
const STAGES = [
  {
    k: "Planner",
    t: "Turn a question into an investigation.",
    d: "The research question is decomposed into subquestions, initial hypotheses, and the search queries needed to start finding sources — no per-topic prompt engineering required.",
    m: "subquestions · search queries",
  },
  {
    k: "Supervisor",
    t: "Decide what happens next.",
    d: "The orchestrator reads the current research state and routes to whichever agent it actually needs — more sources, more extraction, more scrutiny, or the final write-up. Verification failures route back here, not to someone's inbox.",
    m: "state → next agent",
  },
  {
    k: "Literature",
    t: "Go find what's actually out there.",
    d: "Discovers academic papers, preprints, and web sources for every subquestion, prioritizing peer-reviewed work and arXiv over generic search results.",
    m: "papers · preprints · web",
  },
  {
    k: "Extractor",
    t: "Pull out claims that can be checked.",
    d: "Reads the discovered sources and extracts specific, falsifiable claims paired with their supporting evidence excerpts — not summaries, sentences a reader could verify.",
    m: "claim + excerpt pairs",
  },
  {
    k: "Challenger",
    t: "Argue with your own findings.",
    d: "An adversarial pass searches specifically for opposing results, failed replications, and methodological criticism of every claim already on the ledger — before a user ever sees it.",
    m: "counter-evidence",
  },
  {
    k: "Verifier",
    t: "Check it, or send it back.",
    d: "Every claim is checked against its source: does it exist, does it say what's claimed, is the excerpt relevant, is it overgeneralized. Anything that fails routes back to the Supervisor — up to three times.",
    m: "PASS · FAIL · UNCERTAIN",
  },
  {
    k: "Synthesizer",
    t: "Write only what survived.",
    d: "Compiles the research brief from verified claims alone — citing sources, surfacing contradictions, and naming the questions the evidence couldn't settle instead of papering over them.",
    m: "brief · citations · gaps",
  },
  {
    k: "Evidence Graph",
    t: "Make the trail visible.",
    d: "Every claim, its evidence, its source paper, and any contradiction found along the way is mapped into a graph you can open — so “trust me” is never the only option.",
    m: "claim → evidence → source",
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
      id="pipeline"
      ref={progressRef}
      style={overflow ? { height: `calc(100vh + ${overflow}px)` } : undefined}
    >
      <div className="lp-pin__stage">
        <div className="lp-wrap lp-pin__head">
          <SectionLabel n="02" t="The pipeline" />
          <h2 className="lp-h2 lp-h2--tight">Eight stages, every one of them auditable.</h2>
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
