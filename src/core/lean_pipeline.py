"""Single-pass research pipeline.

The full multi-agent graph runs nine agents, each one re-sending its whole
transcript on every tool call. On a free provider tier that exhausts the
per-minute token budget long before a brief exists.

This pipeline does the same job with deterministic search plus exactly one
model call: gather the top web results in code, hand them to the model once,
and get back the brief and its claims. Nothing is spent on routing chatter,
supervision, or ledger bookkeeping.
"""

from __future__ import annotations

import json
import re
from typing import Any, Callable

from ..logger import setup_logger
from ..tools.internet import google_search
from .schemas import Claim, Paper, VerificationStatus

logger = setup_logger()

# Enough angles to cover a comparison question without flooding the prompt.
_QUERY_SUFFIXES = ("", " limitations drawbacks", " comparison evidence study")
_MAX_SOURCES = 8
_SNIPPET_CHARS = 240


def _parse_results(raw: str) -> list[dict[str, str]]:
    """Parse the tool's title/snippet/link blocks back into records."""
    if raw.startswith("Error:"):
        return []

    records = []
    for block in raw.strip().split("\n\n"):
        lines = [line for line in block.splitlines() if line.strip()]
        if len(lines) < 3:
            continue
        title, snippet, link = lines[0], " ".join(lines[1:-1]), lines[-1]
        if not link.startswith("http"):
            continue
        records.append(
            {"title": title.strip(), "snippet": snippet.strip()[:_SNIPPET_CHARS], "url": link.strip()}
        )
    return records


def gather_sources(question: str) -> list[Paper]:
    """Search the web and return de-duplicated sources, best first."""
    seen: set[str] = set()
    papers: list[Paper] = []

    for suffix in _QUERY_SUFFIXES:
        raw = google_search.invoke({"query": f"{question}{suffix}"})
        for record in _parse_results(raw):
            if record["url"] in seen:
                continue
            seen.add(record["url"])
            papers.append(
                Paper(
                    title=record["title"],
                    url=record["url"],
                    abstract=record["snippet"],
                    source_type="paper" if "arxiv.org" in record["url"] else "web",
                )
            )
            if len(papers) >= _MAX_SOURCES:
                return papers
    return papers


def _build_prompt(question: str, papers: list[Paper]) -> str:
    sources = "\n".join(
        f"[{i + 1}] {p.title}\n{p.abstract}\n{p.url}" for i, p in enumerate(papers)
    )
    return (
        f"Research question: {question}\n\n"
        f"Sources:\n{sources}\n\n"
        "Write an evidence-grounded brief from these sources only. Cite sources "
        "as [n]. Respond with JSON and nothing else:\n"
        '{"brief": "<markdown brief, 300-500 words, with [n] citations>", '
        '"claims": [{"statement": "<one factual claim>", "source": <n>, '
        '"confidence": <0-1>}]}\n'
        "Include 5-8 claims, each traceable to a listed source."
    )


def _extract_json(text: str) -> dict[str, Any]:
    """Pull the JSON object out of a model reply that may be fenced or prefixed."""
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    candidate = fenced.group(1) if fenced else text[text.find("{") : text.rfind("}") + 1]
    # strict=False: models routinely emit real newlines inside the brief string
    # rather than escaping them, which strict JSON rejects.
    return json.loads(candidate, strict=False)


def synthesize(model: Any, question: str, papers: list[Paper]) -> tuple[str, list[Claim]]:
    """Turn the gathered sources into a brief and its claims in one model call."""
    response = model.invoke(_build_prompt(question, papers))
    content = getattr(response, "content", str(response))

    try:
        payload = _extract_json(content)
    except Exception as e:
        # A brief without machine-readable claims still beats no brief at all.
        logger.warning(f"Could not parse synthesis JSON ({e}); keeping raw text as brief.")
        return content, []

    claims = []
    for item in payload.get("claims", []):
        if not isinstance(item, dict) or not item.get("statement"):
            continue
        index = item.get("source", 1)
        paper = papers[index - 1] if isinstance(index, int) and 1 <= index <= len(papers) else None
        claims.append(
            Claim(
                statement=item["statement"],
                paper_id=paper.id if paper else "",
                confidence_score=min(max(float(item.get("confidence", 0.6)), 0.0), 1.0),
                supporting_evidence=[paper.url] if paper and paper.url else [],
                verification_status=VerificationStatus.PASS if paper else VerificationStatus.UNCERTAIN,
            )
        )

    return payload.get("brief", content), claims


def build_graph_data(papers: list[Paper], claims: list[Claim]) -> dict[str, Any]:
    """Assemble the claim/source graph the UI renders."""
    nodes = [{"id": p.id, "label": p.title, "type": "source", "url": p.url} for p in papers]
    nodes += [{"id": c.id, "label": c.statement, "type": "claim"} for c in claims]
    edges = [
        {"source": c.id, "target": c.paper_id, "relation": "supported_by"}
        for c in claims
        if c.paper_id
    ]
    return {"nodes": nodes, "edges": edges}


def run_lean_research(
    question: str,
    model_factory: Callable[[], Any],
    on_progress: Callable[[str, dict[str, Any]], None] | None = None,
) -> dict[str, Any]:
    """Run search → synthesis and return the finished state.

    Args:
        question: The research question.
        model_factory: Callable returning a configured chat model.
        on_progress: Optional callback(stage, state) invoked after each stage.

    Returns:
        State dict with papers, claims, research_brief and evidence_graph_data.
    """
    logger.info(f"Lean pipeline: gathering sources for {question!r}")
    papers = gather_sources(question)
    logger.info(f"Lean pipeline: {len(papers)} sources gathered")

    if on_progress:
        on_progress("search", {"papers": papers, "claims": [], "research_brief": None})

    if not papers:
        return {
            "papers": [],
            "claims": [],
            "research_brief": None,
            "evidence_graph_data": {},
            "last_error": "Web search returned no usable results.",
        }

    brief, claims = synthesize(model_factory(), question, papers)
    logger.info(f"Lean pipeline: brief written, {len(claims)} claims")

    state = {
        "papers": papers,
        "claims": claims,
        "research_brief": brief,
        "evidence_graph_data": build_graph_data(papers, claims),
        "last_error": None,
    }
    if on_progress:
        on_progress("synthesis", state)
    return state
