"""
Verity — Literature Researcher Agent
Discovers scientific papers, preprints, and web sources relevant to the research question.
"""
from __future__ import annotations
import json
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.internet import google_search, scrape_webpages
from ..tools.basetool import list_directory
from ..config import WORKING_DIRECTORY

try:
    from langchain_community.tools import WikipediaQueryRun
    from langchain_community.utilities import WikipediaAPIWrapper
    from langchain_community.agent_toolkits.load_tools import load_tools
    _HAVE_COMMUNITY = True
except ImportError:
    _HAVE_COMMUNITY = False

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class LiteratureAgent(BaseAgent):
    """
    Literature Researcher: Performs academic and web searches, discovers papers,
    and stores structured Paper metadata into the Research Ledger.
    Replaces the old SearchAgent.
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="literature_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        tools: List[Any] = [google_search, scrape_webpages, list_directory]
        if _HAVE_COMMUNITY:
            try:
                api_wrapper = WikipediaAPIWrapper(wiki_client=None)
                tools.append(WikipediaQueryRun(api_wrapper=api_wrapper))
                tools.extend(load_tools(["arxiv"]))
            except Exception:
                pass
        return tools

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """Parse discovered papers from agent output and append to state."""
        from ..core.schemas import Paper

        content = output if isinstance(output, str) else getattr(output, "content", str(output))

        new_papers: list[Paper] = []
        try:
            start = content.find("[")
            end = content.rfind("]") + 1
            if start >= 0 and end > start:
                items = json.loads(content[start:end])
                for item in items:
                    if isinstance(item, dict):
                        new_papers.append(Paper(
                            title=item.get("title", "Unknown"),
                            authors=item.get("authors", []),
                            year=item.get("year"),
                            url=item.get("url"),
                            doi=item.get("doi"),
                            abstract=item.get("abstract"),
                            venue=item.get("venue"),
                            source_type=item.get("source_type", "web"),
                        ))
        except Exception:
            pass

        existing = list(state.papers or [])
        return {"papers": existing + new_papers}
