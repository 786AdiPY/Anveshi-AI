"""
Anveshi AI — Evidence Graph Agent
Generates structured graph data mapping Claims → Evidence → Papers → Contradictions.
Replaces the old VisualizationAgent.
"""
from __future__ import annotations
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.basetool import list_directory
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class EvidenceGraphAgent(BaseAgent):
    """
    Evidence Graph: Builds a JSON-serializable graph of the entire research
    provenance chain suitable for rendering in the UI.

    Graph structure:
        nodes: [{ id, type, label, data }]
        edges: [{ id, source, target, type }]

    Node types: question | hypothesis | claim | evidence | paper | contradiction
    Edge types: decomposes | supports | contradicts | sourced_from
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="evidence_graph_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        return [list_directory]

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """Build the evidence graph from current state and store it."""

        nodes: list[dict] = []
        edges: list[dict] = []

        rq = state.research_question
        papers_by_id = {p.id: p for p in (state.papers or [])}
        evidence_by_id = {e.id: e for e in (state.evidence or [])}
        verification_by_claim = {
            r.claim_id: r for r in (state.verification_results or [])
        }

        # Research question node
        if rq:
            nodes.append({
                "id": rq.id,
                "type": "question",
                "label": rq.query[:80],
                "data": {"query": rq.query, "subquestions": rq.subquestions},
            })

            # Subquestion nodes
            for i, sq in enumerate(rq.subquestions or []):
                sq_id = f"sq-{rq.id}-{i}"
                nodes.append({"id": sq_id, "type": "hypothesis", "label": sq[:60], "data": {}})
                edges.append({"id": f"e-{rq.id}-{sq_id}", "source": rq.id, "target": sq_id, "type": "decomposes"})

        # Claim nodes
        for claim in (state.claims or []):
            vr = verification_by_claim.get(claim.id)
            ver_status = vr.status.value if vr else "PENDING"
            nodes.append({
                "id": claim.id,
                "type": "claim",
                "label": claim.statement[:70],
                "data": {
                    "statement": claim.statement,
                    "confidence": claim.confidence_score,
                    "verification_status": ver_status,
                },
            })

            # Claim → Paper edge
            if claim.paper_id and claim.paper_id in papers_by_id:
                edges.append({
                    "id": f"e-{claim.id}-{claim.paper_id}",
                    "source": claim.id,
                    "target": claim.paper_id,
                    "type": "sourced_from",
                })

            # Evidence nodes
            for ev_id in (claim.supporting_evidence or []):
                ev = evidence_by_id.get(ev_id)
                if ev:
                    nodes.append({
                        "id": ev.id,
                        "type": "evidence",
                        "label": ev.excerpt[:60],
                        "data": {"excerpt": ev.excerpt, "methodology": ev.methodology},
                    })
                    edges.append({
                        "id": f"e-{claim.id}-{ev.id}",
                        "source": ev.id,
                        "target": claim.id,
                        "type": "supports",
                    })

        # Paper nodes
        for paper in (state.papers or []):
            nodes.append({
                "id": paper.id,
                "type": "paper",
                "label": paper.title[:60],
                "data": {
                    "title": paper.title,
                    "authors": paper.authors,
                    "year": paper.year,
                    "url": paper.url,
                    "doi": paper.doi,
                },
            })

        # Contradiction nodes
        for contra in (state.contradictions or []):
            nodes.append({
                "id": contra.id,
                "type": "contradiction",
                "label": contra.explanation[:60],
                "data": {
                    "explanation": contra.explanation,
                    "severity": contra.severity,
                },
            })
            # Contradiction → target claim
            edges.append({
                "id": f"e-contra-{contra.id}-{contra.claim_id}",
                "source": contra.opposing_paper_id,
                "target": contra.claim_id,
                "type": "contradicts",
            })

        graph_data = {"nodes": nodes, "edges": edges}

        return {"evidence_graph_data": graph_data}
