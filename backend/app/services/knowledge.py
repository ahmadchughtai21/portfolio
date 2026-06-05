"""
Knowledge base loader.

Reads the JSON file in app/data/knowledge.json and exposes a
typed in-memory list. The mock RAG service uses this directly;
the future vector service will ingest the same file into ChromaDB
on startup (see app.services.rag.factory).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import TypedDict


class KnowledgeEntry(TypedDict):
    id: str
    keywords: list[str]
    answer: str


_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "knowledge.json"


@lru_cache
def load_knowledge() -> list[KnowledgeEntry]:
    """Load and cache the knowledge base from disk."""
    with _DATA_FILE.open(encoding="utf-8") as f:
        data = json.load(f)
    # Cast to TypedDict-shaped list for callers; the JSON structure
    # is already a list of dicts with the right keys.
    return [KnowledgeEntry(**entry) for entry in data]  # type: ignore[misc]
