"""
Projects endpoint.

For now this is a static read from app/data/projects.json so the
shape is locked in. When the DB layer lands, swap the loader for
a query without touching the response model.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter

from app.models.schemas import Project, ProjectsResponse

router = APIRouter(tags=["projects"])

_DATA_FILE = Path(__file__).resolve().parents[3] / "app" / "data" / "projects.json"


@lru_cache
def _load_projects() -> tuple[Project, ...]:
    with _DATA_FILE.open(encoding="utf-8") as f:
        raw = json.load(f)
    return tuple(Project(**p) for p in raw)


@router.get("/projects", response_model=ProjectsResponse)
def list_projects() -> ProjectsResponse:
    return ProjectsResponse(projects=list(_load_projects()))
