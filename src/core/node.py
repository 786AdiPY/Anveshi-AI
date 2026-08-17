"""
Pramaan AI — LangGraph Node Handlers
Wraps agent invocations and provides the optional plan-review human node.
"""
from __future__ import annotations
from typing import Any, TYPE_CHECKING
from langchain_core.messages import AIMessage, HumanMessage
import json
import re
import logging
import sys
import time

from .state import State
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from .state import State
    from ..agents.base import BaseAgent

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers (kept from original, needed by BaseAgent infrastructure)
# ---------------------------------------------------------------------------

def get_state_attr(state: "State | dict[str, Any]", key: str, default: Any = None) -> Any:
    if isinstance(state, dict):
        return state.get(key, default)
    return getattr(state, key, default)


def update_artifact_dict(current: dict, new_output: Any) -> dict:
    updated = current.copy() if current else {}
    if isinstance(new_output, dict):
        updated.update(new_output)
    elif isinstance(new_output, str) and new_output:
        ts = int(time.time())
        updated[f"output_{ts}.txt"] = new_output[:100]
    return updated


def safe_get_content(output: Any, keys: list[str], default: str = "") -> str:
    if isinstance(output, str):
        return output
    if isinstance(output, dict):
        for key in keys:
            if key in output:
                return str(output[key])
        return str(output)
    for key in keys:
        if hasattr(output, key):
            val = getattr(output, key, None)
            if val is not None:
                return str(val)
    return str(output) if output else default


def extract_json_from_text(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    json_match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1:
        try:
            return json.loads(text[start_idx : end_idx + 1])
        except json.JSONDecodeError:
            pass
    return None


def get_structured_output(result: Any, agent: "BaseAgent") -> Any:
    if isinstance(result, dict) and "structured_response" in result:
        return result["structured_response"]
    if hasattr(result, "dict") or hasattr(result, "model_dump"):
        return result
    content = ""
    if isinstance(result, dict) and "messages" in result and result["messages"]:
        content = result["messages"][-1].content
    elif hasattr(result, "content"):
        content = result.content
    elif isinstance(result, str):
        content = result
    if content:
        parsed = extract_json_from_text(content)
        if parsed:
            return parsed
    return None


# ---------------------------------------------------------------------------
# Generic agent node — used for ALL Pramaan AI agents
# ---------------------------------------------------------------------------

def agent_node(state: "State", agent: "BaseAgent", name: str) -> dict[str, Any]:
    """Invoke a Pramaan AI agent and merge its state updates."""
    logger.info(f"Processing agent: {name}")
    try:
        result = agent.invoke(state)

        output = get_structured_output(result, agent)

        if output:
            content = safe_get_content(
                output,
                ["task", "feedback", "summary", "current_instruction", "content"],
            )
            ai_message = AIMessage(content=content, name=name)
        else:
            if isinstance(result, dict) and "messages" in result:
                ai_message = result["messages"][-1]
                output = ai_message.content
            else:
                output = str(result)
                ai_message = AIMessage(content=output, name=name)

        current_messages = list(get_state_attr(state, "messages", []))
        updates: dict[str, Any] = {
            "messages": current_messages + [ai_message],
            "last_active_agent": name,
        }

        if hasattr(agent, "get_state_updates"):
            agent_updates = agent.get_state_updates(state, output)
            if agent_updates:
                updates.update(agent_updates)

        current_step = get_state_attr(state, "step_count", 0)
        updates["step_count"] = current_step + 1
        # A successful invocation clears the failure streak.
        updates["consecutive_errors"] = 0
        updates["last_error"] = None

        return updates

    except Exception as e:
        logger.error(f"Error in {name}: {e}", exc_info=True)
        current_messages = list(get_state_attr(state, "messages", []))
        # Advance step_count and the failure streak here too. Without this the
        # router's safety caps never trip, so a persistently failing agent (an
        # unreachable or out-of-credit model, say) spins until the graph's
        # recursion limit instead of stopping.
        return {
            "messages": current_messages + [
                AIMessage(content=f"Error in {name}: {e}", name=name)
            ],
            "last_active_agent": name,
            "step_count": get_state_attr(state, "step_count", 0) + 1,
            "consecutive_errors": get_state_attr(state, "consecutive_errors", 0) + 1,
            "last_error": f"{name}: {e}",
        }


# ---------------------------------------------------------------------------
# Optional human plan-review node (optional — can be bypassed)
# ---------------------------------------------------------------------------

def human_plan_review_node(state: "State") -> dict[str, Any]:
    """
    Show the Planner's research plan to the user and let them
    confirm or edit before the Supervisor starts dispatching agents.

    This graph is shared by the interactive CLI (main.py) and the API server
    (src/api.py, run in a background thread with no stdin). input() there
    raises EOFError immediately, failing every run right after Planner — so
    outside a real terminal this auto-continues instead of prompting.
    """
    rq = state.research_question
    if not rq:
        return {"current_instruction": "Continue the research process"}

    if not sys.stdin.isatty():
        logger.info("Non-interactive session — auto-continuing with the plan as-is.")
        return {"current_instruction": "Continue the research process"}

    print("\n" + "=" * 60)
    print("PRAMAAN AI — RESEARCH PLAN REVIEW")
    print("=" * 60)
    print(f"\nResearch Question:\n  {rq.query}")
    print("\nSubquestions:")
    for i, sq in enumerate(rq.subquestions, 1):
        print(f"  {i}. {sq}")
    print("\nInitial Hypotheses:")
    for i, h in enumerate(rq.hypotheses, 1):
        print(f"  {i}. {h}")
    print("\nSearch Queries:")
    for q in rq.search_queries:
        print(f"  - {q}")
    print()

    while True:
        choice = input("Proceed with this research plan? (1 = Yes / 2 = Edit question): ").strip()
        if choice == "1":
            return {"current_instruction": "Continue the research process"}
        elif choice == "2":
            new_q = input("Enter revised research question: ").strip()
            if new_q:
                updated_rq = rq.model_copy(update={"query": new_q})
                return {
                    "research_question": updated_rq,
                    "current_instruction": "Re-plan",
                }