"""
Pramaan AI — Planner Agent
Decomposes the research question into subquestions, hypotheses, and search queries.
"""
from __future__ import annotations
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.internet import google_search, scrape_webpages
from ..tools.basetool import list_directory
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class PlannerAgent(BaseAgent):
    """
    Planner: Decomposes the research question into subquestions, initial hypotheses,
    and a structured search plan. Replaces the old HypothesisAgent.
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="planner_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        return [
            google_search,
            scrape_webpages,
            list_directory,
        ]

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """Extract and store ResearchQuestion from planner output."""
        from ..core.schemas import ResearchQuestion
        import json

        content = output if isinstance(output, str) else getattr(output, "content", str(output))

        # Try to parse JSON plan from the model output
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(content[start:end])
                rq = ResearchQuestion(
                    query=data.get("query", str(state.messages[0].content) if state.messages else ""),
                    subquestions=data.get("subquestions", []),
                    hypotheses=data.get("hypotheses", []),
                    search_queries=data.get("search_queries", []),
                )
                return {"research_question": rq}
        except Exception:
            pass

        # Fallback: create a minimal research question from the original user input
        original_query = str(state.messages[0].content) if state.messages else ""
        rq = ResearchQuestion(
            query=original_query,
            subquestions=[original_query],
            hypotheses=[],
            search_queries=[original_query],
        )
        return {"research_question": rq}
