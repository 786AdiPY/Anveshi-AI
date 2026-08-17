from .planner_agent import PlannerAgent
from .supervisor_agent import SupervisorAgent
from .literature_agent import LiteratureAgent
from .extractor_agent import ExtractorAgent
from .challenger_agent import ChallengerAgent
from .verifier_agent import VerifierAgent
from .ledger_agent import LedgerAgent
from .evidence_graph_agent import EvidenceGraphAgent
from .synthesizer_agent import SynthesizerAgent
from ..config import WORKING_DIRECTORY


class AgentFactory:
    """Factory for creating Pramaan AI research agents."""

    def __init__(self, language_model_manager, team_members, working_directory=WORKING_DIRECTORY):
        self.language_model_manager = language_model_manager
        self.team_members = team_members
        self.working_directory = working_directory

    def create_agent(self, agent_name: str):
        """
        Create and return an agent instance by name.

        Valid names:
            planner_agent, supervisor_agent, literature_agent, extractor_agent,
            challenger_agent, verifier_agent, ledger_agent,
            evidence_graph_agent, synthesizer_agent
        """
        agent_mapping = {
            "planner_agent": PlannerAgent,
            "supervisor_agent": SupervisorAgent,
            "literature_agent": LiteratureAgent,
            "extractor_agent": ExtractorAgent,
            "challenger_agent": ChallengerAgent,
            "verifier_agent": VerifierAgent,
            "ledger_agent": LedgerAgent,
            "evidence_graph_agent": EvidenceGraphAgent,
            "synthesizer_agent": SynthesizerAgent,
        }

        agent_class = agent_mapping.get(agent_name)
        if not agent_class:
            raise ValueError(
                f"Unknown agent '{agent_name}'. "
                f"Valid agents: {list(agent_mapping.keys())}"
            )

        return agent_class(
            language_model_manager=self.language_model_manager,
            team_members=self.team_members,
            working_directory=self.working_directory,
        )