# Verity — Exact Implementation Plan

> **Goal:** Keep the existing LangGraph orchestration skeleton, but replace its data-analysis purpose with our own evidence-grounded research agent.

## 1. Rename / Repurpose Existing Nodes

| Current | Change to | Exact change |
|---|---|---|
| `hypothesis_agent` | **Planner** | Replace dataset hypotheses with research-question decomposition, subquestions, hypotheses, and search plan |
| `process_agent` | **Supervisor** | Keep as central coordinator; decide which research agent runs next and handle retries |
| `searcher_agent` | **Literature Researcher** | Replace generic search with scientific paper discovery + structured paper metadata |
| `code_agent` | **Evidence Extractor** | Extract claims, evidence, methodology, tables, and useful numerical results from papers |
| `visualization_agent` | **Evidence Graph** | Replace data charts with claim → evidence → source → contradiction visualization |
| `quality_review_agent` | **Evidence Verifier** | Replace generic quality review with claim/citation/evidence verification |
| `note_agent` | **Research Ledger** | Replace notes with shared research state: papers, claims, evidence, contradictions, decisions, agent trace |
| `report_agent` | **Synthesizer** | Produce the final clean research brief instead of a generic data report |
| `HumanReview` | **Optional Plan Review** | Keep the existing node but make it optional rather than mandatory |
| **NEW** | **Challenger** | Independently search for contradictory evidence and weaknesses in current conclusions |

## 2. Change the LangGraph Workflow

### Current

```text
START
  ↓
Hypothesis
  ↓
HumanReview
  ↓
Process
  ├── Code
  ├── Search
  ├── Visualization
  ├── Report
  ├── NoteTaker
  └── QualityReview
          ↓
      revision loop
          ↓
        END
```

### Target

```text
START
  ↓
PLANNER
  ↓
SUPERVISOR
  ├── Literature Researcher
  ├── Evidence Extractor
  └── Challenger
          ↓
       VERIFIER
       ↙     ↘
    FAIL      PASS
     ↓          ↓
 SUPERVISOR   SYNTHESIZER
     ↓          ↓
 research    Evidence
    again      Graph
                ↓
               END
```

The existing **green approval edges** become successful research progression.

The existing **red rejection edges** become evidence-verification failure → additional research.

## 3. Add the Evidence System

Create structured models for:

```text
ResearchQuestion
Hypothesis
Paper
Claim
Evidence
Contradiction
VerificationResult
ResearchRun
AgentEvent
```

Core relationship:

```text
Question
  ↓
Claim
  ↓
Evidence
  ↓
Paper / DOI / URL
```

Contradictions must also be stored:

```text
Claim
  ↓
Contradicting Evidence
  ↓
Source
```

## 4. Add the Research Ledger

Make shared state available to all agents:

```text
Question
Subquestions
Hypotheses
Papers
Claims
Evidence
Contradictions
Verification results
Research attempts
Agent events
```

This replaces the old NoteTaker concept.

## 5. Make Verification Actually Matter

For every important claim, the Verifier checks:

- Does the source exist?
- Does the source support the claim?
- Is the evidence relevant?
- Is the citation correct?
- Is there contradictory evidence?
- Is the claim overgeneralized?

Result:

```text
PASS
FAIL
UNCERTAIN
```

If `FAIL`:

```text
Verifier
  ↓
Supervisor
  ↓
Researcher / Challenger
  ↓
new evidence
  ↓
Verifier
```

## 6. Add Challenger Agent

The Challenger receives the current research state and searches specifically for:

- contradictory studies
- alternative explanations
- methodological weaknesses
- negative results
- conditions where the conclusion fails

This is our main **genuine multi-agent collaboration** feature.

## 7. Change the Final Output

The Synthesizer produces:

```text
Research Question
Executive Summary
Key Findings
Supporting Evidence
Contradictory Evidence
Research Gaps
Limitations
Sources
```

Every important finding must be traceable to evidence.

## 8. Add Execution Trace + Cost

Record:

```text
agent
action
timestamp
papers found
claims created
verification result
retry/research loop
tokens
estimated cost
runtime
```

Example:

```text
Planner       ✓
Researcher    ✓ 24 papers
Challenger    ✓ 3 contradictions
Verifier      ✓ 28 claims
Retry         ✓ 2 claims
Synthesizer   ✓
```

## 9. UI Direction

**Do not expose the architecture by default.**

Default:

```text
Research Question
      ↓
    Research
      ↓
Clean Research Brief
```

Advanced:

> **View research process**

shows agents, evidence graph, verification decisions, contradictions, cost, and execution trace.

## 10. What We Are NOT Doing

- Not building another generic chatbot.
- Not keeping the old data-analysis workflow.
- Not exposing the original project branding.
- Not showing raw agent conversations as the final result.
- Not replacing the existing orchestration architecture unnecessarily.

## Final Product

**Verity — Research you can verify.**

The winning demo should show:

```text
Question
  ↓
Multiple agents investigate
  ↓
Challenger finds conflicting evidence
  ↓
Verifier rejects weak claim
  ↓
Supervisor triggers more research
  ↓
Claim verified
  ↓
Clean report
  ↓
Click claim → see its evidence/source
```
