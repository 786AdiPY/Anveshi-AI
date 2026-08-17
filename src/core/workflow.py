"""
Anveshi AI — LangGraph Workflow
Builds the evidence-grounded research state graph.

Flow:
    START
      ↓
    Planner
      ↓  (optional HumanPlanReview)
    Supervisor ─────────────────────────────────────┐
      ├── Literature Researcher                     │
      ├── Evidence Extractor        → Ledger → Verifier
      └── Challenger ───────────────────────────────┤
                                                    │
                                          PASS      │  FAIL (retry)
                                           ↓        └→ Supervisor
                                       Synthesizer
                                           ↓
                                       EvidenceGraph
                                           ↓
                                          END
"""
from __future__ import annotations
from typing import cast
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver

from .state import State
from .node import agent_node, human_plan_review_node
from .router import (
    planner_router,
    supervisor_router,
    sub_agent_router,
    ledger_router,
    verifier_router,
    synthesizer_router,
)
from ..agents.factory import AgentFactory


class WorkflowManager:
    def __init__(self, lm_manager, working_directory: str):
        self.lm_manager = lm_manager
        self.working_directory = working_directory

        self.members = [
            "Planner", "Supervisor", "Literature", "Extractor",
            "Challenger", "Verifier", "Ledger", "Synthesizer", "EvidenceGraph",
        ]

        self.agents = self._create_agents()
        self.graph = self._build_graph()

    # ------------------------------------------------------------------
    def _create_agents(self) -> dict:
        factory = AgentFactory(
            language_model_manager=self.lm_manager,
            team_members=self.members,
            working_directory=self.working_directory,
        )
        return {
            "planner_agent": factory.create_agent("planner_agent"),
            "supervisor_agent": factory.create_agent("supervisor_agent"),
            "literature_agent": factory.create_agent("literature_agent"),
            "extractor_agent": factory.create_agent("extractor_agent"),
            "challenger_agent": factory.create_agent("challenger_agent"),
            "verifier_agent": factory.create_agent("verifier_agent"),
            "ledger_agent": factory.create_agent("ledger_agent"),
            "evidence_graph_agent": factory.create_agent("evidence_graph_agent"),
            "synthesizer_agent": factory.create_agent("synthesizer_agent"),
        }

    # ------------------------------------------------------------------
    def _wrap(self, agent, name: str):
        """Return a LangGraph-compatible node function for the given agent."""
        def node(state, config=None, store=None):
            return agent_node(cast(State, state), agent, name)
        return node

    # ------------------------------------------------------------------
    def _build_graph(self):
        wf = StateGraph(State)

        # ---- Nodes ----
        wf.add_node("Planner", self._wrap(self.agents["planner_agent"], "planner_agent"))
        wf.add_node("HumanPlanReview", human_plan_review_node)
        wf.add_node("Supervisor", self._wrap(self.agents["supervisor_agent"], "supervisor_agent"))
        wf.add_node("Literature", self._wrap(self.agents["literature_agent"], "literature_agent"))
        wf.add_node("Extractor", self._wrap(self.agents["extractor_agent"], "extractor_agent"))
        wf.add_node("Challenger", self._wrap(self.agents["challenger_agent"], "challenger_agent"))
        wf.add_node("Ledger", self._wrap(self.agents["ledger_agent"], "ledger_agent"))
        wf.add_node("Verifier", self._wrap(self.agents["verifier_agent"], "verifier_agent"))
        wf.add_node("Synthesizer", self._wrap(self.agents["synthesizer_agent"], "synthesizer_agent"))
        wf.add_node("EvidenceGraph", self._wrap(self.agents["evidence_graph_agent"], "evidence_graph_agent"))

        # ---- Edges ----

        # START → Planner
        wf.add_edge(START, "Planner")

        # Planner → HumanPlanReview (optional interactive confirmation)
        wf.add_edge("Planner", "HumanPlanReview")

        # HumanPlanReview → Planner (re-plan) or Supervisor
        wf.add_conditional_edges(
            "HumanPlanReview",
            lambda s: "Planner" if getattr(s, "current_instruction", "") == "Re-plan" else "Supervisor",
            {"Planner": "Planner", "Supervisor": "Supervisor"},
        )

        # Supervisor → sub-agents (dynamic)
        wf.add_conditional_edges(
            "Supervisor",
            supervisor_router,
            {
                "Literature": "Literature",
                "Extractor": "Extractor",
                "Challenger": "Challenger",
                "Synthesizer": "Synthesizer",
                "Supervisor": "Supervisor",
            },
        )

        # All sub-agents → Ledger
        for sub in ["Literature", "Extractor", "Challenger"]:
            wf.add_edge(sub, "Ledger")

        # Ledger → Verifier
        wf.add_edge("Ledger", "Verifier")

        # Verifier → Supervisor (retry) or Synthesizer (pass)
        wf.add_conditional_edges(
            "Verifier",
            verifier_router,
            {"Supervisor": "Supervisor", "Synthesizer": "Synthesizer"},
        )

        # Synthesizer → EvidenceGraph
        wf.add_edge("Synthesizer", "EvidenceGraph")

        # EvidenceGraph → END
        wf.add_edge("EvidenceGraph", END)

        # Compile
        memory = MemorySaver()
        return wf.compile(checkpointer=memory)

    # ------------------------------------------------------------------
    def get_graph(self):
        return self.graph
