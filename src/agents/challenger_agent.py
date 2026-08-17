"""
Pramaan AI — Challenger Agent (NEW)
Adversarially searches for contradictory evidence, alternative explanations,
methodological weaknesses, and negative results.
"""
from __future__ import annotations
import json
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.internet import google_search, scrape_webpages
from ..tools.basetool import list_directory
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class ChallengerAgent(BaseAgent):
    """
    Challenger: Receives the current research state and performs targeted searches
    specifically for:
    - Contradictory studies
    - Alternative explanations
    - Methodological weaknesses
    - Negative results
    - Conditions where the current conclusions fail

    This is Pramaan AI's key differentiator for genuine multi-agent collaboration.
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="challenger_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        return [google_search, scrape_webpages, list_directory]

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """Parse Contradiction objects and any additional counter-evidence papers."""
        from ..core.schemas import Contradiction, Paper

        content = output if isinstance(output, str) else getattr(output, "content", str(output))

        new_contradictions: list[Contradiction] = []
        new_papers: list[Paper] = []

        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(content[start:end])

                for p in data.get("papers", []):
                    new_papers.append(Paper(
                        title=p.get("title", "Unknown"),
                        authors=p.get("authors", []),
                        year=p.get("year"),
                        url=p.get("url"),
                        doi=p.get("doi"),
                        abstract=p.get("abstract"),
                        source_type=p.get("source_type", "web"),
                    ))

                for c in data.get("contradictions", []):
                    new_contradictions.append(Contradiction(
                        claim_id=c.get("claim_id", ""),
                        opposing_paper_id=c.get("opposing_paper_id", ""),
                        explanation=c.get("explanation", ""),
                        severity=c.get("severity", "moderate"),
                    ))
        except Exception:
            pass

        existing_papers = list(state.papers or [])
        existing_contradictions = list(state.contradictions or [])
        return {
            "papers": existing_papers + new_papers,
            "contradictions": existing_contradictions + new_contradictions,
        }
