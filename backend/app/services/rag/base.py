"""
Abstract RAG service.

The chat route depends on this interface, not on a concrete
implementation. Swap the mock for a Gemini-backed service by
changing RAG_PROVIDER in .env — no route code changes.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import AsyncIterator, TypedDict

from app.models.schemas import ChatResponse, ChatTurn


class StreamEvent(TypedDict, total=False):
    """
    A single event yielded by `query_stream`.

    - chunk:   incremental text from the model
    - sources: emitted once, right before "done", carrying the
               knowledge-base ids that informed the answer
    - done:    terminal event for the stream
    - error:   terminal event on failure
    """

    type: str  # "chunk" | "sources" | "done" | "error"
    text: str
    sources: list[dict]
    confidence: float


class RAGService(ABC):
    """
    Minimal contract every RAG backend must satisfy.

    `query` returns the full answer at once; `query_stream` yields
    incremental chunks for the "text appearing in real-time" effect
    in the terminal.
    """

    @abstractmethod
    async def query(
        self,
        message: str,
        history: list[ChatTurn] | None = None,
    ) -> ChatResponse:
        """Run a single RAG turn and return the answer + sources."""
        raise NotImplementedError

    @abstractmethod
    def query_stream(
        self,
        message: str,
        history: list[ChatTurn] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        """Yield chunks as the answer is generated."""
        raise NotImplementedError
        yield  # pragma: no cover — makes this an async generator in the type system

    @abstractmethod
    async def aclose(self) -> None:
        """Release any held resources (HTTP sessions, DB connections)."""
        raise NotImplementedError
