"""
FastAPI app entry point.

Run locally:
    uvicorn app.main:app --reload --port 8000

Run in Docker:
    docker build -t portfolio-api ./backend
    docker run -p 8000:8000 --env-file ./backend/.env portfolio-api
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import chat, health, projects, skills
from app.core.config import get_settings
from app.services.rag.factory import get_rag_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Build the RAG service on startup, release on shutdown."""
    rag = get_rag_service()
    # Touch it so any startup work (vector store hydration, etc.)
    # happens before the first request, not during it.
    _ = rag
    try:
        yield
    finally:
        await rag.aclose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
        # OpenAPI tags are ordered for the /docs sidebar.
        openapi_tags=[
            {"name": "health", "description": "Liveness & readiness."},
            {"name": "chat", "description": "RAG-backed chat."},
            {"name": "projects", "description": "Project listings."},
            {"name": "skills", "description": "Skills taxonomy."},
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    api_prefix = "/api"
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(chat.router, prefix=api_prefix)
    app.include_router(projects.router, prefix=api_prefix)
    app.include_router(skills.router, prefix=api_prefix)

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {
            "name": settings.app_name,
            "docs": "/docs",
            "health": f"{api_prefix}/health",
        }

    return app


app = create_app()
