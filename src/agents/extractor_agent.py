"""
Pramaan AI — Evidence Extractor Agent
Extracts granular claims and structured evidence from retrieved literature.
"""
from __future__ import annotations
import json
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.FileEdit import collect_data
from ..tools.basetool import list_directory
from ..tools.internet import scrape_webpages
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class ExtractorAgent(BaseAgent):
    """
    Evidence Extractor: Reads the discovered papers and extracts structured Claim
    and Evidence objects. Replaces the old CodeAgent.
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="extractor_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        return [scrape_webpages]

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """Parse Claims and Evidence from extraction output."""
        from ..core.schemas import Claim, Evidence

        content = output if isinstance(output, str) else getattr(output, "content", str(output))

        new_claims: list[Claim] = []
        new_evidence: list[Evidence] = []

        # Attempt to parse structured JSON output
        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(content[start:end])
                for c in data.get("claims", []):
                    claim = Claim(
                        statement=c.get("statement", ""),
                        paper_id=c.get("paper_id", "unknown"),
                        subquestion=c.get("subquestion"),
                        confidence_score=float(c.get("confidence_score", 0.5)),
                    )
                    new_claims.append(claim)
                    # Create associated evidence if provided
                    for ev in c.get("evidence", []):
                        evidence = Evidence(
                            paper_id=c.get("paper_id", "unknown"),
                            excerpt=ev.get("excerpt", ""),
                            methodology=ev.get("methodology"),
                            findings=ev.get("findings"),
                            relevance_score=float(ev.get("relevance_score", 1.0)),
                        )
                        new_evidence.append(evidence)
                        claim.supporting_evidence.append(evidence.id)
        except Exception:
            pass

        existing_claims = list(state.claims or [])
        existing_evidence = list(state.evidence or [])
        return {
            "claims": existing_claims + new_claims,
            "evidence": existing_evidence + new_evidence,
        }
