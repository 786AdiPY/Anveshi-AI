"""
Verity — Supervisor Agent
Central coordinator: assigns tasks to sub-agents and handles verification retry loops.
"""
from __future__ import annotations
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.basetool import list_directory
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class SupervisorAgent(BaseAgent):
    """
    Supervisor: Orchestrates the research workflow, decides which agent runs next
    (Literature Researcher, Evidence Extractor, or Challenger), and handles
    verification failure → retry routing. Replaces the old ProcessAgent.
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="supervisor_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        return [list_directory]

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """
        Parse supervisor decision: which sub-agent to call next.
        Valid values: Literature | Extractor | Challenger | Synthesizer | FINISH
        """
        content = output if isinstance(output, str) else getattr(output, "content", str(output))

        mapping = {
            "literature": "Literature",
            "researcher": "Literature",
            "extractor": "Extractor",
            "extract": "Extractor",
            "challenger": "Challenger",
            "challenge": "Challenger",
            "synthesizer": "Synthesizer",
            "synthesize": "Synthesizer",
            "finish": "FINISH",
        }

        content_lower = content.lower()
        next_step = "Literature"  # safe default
        for keyword, target in mapping.items():
            if keyword in content_lower:
                next_step = target
                break

        return {
            "next_workflow_step": next_step,
            "step_count": (state.step_count or 0) + 1,
        }
