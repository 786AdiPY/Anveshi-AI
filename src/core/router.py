"""
Pramaan AI — LangGraph Router
Routing logic for the evidence-grounded research workflow.
"""
from __future__ import annotations
from typing import Any, Literal
from langchain_core.messages import AIMessage
import logging

from .state import State

logger = logging.getLogger(__name__)

# How many back-to-back agent failures before the run is abandoned. Failures
# that persist this long are configuration or provider problems, not transients.
MAX_CONSECUTIVE_ERRORS = 3


def get_state_attr(state: State | dict[str, Any], key: str, default: Any = None) -> Any:
    if isinstance(state, dict):
        return state.get(key, default)
    return getattr(state, key, default)


# ---------------------------------------------------------------------------
# Planner → (optional plan review) → Supervisor
# ---------------------------------------------------------------------------

def planner_router(state: State) -> Literal["Supervisor"]:
    """After planning, always proceed to Supervisor."""
    logger.info("planner_router → Supervisor")
    return "Supervisor"


# ---------------------------------------------------------------------------
# Supervisor → sub-agents
# ---------------------------------------------------------------------------

SupervisorTarget = Literal["Literature", "Extractor", "Challenger", "Synthesizer", "Supervisor"]


def supervisor_router(state: State) -> SupervisorTarget:
    """
    Supervisor decides which sub-agent to invoke next.
    Reads next_workflow_step from state (set by SupervisorAgent.get_state_updates).
    """
    logger.info("supervisor_router")
    next_step = get_state_attr(state, "next_workflow_step", "Literature")
    step_count = get_state_attr(state, "step_count", 0)
    consecutive_errors = get_state_attr(state, "consecutive_errors", 0)

    # Bail out when the agents keep failing (bad API key, no credits, provider
    # down). Retrying cannot recover from these, so stop rather than spin.
    if consecutive_errors >= MAX_CONSECUTIVE_ERRORS:
        logger.error(
            f"{consecutive_errors} consecutive agent failures — terminating via Synthesizer. "
            f"Last error: {get_state_attr(state, 'last_error', 'unknown')}"
        )
        return "Synthesizer"

    # Safety cap
    if step_count > 30:
        logger.warning("Step count exceeded 30 — routing to Synthesizer to terminate.")
        return "Synthesizer"

    # The Supervisor picks the next step from its own reading of the state, and
    # regularly skips ahead to Extractor on the first pass, when nothing has
    # been gathered yet. Downstream agents then work on an empty ledger and the
    # run finishes with zero sources, so enforce the prerequisites here.
    papers = get_state_attr(state, "papers", []) or []
    claims = get_state_attr(state, "claims", []) or []
    if not papers and next_step not in ("Literature", "FINISH"):
        logger.info(
            f"No sources gathered yet — overriding {next_step!r} with Literature."
        )
        next_step = "Literature"
    elif papers and not claims and next_step in ("Challenger", "Synthesizer"):
        logger.info(
            f"Sources but no claims yet — overriding {next_step!r} with Extractor."
        )
        next_step = "Extractor"

    mapping: dict[str, SupervisorTarget] = {
        "Literature": "Literature",
        "Extractor": "Extractor",
        "Challenger": "Challenger",
        "Synthesizer": "Synthesizer",
        "FINISH": "Synthesizer",
    }

    # An unrecognized step means the Supervisor produced no usable directive.
    # Fall through to Literature to make progress; routing back to Supervisor
    # here would loop forever whenever the Supervisor cannot answer.
    result = mapping.get(next_step)
    if result is None:
        logger.warning(
            f"Unrecognized next_workflow_step {next_step!r} — defaulting to Literature."
        )
        result = "Literature"
    logger.info(f"supervisor_router → {result}")
    return result


# ---------------------------------------------------------------------------
# Sub-agents (Literature / Extractor / Challenger) → Ledger
# ---------------------------------------------------------------------------

def sub_agent_router(state: State) -> Literal["Ledger"]:
    """After any sub-agent completes, always update the ledger."""
    logger.info("sub_agent_router → Ledger")
    return "Ledger"


# ---------------------------------------------------------------------------
# Ledger → Verifier
# ---------------------------------------------------------------------------

def ledger_router(state: State) -> Literal["Verifier"]:
    """After the ledger is updated, run verification."""
    logger.info("ledger_router → Verifier")
    return "Verifier"


# ---------------------------------------------------------------------------
# Verifier → Supervisor (retry) OR Synthesizer (pass)
# ---------------------------------------------------------------------------

VerifierTarget = Literal["Supervisor", "Synthesizer"]


def verifier_router(state: State) -> VerifierTarget:
    """
    Route based on verification outcome.
    - FAIL + under loop cap  → Supervisor (more research)
    - PASS or cap reached    → Synthesizer
    """
    logger.info("verifier_router")
    needs_more = get_state_attr(state, "needs_more_research", False)
    loop_count = get_state_attr(state, "verification_loop_count", 0)
    max_loops = get_state_attr(state, "max_verification_loops", 3)

    # Synthesizing with nothing extracted yields a brief with no citations, so
    # loop back for extraction while there is still budget for another pass.
    papers = get_state_attr(state, "papers", []) or []
    claims = get_state_attr(state, "claims", []) or []
    if papers and not claims and loop_count < max_loops:
        logger.info(
            f"verifier_router → Supervisor (no claims extracted yet, "
            f"pass {loop_count}/{max_loops})"
        )
        return "Supervisor"

    if needs_more and loop_count < max_loops:
        logger.info(f"verifier_router → Supervisor (retry {loop_count}/{max_loops})")
        return "Supervisor"

    logger.info("verifier_router → Synthesizer")
    return "Synthesizer"


# ---------------------------------------------------------------------------
# Synthesizer → Evidence Graph → END
# ---------------------------------------------------------------------------

def synthesizer_router(state: State) -> Literal["EvidenceGraph"]:
    """After synthesis, generate the evidence graph."""
    logger.info("synthesizer_router → EvidenceGraph")
    return "EvidenceGraph"
