"""
Mock RAG service — keyword-overlap matcher, no LLM.

Mirrors the frontend's `ragSearch` so the terminal keeps working
even when the backend / API key is unavailable. Also useful as a
deterministic fallback in tests.
"""
from __future__ import annotations

from typing import AsyncIterator

from app.models.schemas import ChatResponse, ChatTurn, Source
from app.services.rag.base import RAGService, StreamEvent
from app.services.rag.retrieval import retrieve

_FALLBACK = (
    "I don't have a strong answer for that. Try asking about my "
    "experience, projects, tech stack, or how to contact me."
)


class MockRAGService(RAGService):
    """In-process keyword matcher. Zero external dependencies."""

    async def query(
        self,
        message: str,
        history: list[ChatTurn] | None = None,  # noqa: ARG002
    ) -> ChatResponse:
        hits = retrieve(message, top_k=1)
        if not hits:
            return ChatResponse(
                answer=_FALLBACK,
                sources=[],
                confidence=0.0,
                provider="mock",
            )
        hit = hits[0]
        return ChatResponse(
            answer=hit.entry["answer"],
            sources=[Source(id=hit.entry["id"], score=round(hit.score, 3))],
            confidence=round(hit.score, 3),
            provider="mock",
        )

    async def query_stream(
        self,
        message: str,
        history: list[ChatTurn] | None = None,  # noqa: ARG002
    ) -> AsyncIterator[StreamEvent]:
        # Mock "streams" by emitting the full answer in word-sized
        # chunks with a small delay so the terminal's typing effect
        # still has something to animate.
        import asyncio

        response = await self.query(message, history)
        words = response.answer.split(" ")
        for i, word in enumerate(words):
            chunk = word if i == 0 else " " + word
            yield StreamEvent(type="chunk", text=chunk)
            await asyncio.sleep(0.04)
        if response.sources:
            yield StreamEvent(
                type="sources",
                sources=[s.model_dump() for s in response.sources],
                confidence=response.confidence,
            )
        yield StreamEvent(type="done")

    async def aclose(self) -> None:
        return None
