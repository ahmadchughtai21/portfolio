"""
Keyword-overlap retrieval, shared by the mock and Gemini services.

Pure function — no LLM calls. Given a query, score every knowledge
entry and return the top-K matches above a relevance threshold.

This is the "R" in RAG until a vector store is wired in. The
interface is intentionally identical to what a future ChromaDB
retriever will expose, so swapping it is a one-line change.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.services.knowledge import KnowledgeEntry, load_knowledge

_TOKEN_RE = re.compile(r"\w+")


@dataclass(frozen=True)
class RetrievalHit:
    entry: KnowledgeEntry
    score: float  # in [0, 1]


def _score_query(query: str, entry: KnowledgeEntry) -> float:
    q = query.lower()
    tokens = _TOKEN_RE.findall(q)
    if not tokens:
        return 0.0

    raw = 0.0
    for kw in entry["keywords"]:
        kw_l = kw.lower()
        kw_words = kw_l.split()
        if len(kw_words) > 1:
            if kw_l in q:
                raw += 3.0 if len(kw_l) > 4 else 2.0
        else:
            if kw_l in q:
                raw += 3.0 if len(kw_l) > 4 else 2.0
            if kw_l in tokens:
                raw += 1.0
    if raw == 0.0:
        return 0.0
    return min(raw / 10.0, 1.0)


def retrieve(query: str, top_k: int = 3, min_score: float = 0.15) -> list[RetrievalHit]:
    """Return the top-K knowledge entries that match `query`."""
    kb = load_knowledge()
    scored = [
        RetrievalHit(entry=entry, score=_score_query(query, entry))
        for entry in kb
    ]
    scored = [h for h in scored if h.score >= min_score]
    scored.sort(key=lambda h: h.score, reverse=True)
    return scored[:top_k]


def format_context(hits: list[RetrievalHit]) -> str:
    """Render retrieved hits as a context block for the LLM prompt."""
    if not hits:
        return "(no relevant context found)"
    return "\n\n".join(
        f"[{h.entry['id']}] (relevance={h.score:.2f}): {h.entry['answer']}"
        for h in hits
    )
