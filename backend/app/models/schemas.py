"""
Pydantic models for the API.

Kept in one file for now since the surface is small. If/when this
grows, split by domain (chat, projects, skills, ...) into separate
modules.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ─── Chat ──────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    """Inbound message to the RAG pipeline."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="The user's question or message.",
    )
    # Optional conversation history for multi-turn. The mock
    # implementation ignores it; the vector impl will use it for
    # context-aware retrieval.
    history: list["ChatTurn"] = Field(
        default_factory=list,
        description="Previous turns in the conversation (most recent last).",
    )


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class Source(BaseModel):
    """A knowledge-base entry that contributed to the answer."""
    id: str
    score: float = Field(
        ge=0.0,
        le=1.0,
        description="Relevance score in [0, 1].",
    )


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = Field(default_factory=list)
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Overall confidence in the answer (0 = none, 1 = certain).",
    )
    provider: Literal["mock", "gemini", "vector"] = Field(
        description="Which RAG backend produced this response.",
    )


# ─── Projects ──────────────────────────────────────────────────
class Project(BaseModel):
    id: str
    title: str
    blurb: str
    tags: list[str]
    year: str
    href: str | None = None
    github: str | None = None


class ProjectsResponse(BaseModel):
    projects: list[Project]


# ─── Skills ────────────────────────────────────────────────────
class SkillGroup(BaseModel):
    label: str
    items: list[str]


class SkillsResponse(BaseModel):
    groups: list[SkillGroup]


# ─── Health ────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    provider: str
    version: str = "0.1.0"
    # When provider=="gemini", the model that served (or will serve)
    # the next request. Empty for "mock".
    model: str = ""
    # Full fallback chain, in priority order. Useful for the UI to
    # show "currently on model 2 of 4" when quotas are tight.
    model_chain: list[str] = Field(default_factory=list)
    # Number of models in the chain currently marked exhausted. When
    # this equals len(model_chain), all free tiers are done for the day.
    exhausted: int = 0


# Resolve forward refs
ChatRequest.model_rebuild()
