"""
Liveness / readiness probe.

Used by uptime monitors and the frontend's "is the API up?" check.

When the RAG provider is "gemini", we also report which model is
active and how many models in the fallback chain are currently
exhausted (429'd within the last 24h).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import rag_service_dep, settings_dep
from app.core.config import Settings
from app.models.schemas import HealthResponse
from app.services.rag.base import RAGService
from app.services.rag.gemini import GeminiRAGService

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health(
    settings: Settings = Depends(settings_dep),
    rag: RAGService = Depends(rag_service_dep),
) -> HealthResponse:
    model = ""
    chain: list[str] = []
    exhausted = 0
    degraded = False

    if settings.rag_provider == "gemini" and isinstance(rag, GeminiRAGService):
        model = rag.active_model
        chain = rag.chain
        exhausted = rag.exhausted_count
        degraded = exhausted >= len(chain) and len(chain) > 0

    return HealthResponse(
        status="degraded" if degraded else "ok",
        provider=settings.rag_provider,
        model=model,
        model_chain=chain,
        exhausted=exhausted,
    )
