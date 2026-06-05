"""
Chat endpoints — the surface the frontend terminal calls.

  POST /api/chat         → { answer, sources, confidence, provider }   (full)
  POST /api/chat/stream  → SSE stream of chunks for the "typing" UI
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import rag_service_dep
from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag.base import RAGService
from app.services.rag.gemini import _humanize_error

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    rag: RAGService = Depends(rag_service_dep),
) -> ChatResponse:
    try:
        return await rag.query(body.message, body.history)
    except Exception as exc:  # noqa: BLE001
        # SDK exceptions (rate limits, model errors, timeouts) — surface
        # a humanized message with 502 so the frontend can show it
        # without dumping a stacktrace to the visitor.
        logger.exception("chat query failed")
        raise HTTPException(
            status_code=502,
            detail=_humanize_error(exc),
        ) from exc


@router.post("/chat/stream")
async def chat_stream(
    body: ChatRequest,
    rag: RAGService = Depends(rag_service_dep),
) -> StreamingResponse:
    """
    Server-Sent Events stream of the model's response.

    Wire format (one event per `data:` line, lines separated by `\n\n`):

        data: {"type":"sources","sources":[{...}],"confidence":0.83}\\n\\n
        data: {"type":"chunk","text":"Hello"}\\n\\n
        data: {"type":"chunk","text":" world"}\\n\\n
        data: {"type":"done"}\\n\\n

    On error, an `error` event is emitted and the stream ends with `done`.
    """

    async def event_generator():
        try:
            async for event in rag.query_stream(body.message, body.history):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as exc:  # noqa: BLE001
            logger.exception("chat_stream failed")
            yield f"data: {json.dumps({'type': 'error', 'text': _humanize_error(exc)})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disable nginx buffering, if proxied
        },
    )
