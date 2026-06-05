"""
Skills endpoint — static read from app/data/skills.json.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter

from app.models.schemas import SkillGroup, SkillsResponse

router = APIRouter(tags=["skills"])

_DATA_FILE = Path(__file__).resolve().parents[3] / "app" / "data" / "skills.json"


@lru_cache
def _load_skills() -> tuple[SkillGroup, ...]:
    with _DATA_FILE.open(encoding="utf-8") as f:
        raw = json.load(f)
    return tuple(SkillGroup(**g) for g in raw)


@router.get("/skills", response_model=SkillsResponse)
def list_skills() -> SkillsResponse:
    return SkillsResponse(groups=list(_load_skills()))
