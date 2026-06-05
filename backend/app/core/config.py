"""
Application settings, loaded from environment / .env.

Uses pydantic-settings so the same Settings object can be injected
anywhere via FastAPI's dependency system (see app.api.deps).
"""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── App ──────────────────────────────────────────────────
    app_name: str = "portfolio-api"
    debug: bool = False

    # ─── CORS ─────────────────────────────────────────────────
    # `NoDecode` keeps pydantic-settings from JSON-parsing the env
    # value, so a comma-separated string like
    # `CORS_ORIGINS=http://a,http://b` flows straight into our
    # validator and gets split there. A JSON array also works.
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, value: object) -> object:
        if isinstance(value, str):
            return [s.strip() for s in value.split(",") if s.strip()]
        return value

    # ─── RAG provider switch ──────────────────────────────────
    # "mock"   → keyword-based matcher, ships now, zero external deps
    # "gemini" → keyword retrieval + Google Gemini generation
    #            (requires `pip install -r requirements-rag.txt`
    #             and a valid GEMINI_API_KEY)
    rag_provider: Literal["mock", "gemini"] = "mock"

    # ─── Gemini settings (read only when rag_provider="gemini") ─
    gemini_api_key: str = ""
    # Active model. Overridden at runtime by the fallback chain when
    # the current model hits its quota. The chain itself is below.
    gemini_model: str = "gemini-2.5-flash"
    # Fallback chain. Tried in order; on a 429 the current model is
    # marked exhausted for 24h and the next one is used. All four are
    # free-tier (no billing required) but each has its own ~20 RPD
    # quota, so chaining them gives ~80 RPD of headroom.
    gemini_model_chain: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
        ]
    )

    @field_validator("gemini_model_chain", mode="before")
    @classmethod
    def _split_chain(cls, value: object) -> object:
        if isinstance(value, str):
            return [s.strip() for s in value.split(",") if s.strip()]
        return value

    # How many top-scoring knowledge entries to inject as context.
    rag_top_k: int = 3
    # Last N user+assistant exchanges to include in the prompt so the
    # model can answer follow-up questions. 3 exchanges = 6 turns.
    rag_history_turns: int = 6
    # Generation params (kept conservative to stay inside free tier).
    gemini_temperature: float = 0.6
    gemini_max_output_tokens: int = 800

    # ─── Legacy / future (kept for backward compat) ───────────
    openai_api_key: str = ""
    chroma_persist_dir: str = "./chroma"
    embedding_model: str = "text-embedding-3-small"
    llm_model: str = "gpt-4o-mini"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — re-reads .env only on first call."""
    return Settings()
