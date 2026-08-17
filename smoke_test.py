"""
Smoke test: instantiate every Pramaan AI agent and make one real LLM call each.

Verifies the configured model can actually be reached and can drive each agent
(tool binding, structured output, prompt loading) before running a full graph.

    python tests/smoke_agents.py            # all agents
    python tests/smoke_agents.py planner_agent verifier_agent

Exits non-zero if any agent fails, so it can gate a deploy.
"""
from __future__ import annotations

import os
import sys
import time
import traceback
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from src.core.language_models import LanguageModelManager  # noqa: E402
from src.core.state import create_initial_state  # noqa: E402
from src.agents.factory import AgentFactory  # noqa: E402

QUESTION = "Does intermittent fasting improve metabolic health markers in adults?"

AGENTS = [
    "planner_agent",
    "supervisor_agent",
    "literature_agent",
    "extractor_agent",
    "challenger_agent",
    "ledger_agent",
    "verifier_agent",
    "synthesizer_agent",
    "evidence_graph_agent",
]


def main() -> int:
    selected = sys.argv[1:] or AGENTS
    unknown = [a for a in selected if a not in AGENTS]
    if unknown:
        print(f"unknown agent(s): {', '.join(unknown)}")
        print(f"available: {', '.join(AGENTS)}")
        return 2

    lm = LanguageModelManager()
    factory = AgentFactory(lm, team_members=AGENTS)
    state = create_initial_state(QUESTION)

    model_name = lm.get_model_config("planner_agent").get("model", "?")
    print(f"model: {model_name}")
    print(f"question: {QUESTION}\n")

    results: list[tuple[str, bool, float, str]] = []

    for name in selected:
        start = time.monotonic()
        try:
            agent = factory.create_agent(name)
            output = agent.invoke(state)
            elapsed = time.monotonic() - start

            # Any non-empty response means the model answered through this
            # agent's prompt and tool bindings.
            text = str(output)
            detail = f"{len(text)} chars"
            ok = bool(text.strip())
            if not ok:
                detail = "empty response"
            results.append((name, ok, elapsed, detail))
            print(f"{'PASS' if ok else 'FAIL'}  {name:24} {elapsed:6.1f}s  {detail}")

        except Exception as e:
            elapsed = time.monotonic() - start
            msg = f"{type(e).__name__}: {e}"
            results.append((name, False, elapsed, msg))
            print(f"FAIL  {name:24} {elapsed:6.1f}s  {msg[:160]}")
            if os.getenv("SMOKE_VERBOSE"):
                traceback.print_exc()

    passed = sum(1 for _, ok, _, _ in results if ok)
    total_time = sum(t for _, _, t, _ in results)
    print(f"\n{passed}/{len(results)} agents passed in {total_time:.1f}s total")

    if passed < len(results):
        print("\nfailed:")
        for name, ok, _, detail in results:
            if not ok:
                print(f"  {name}: {detail[:200]}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
