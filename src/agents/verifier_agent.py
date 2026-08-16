"""
Verity — Verifier Agent
Rigorously validates every claim against source evidence.
Outputs PASS / FAIL / UNCERTAIN per claim and gates progression to the Synthesizer.
"""
from __future__ import annotations
import json
from typing import Any, List, TYPE_CHECKING

from .base import BaseAgent
from ..tools.internet import scrape_webpages
from ..tools.basetool import list_directory
from ..config import WORKING_DIRECTORY

if TYPE_CHECKING:
    from ..core.language_models import LanguageModelManager
    from ..core.state import State


class VerifierAgent(BaseAgent):
    """
    Verifier: For every claim in the Research Ledger, checks:
    - Does the source exist?
    - Does the source actually support the claim?
    - Is the evidence relevant?
    - Is the citation correct?
    - Is there contradictory evidence?
    - Is the claim overgeneralized?

    Sets needs_more_research=True if any critical claims FAIL.
    Replaces the old QualityReviewAgent.
    """

    def __init__(
        self,
        language_model_manager: "LanguageModelManager",
        team_members: List[str],
        working_directory: str = WORKING_DIRECTORY,
    ) -> None:
        super().__init__(
            agent_name="verifier_agent",
            language_model_manager=language_model_manager,
            team_members=team_members,
            working_directory=working_directory,
        )

    def _get_tools(self) -> List:
        return [scrape_webpages, list_directory]

    def get_state_updates(self, state: "State", output: Any) -> dict[str, Any]:
        """
        Parse VerificationResult objects and update claim statuses.
        Sets needs_more_research if critical claims fail.
        """
        from ..core.schemas import (
            VerificationResult, VerificationStatus, VerificationCheck, Claim
        )

        content = output if isinstance(output, str) else getattr(output, "content", str(output))

        new_results: list[VerificationResult] = []
        updated_claims: list[Claim] = list(state.claims or [])
        has_critical_failure = False

        try:
            start = content.find("{")
            end = content.rfind("}") + 1
            if start >= 0 and end > start:
                data = json.loads(content[start:end])

                for r in data.get("verification_results", []):
                    status_str = r.get("status", "UNCERTAIN").upper()
                    try:
                        status = VerificationStatus(status_str)
                    except ValueError:
                        status = VerificationStatus.UNCERTAIN

                    checks = [
                        VerificationCheck(
                            name=ch.get("name", "check"),
                            passed=bool(ch.get("passed", False)),
                            note=ch.get("note"),
                        )
                        for ch in r.get("checks", [])
                    ]

                    result = VerificationResult(
                        claim_id=r.get("claim_id", ""),
                        status=status,
                        checks=checks,
                        reasons=r.get("reasons", []),
                        missing_evidence=r.get("missing_evidence", []),
                    )
                    new_results.append(result)

                    # Update corresponding claim's verification_status
                    for i, claim in enumerate(updated_claims):
                        if claim.id == result.claim_id:
                            updated_claims[i] = claim.model_copy(
                                update={"verification_status": status}
                            )

                    if status == VerificationStatus.FAIL:
                        has_critical_failure = True
        except Exception:
            pass

        # Increment verification loop count
        loop_count = (state.verification_loop_count or 0) + 1
        max_loops = state.max_verification_loops or 3

        # Only trigger more research if under the loop cap
        trigger_retry = has_critical_failure and loop_count < max_loops

        existing_results = list(state.verification_results or [])
        return {
            "verification_results": existing_results + new_results,
            "claims": updated_claims,
            "needs_more_research": trigger_retry,
            "verification_loop_count": loop_count,
            # Route to synthesizer if no failures or cap reached
            "next_workflow_step": "Supervisor" if trigger_retry else "Synthesizer",
        }
