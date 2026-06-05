"""
FastAPI dependency providers.

These are the seams the routes import from. They wrap:
  - Settings (cached, re-reads .env only on first call)
  - The RAG service (singleton per process, built by the factory)

Routes use `Depends(get_rag_service)` etc. so swapping
implementations is a config change, not a code change.
"""
from __future__ import annotations

from app.core.config import Settings, get_settings
from app.services.rag.base import RAGService
from app.services.rag.factory import get_rag_service


def settings_dep() -> Settings:
    return get_settings()


def rag_service_dep() -> RAGService:
    return get_rag_service()
