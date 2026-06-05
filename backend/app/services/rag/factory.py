"""
RAG service factory.

Reads RAG_PROVIDER from settings and returns the matching service
singleton. The Gemini implementation is intentionally NOT imported
at module load — the dependency is optional and the import would
crash if google-generativeai isn't installed.
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import Settings, get_settings
from app.services.rag.base import RAGService
from app.services.rag.mock import MockRAGService


@lru_cache
def get_rag_service() -> RAGService:
    """
    Build (or return the cached) RAG service.

    Set RAG_PROVIDER=gemini in .env to switch to Gemini-backed
    generation (you'll also need `pip install -r requirements-rag.txt`
    and a valid GEMINI_API_KEY).
    """
    settings: Settings = get_settings()
    provider = settings.rag_provider

    if provider == "mock":
        return MockRAGService()

    if provider == "gemini":
        # Lazy import so the base install stays lean. The import will
        # raise a clear ModuleNotFoundError if requirements-rag.txt
        # hasn't been installed.
        from app.services.rag.gemini import GeminiRAGService  # noqa: WPS433

        return GeminiRAGService(settings)

    raise ValueError(f"Unknown RAG_PROVIDER: {provider!r}")
