"""
Verity — Evidence-Grounded Research Agent
Core data schemas for structured research entities.
"""
from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> str:
    return datetime.utcnow().isoformat()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class VerificationStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    UNCERTAIN = "UNCERTAIN"
    PENDING = "PENDING"


class ResearchDepth(str, Enum):
    QUICK = "quick"
    STANDARD = "standard"
    DEEP = "deep"


class AgentStatus(str, Enum):
    WAITING = "waiting"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ---------------------------------------------------------------------------
# Research Planning
# ---------------------------------------------------------------------------

class ResearchQuestion(BaseModel):
    """The top-level research question and decomposed sub-questions."""
    id: str = Field(default_factory=_uuid)
    query: str = Field(description="The original research question")
    subquestions: list[str] = Field(
        default_factory=list,
        description="Decomposed sub-questions to investigate"
    )
    hypotheses: list[str] = Field(
        default_factory=list,
        description="Initial hypotheses to test"
    )
    search_queries: list[str] = Field(
        default_factory=list,
        description="Generated search queries for literature discovery"
    )
    depth: ResearchDepth = Field(
        default=ResearchDepth.STANDARD,
        description="Research depth level"
    )
    status: str = Field(default="pending")
    created_at: str = Field(default_factory=_now)


# ---------------------------------------------------------------------------
# Literature
# ---------------------------------------------------------------------------

class Paper(BaseModel):
    """A discovered academic paper or source document."""
    id: str = Field(default_factory=_uuid)
    title: str
    authors: list[str] = Field(default_factory=list)
    year: Optional[int] = None
    url: Optional[str] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    venue: Optional[str] = None
    source_type: str = Field(
        default="web",
        description="paper | preprint | web | document"
    )
    retrieved_at: str = Field(default_factory=_now)


# ---------------------------------------------------------------------------
# Claims & Evidence
# ---------------------------------------------------------------------------

class Evidence(BaseModel):
    """A specific piece of evidence extracted from a paper."""
    id: str = Field(default_factory=_uuid)
    paper_id: str = Field(description="ID of the source paper")
    excerpt: str = Field(description="The direct quote or paraphrase from the source")
    methodology: Optional[str] = Field(
        default=None,
        description="Research methodology used (e.g., RCT, meta-analysis, survey)"
    )
    findings: Optional[str] = Field(
        default=None,
        description="Key numerical results or qualitative findings"
    )
    relevance_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="How relevant this evidence is to the claim (0-1)"
    )


class Claim(BaseModel):
    """A specific claim extracted from the research literature."""
    id: str = Field(default_factory=_uuid)
    statement: str = Field(description="The claim being made")
    paper_id: str = Field(description="Primary paper this claim comes from")
    subquestion: Optional[str] = Field(
        default=None,
        description="The sub-question this claim addresses"
    )
    confidence_score: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Confidence level (0-1)"
    )
    supporting_evidence: list[str] = Field(
        default_factory=list,
        description="IDs of supporting Evidence objects"
    )
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.PENDING
    )


class Contradiction(BaseModel):
    """A contradiction found against an existing claim."""
    id: str = Field(default_factory=_uuid)
    claim_id: str = Field(description="ID of the claim being contradicted")
    opposing_paper_id: str = Field(description="ID of the paper with contradicting evidence")
    opposing_evidence_id: Optional[str] = Field(
        default=None,
        description="ID of the specific contradicting Evidence object"
    )
    explanation: str = Field(
        description="Explanation of how and why this contradicts the original claim"
    )
    severity: str = Field(
        default="moderate",
        description="low | moderate | high — how strongly it contradicts the claim"
    )


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

class VerificationCheck(BaseModel):
    """A single check performed during verification."""
    name: str
    passed: bool
    note: Optional[str] = None


class VerificationResult(BaseModel):
    """The outcome of verifying a single claim."""
    id: str = Field(default_factory=_uuid)
    claim_id: str
    status: VerificationStatus = VerificationStatus.PENDING
    checks: list[VerificationCheck] = Field(
        default_factory=list,
        description="Individual verification checks performed"
    )
    reasons: list[str] = Field(
        default_factory=list,
        description="Reasons for the verification outcome"
    )
    missing_evidence: list[str] = Field(
        default_factory=list,
        description="Descriptions of missing or insufficient evidence"
    )
    verified_at: str = Field(default_factory=_now)


# ---------------------------------------------------------------------------
# Execution Tracing
# ---------------------------------------------------------------------------

class AgentEvent(BaseModel):
    """A single event emitted by an agent during execution."""
    id: str = Field(default_factory=_uuid)
    agent_name: str
    action: str = Field(description="What the agent is doing / did")
    status: AgentStatus = AgentStatus.RUNNING
    timestamp: str = Field(default_factory=_now)
    papers_found: int = Field(default=0)
    claims_created: int = Field(default=0)
    tokens_used: int = Field(default=0)
    estimated_cost_usd: float = Field(default=0.0)
    duration_seconds: float = Field(default=0.0)
    error: Optional[str] = None


class ExecutionTrace(BaseModel):
    """Full execution trace for a research run."""
    events: list[AgentEvent] = Field(default_factory=list)
    total_tokens: int = Field(default=0)
    total_cost_usd: float = Field(default=0.0)
    total_duration_seconds: float = Field(default=0.0)
    loop_count: int = Field(default=0)
