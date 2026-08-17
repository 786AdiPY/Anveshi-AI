# Anveshi AI — UI Execution Plan

## Page 1 — Main Dashboard `/`

**Purpose:** Start and manage research.

### Contents

**Left sidebar**
- Anveshi AI logo
- New Research
- Research History
- Saved Reports
- Settings

**Main area**
- `Research` heading
- Large research-question input
- File upload
- Research depth: Quick / Standard / Deep
- `Start Research`

**Below**
- Suggested research prompts
- Recent research cards:
  - title
  - date
  - status
  - source count
  - open button

### Flow

```text
Question + optional files
        ↓
Start Research
        ↓
POST /research
        ↓
/research/:id/config
```

---

## Page 2 — Research Configuration `/research/new`

**Purpose:** Let the user confirm the investigation before execution.

### Contents

**Research Question**
- Editable question

**Research Plan**
- Subquestions
- Hypotheses
- Research objectives

**Sources**
- Academic papers
- Preprints
- Web sources
- Uploaded documents

**Output**
- Research brief
- Evidence citations
- Contradictory findings
- Research gaps

### Actions

```text
← Edit Question        Start Research →
```

The existing HumanReview concept becomes this optional plan-review step.

---

## Page 3 — Live Research `/research/:id/run`

**Purpose:** Show the agent workflow while it is executing.

### Top bar

```text
Research: Does X affect Y?

● Running                         Pause   Stop
```

### Main n8n-style canvas

```text
                 ┌──────────┐
                 │ Planner  │
                 └────┬─────┘
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
     Literature    Evidence    Challenger
      Research     Extractor
          │           │           │
          └───────────┼───────────┘
                      ↓
                  Verifier
                      │
                 ┌────┴────┐
                 ↓         ↓
                PASS      FAIL
                 │         │
                 │         └──→ Research
                 ↓
             Synthesizer
```

### Node states

Each node has:

- WAITING
- RUNNING
- COMPLETED
- FAILED

Each node shows:
- current action
- duration
- output count
- error state if applicable

### Bottom metrics

```text
Sources 24 | Claims 31 | Verified 26 | Conflicts 3
Runtime 01:42 | Estimated Cost $0.14
```

---

## Page 4 — Agent Inspector `/research/:id/run/:agent`

**Purpose:** Inspect what an agent did without exposing chain-of-thought.

### Contents

- Agent name
- Status
- Duration
- Sources/results produced
- Current/completed action
- Findings
- Links to evidence/sources

### Example

```text
CHALLENGER

Status       Completed
Duration     18s
Sources      6

ACTION
Searching for contradictory evidence.

FINDINGS
3 contradictory studies found.

[View Sources]
```

For the Verifier:

```text
VERIFIER

Claims evaluated       31
Verified                26
Rejected                 3
Uncertain                2

REJECTED CLAIM
C-017
"X universally improves Y."

Reason:
Available evidence only covers condition Z.

[View Evidence]
```

**Never expose chain-of-thought. Show actions, results, evidence, and decisions only.**

---

## Page 5 — Merged into Page 6

There is **no separate Evidence Explorer page**.

Evidence inspection is embedded directly into the Evidence Graph.

---

## Page 6 — Evidence Graph `/research/:id/graph`

**Purpose:** Combine provenance visualization and claim/evidence inspection in one workspace.

### Main area — interactive graph

```text
                   RESEARCH QUESTION
                           │
                           ▼
                      HYPOTHESIS
                      /                             ▼          ▼
                  CLAIM 01    CLAIM 02
                  /    \          │
                 ▼      ▼         ▼
              PAPER A PAPER B   PAPER C
                                                       ▼
                       CONTRADICTION
                            │
                            ▼
                         PAPER D
```

### Graph interaction

Click any:

- Question
- Hypothesis
- Claim
- Evidence
- Paper
- Contradiction

to open its details.

### Right-side detail panel

For a selected claim:

```text
CLAIM C-17

X improves Y under condition Z.

Confidence
████████░░ 87%

VERIFICATION
⚠ Partially supported

SUPPORTING EVIDENCE
────────────────────
Paper A
Evidence excerpt...
[Open Source]

Paper B
Evidence excerpt...
[Open Source]

CONTRADICTING EVIDENCE
───────────────────────
Paper F
Evidence excerpt...
[Open Source]

CHECKS
───────────────────────
✓ Source exists
✓ Claim supported
⚠ Limited generalization
```

### Claim list

A collapsible panel can provide:

```text
CLAIMS

✓ C-001
✓ C-002
⚠ C-003
✕ C-004
✓ C-005
```

Selecting a claim centers the graph on that claim and populates the detail panel.

---

## Page 7 — Final Research Report `/research/:id`

**Purpose:** Primary user-facing output.

No agent graph or terminal output.

### Header

```text
Research Brief
Does X affect Y?

31 sources · 26 verified claims · 2m 14s
```

### Contents

```text
EXECUTIVE SUMMARY
...

KEY FINDINGS

01 — Finding
High confidence
7 supporting sources
[View Evidence]

02 — Finding
Medium confidence
4 supporting · 2 contradictory
[View Evidence]

03 — Finding
Low confidence
Insufficient evidence

RESEARCH GAPS
...

LIMITATIONS
...

SOURCES
[1] ...
[2] ...
[3] ...
```

### Actions

- Export PDF
- Export Markdown
- Share Report
- View Research Process
- View Evidence Graph

---

## Page 8 — Research History `/history`

**Purpose:** Access previous research runs.

### Contents

Research cards showing:

- title
- status
- source count
- date
- runtime
- open report

### Filters

- All
- Running
- Completed
- Failed

---

## Page 9 — Settings `/settings`

**Purpose:** Configure the research system.

### Model Settings

- Default model
- Research model
- Verification model

### Research Settings

- Default research depth
- Preferred sources
- Maximum research iterations

### Cost Settings

- Maximum run cost
- Cost warning threshold

### Account / Session

Basic user settings.

---

# Navigation

```text
                         DASHBOARD
                             │
                    ┌────────┴────────┐
                    ↓                 ↓
               NEW RESEARCH       HISTORY
                    │
                    ↓
              CONFIGURATION
                    │
                    ↓
              LIVE RESEARCH
                    │
          ┌─────────┼──────────┐
          ↓         ↓          ↓
       Inspector Evidence    Graph
                    │
                    ▼
              FINAL REPORT
                    │
              ┌─────┴─────┐
              ↓           ↓
           Evidence      Graph
```

The **Evidence Graph contains the former Evidence Explorer functionality**, so there are 8 actual pages rather than 9.

---

# Implementation Priority

## MVP

Build these first:

1. Main Dashboard
2. Research Configuration
3. Live Research Canvas
4. Final Research Report
5. Evidence Graph + embedded evidence inspection

## Second pass

6. Agent Inspector
7. Research History
8. Settings

---

# Visibility Model

### Level 1 — Normal User

```text
Question
   ↓
Research
   ↓
Clean Report
```

### Level 2 — Researcher

```text
Report
   ↓
Claim
   ↓
Evidence
   ↓
Source
```

### Level 3 — Judge / Advanced User

```text
Live Graph
   ↓
Agent Actions
   ↓
Verification
   ↓
Failure / Recovery
   ↓
Cost + Runtime
```

The product remains clean by default while still making the underlying multi-agent system inspectable.
