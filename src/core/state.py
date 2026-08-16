from __future__ import annotations
from typing import Annotated, Any
from pydantic import BaseModel, ConfigDict, Field
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph.message import add_messages

from .schemas import (
    ResearchQuestion,
    Paper,
    Claim,
    Evidence,
    Contradiction,
    VerificationResult,
    AgentEvent,
    ExecutionTrace,
)


class State(BaseModel):
    """
    Canonical shared state for the Verity multi-agent research workflow.
    Stores both the LangGraph message log and all structured research artifacts.
    """

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        validate_assignment=True,
        extra="ignore"
    )

    # === Context Layer ===
    messages: Annotated[list[BaseMessage], add_messages] = Field(
        default_factory=list,
        description="Sequence of messages exchanged in the workflow"
    )
    last_active_agent: str | None = Field(
        default=None,
        description="The last agent that performed an action"
    )
    step_count: int = Field(
        default=0,
        description="Safety counter to prevent infinite loops"
    )

    # === Workflow Control ===
    current_instruction: str | None = Field(
        default=None,
        description="Specific task assigned to the next agent"
    )
    next_workflow_step: str | None = Field(
        default=None,
        description="The next node/agent to route to"
    )

    # === Verification Loop Control ===
    verification_loop_count: int = Field(
        default=0,
        description="How many verification retry cycles have occurred"
    )
    max_verification_loops: int = Field(
        default=3,
        description="Maximum allowed verification retry cycles"
    )
    needs_more_research: bool = Field(
        default=False,
        description="Set by Verifier when claims fail — triggers Supervisor to continue research"
    )

    # === Research Question ===
    research_question: ResearchQuestion | None = Field(
        default=None,
        description="The structured research question with subquestions and search queries"
    )

    # === Research Ledger ===
    papers: list[Paper] = Field(
        default_factory=list,
        description="All papers/sources discovered"
    )
    claims: list[Claim] = Field(
        default_factory=list,
        description="All claims extracted from literature"
    )
    evidence: list[Evidence] = Field(
        default_factory=list,
        description="All evidence excerpts extracted"
    )
    contradictions: list[Contradiction] = Field(
        default_factory=list,
        description="All contradictions found by the Challenger"
    )
    verification_results: list[VerificationResult] = Field(
        default_factory=list,
        description="Verification results for all claims"
    )

    # === Execution Trace ===
    execution_trace: ExecutionTrace = Field(
        default_factory=ExecutionTrace,
        description="Full audit trail of agent actions, tokens, costs"
    )

    # === Final Output ===
    research_brief: str | None = Field(
        default=None,
        description="The final synthesized research brief (markdown)"
    )
    evidence_graph_data: dict[str, Any] = Field(
        default_factory=dict,
        description="JSON-serializable graph data for the Evidence Graph UI"
    )


def create_initial_state(user_input: str) -> dict[str, Any]:
    """
    Factory function to create the initial state dictionary for LangGraph.
    """
    return {
        "messages": [HumanMessage(content=user_input)],
        "last_active_agent": "user",
        "step_count": 0,
        "verification_loop_count": 0,
        "max_verification_loops": 3,
        "needs_more_research": False,
        "research_question": None,
        "papers": [],
        "claims": [],
        "evidence": [],
        "contradictions": [],
        "verification_results": [],
        "execution_trace": ExecutionTrace(),
        "research_brief": None,
        "evidence_graph_data": {},
    }
