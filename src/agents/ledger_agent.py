"""
Verity — Research Ledger Agent
Maintains the shared research state: structures entries, records agent events,
and tracks token usage and cost. Replaces the old NoteAgent.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.basetool import list_directory
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class LedgerAgent(BaseAgent):
    """
    Research Ledger: After each major research step, consolidates the state —
    deduplicates papers, indexes claims, updates the execution trace with timing
    and cost estimates, and ensures the ledger is consistent before the
    next agent runs.
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="ledger_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        return [list_directory]

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """
        Record an agent event into the execution trace and
        deduplicate papers by URL/DOI.
        """
        from ..core.schemas import AgentEvent, AgentStatus

        content = output if isinstance(output, str) else getattr(output, "content", str(output))

        # Record a ledger update event
        event = AgentEvent(
            agent_name="ledger_agent",
            action="Updated research ledger",
            status=AgentStatus.COMPLETED,
            timestamp=datetime.utcnow().isoformat(),
            papers_found=len(state.papers or []),
            claims_created=len(state.claims or []),
        )

        trace = state.execution_trace
        trace.events.append(event)

        # Deduplicate papers by URL then DOI
        seen_urls: set[str] = set()
        seen_dois: set[str] = set()
        deduped_papers = []
        for p in (state.papers or []):
            key_url = p.url or ""
            key_doi = p.doi or ""
            if key_url and key_url in seen_urls:
                continue
            if key_doi and key_doi in seen_dois:
                continue
            if key_url:
                seen_urls.add(key_url)
            if key_doi:
                seen_dois.add(key_doi)
            deduped_papers.append(p)

        return {
            "execution_trace": trace,
            "papers": deduped_papers,
        }
