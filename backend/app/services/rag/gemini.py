"""
Gemini-backed RAG service with a free-tier fallback chain.

Pipeline per request:
  1. Retrieve top-K knowledge entries (keyword overlap, see retrieval.py).
  2. Build a prompt: system instructions + retrieved context + history + user msg.
  3. Walk the model chain. For each model:
     a. Skip if marked exhausted (cooldown not elapsed).
     b. Try the call. On a 429 (rate limit / daily quota), mark the
        model exhausted and try the next one.
     c. On any other error, re-raise — don't fall back on real bugs.
  4. Yield chunks back to the caller for the "text appearing in real-time"
     effect in the frontend terminal.

The chain is defined in `gemini_model_chain` (Settings). Defaults to
the four free-tier models in quality-then-quota order, giving ~80 RPD
of headroom before everything is exhausted.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import AsyncIterator

from app.core.config import Settings
from app.models.schemas import ChatResponse, ChatTurn, Source
from app.services.rag.base import RAGService, StreamEvent
from app.services.rag.retrieval import format_context, retrieve

logger = logging.getLogger(__name__)

# Persona is intentionally tight: the model must answer AS the portfolio
# about Ahmad, never as an AI talking about itself. The "you" in user
# questions refers to Ahmad, not to the model. Without this, the model
# defaults to "as an AI, I..." answers and ignores the context.
_SYSTEM_PROMPT = """You are the voice of Muhammad Ahmad Chughtai's personal \
portfolio website. When a visitor asks a question, you answer AS the \
portfolio speaking on Ahmad's behalf — never as a generic AI.

Concretely:
- "you" / "your" in any visitor question refers to Ahmad (the human this \
portfolio is about). Answer in first person from his perspective, e.g. \
"Yes, I build…" not "As an AI, I…".
- Answer ONLY what was just asked. Never open with a self-introduction, \
biographical recap, or "here's who I am" paragraph unless the visitor \
explicitly asked "who are you", "tell me about yourself", or similar.
- Use ONLY the facts in the Context block below. If the context doesn't \
cover the question, say so honestly in ONE sentence and suggest a related \
question (e.g. "I don't have that, but I can tell you about my stack or \
projects").
- Keep answers short: 2-4 sentences unless the question clearly needs more.
- Tone: direct, a bit informal, technically precise. No corporate fluff.
- Never invent facts (companies, dates, numbers, project details, people) \
that aren't in the context. If unsure, say "I'd need to check" rather than \
guess.
- If a question is off-topic, politely redirect to what you can help with \
(projects, stack, experience, contact, etc.).
- If the Recent conversation block has a previous exchange, use it to \
understand follow-up questions ("tell me more about that", "what about the \
other one?", etc.). Don't repeat what you already said in the prior turn.
"""


def _build_prompt(
    message: str,
    context: str,
    history: list[ChatTurn] | None,
    history_window: int,
) -> str:
    parts: list[str] = [_SYSTEM_PROMPT, "", "Context:", context, ""]
    if history:
        recent = history[-history_window:]
        if recent:
            parts.append("Recent conversation:")
            for turn in recent:
                role = "Visitor" if turn.role == "user" else "Portfolio"
                parts.append(f"  {role}: {turn.content}")
            parts.append("")
    parts.append(f"Visitor: {message}")
    parts.append("Portfolio:")
    return "\n".join(parts)


# Daily free-tier quota resets roughly every 24h. We use 24h as the
# cooldown so a 429 today means the model is skipped for the rest of
# the day. The chain then picks up at the next model automatically.
_EXHAUSTED_COOLDOWN_SECONDS = 24 * 60 * 60


def _is_rate_limit(exc: BaseException) -> bool:
    """True if the SDK exception is a 429 / ResourceExhausted."""
    name = type(exc).__name__
    if "ResourceExhausted" in name:
        return True
    msg = str(exc)
    return "429" in msg or "quota" in msg.lower() or "exceeded" in msg.lower()


class GeminiRAGService(RAGService):
    """Keyword retrieval + Google Gemini generation, with model fallback."""

    def __init__(self, settings: Settings) -> None:
        if not settings.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is empty. Add it to backend/.env, "
                "or set RAG_PROVIDER=mock to fall back to the keyword matcher."
            )
        # Imported lazily so the base install (mock-only) doesn't need it.
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        self._genai = genai
        self._settings = settings
        self._chain: list[str] = list(settings.gemini_model_chain)
        self._history_window: int = settings.rag_history_turns
        # model_name -> unix-epoch seconds when it can be retried.
        self._exhausted: dict[str, float] = {}
        # The model name we last successfully used (or tried). Surfaced
        # in the health endpoint so visitors can see which model served
        # the previous answer.
        self._active_model: str = self._chain[0]

    # ── Public read-only state (for the health endpoint) ──────
    @property
    def active_model(self) -> str:
        return self._active_model

    @property
    def chain(self) -> list[str]:
        return list(self._chain)

    @property
    def exhausted_count(self) -> int:
        # Drop expired cooldowns so the count is accurate.
        now = time.time()
        self._exhausted = {m: t for m, t in self._exhausted.items() if t > now}
        return len(self._exhausted)

    # ── Fallback bookkeeping ──────────────────────────────────
    def _available_models(self) -> list[str]:
        """Return the chain with exhausted models filtered out."""
        now = time.time()
        # Drop expired cooldowns so previously-exhausted models come
        # back online when the daily quota resets.
        self._exhausted = {m: t for m, t in self._exhausted.items() if t > now}
        return [m for m in self._chain if m not in self._exhausted]

    def _mark_exhausted(self, model: str) -> None:
        until = time.time() + _EXHAUSTED_COOLDOWN_SECONDS
        self._exhausted[model] = until
        logger.warning(
            "Model %s marked exhausted until %s; chain remaining: %s",
            model,
            time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(until)),
            [m for m in self._chain if m not in self._exhausted],
        )

    def _build_model(self, model_name: str):
        return self._genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                "temperature": self._settings.gemini_temperature,
                "max_output_tokens": self._settings.gemini_max_output_tokens,
            },
        )

    # ── Helpers ───────────────────────────────────────────────
    def _hits_for(self, message: str, history: list[ChatTurn] | None):
        # Retrieval uses the current message PLUS the recent user turns
        # from history. Without this, follow-up questions like
        # "what about the other one?" or "tell me more about that" have
        # no specific keywords to match against, so retrieval returns
        # the wrong entry. The assistant turns are excluded — they just
        # add noise to keyword overlap.
        query = message
        if history:
            for turn in history[-self._history_window:]:
                if turn.role == "user":
                    query = f"{turn.content}\n{query}"
        return retrieve(query, top_k=self._settings.rag_top_k)

    def _prompt(self, message: str, history: list[ChatTurn] | None) -> tuple[str, list[Source]]:
        hits = self._hits_for(message, history)
        context = format_context(hits)
        prompt = _build_prompt(message, context, history, self._history_window)
        sources = [
            Source(id=h.entry["id"], score=round(h.score, 3)) for h in hits
        ]
        return prompt, sources

    # ── Public API: non-streaming ─────────────────────────────
    async def query(
        self,
        message: str,
        history: list[ChatTurn] | None = None,
    ) -> ChatResponse:
        prompt, sources = self._prompt(message, history)
        loop = asyncio.get_running_loop()
        last_exc: BaseException | None = None

        for model_name in self._available_models():
            model = self._build_model(model_name)

            def _call(m=model) -> str:
                resp = m.generate_content(prompt)
                return resp.text or ""

            try:
                text = await loop.run_in_executor(None, _call)
            except Exception as exc:  # noqa: BLE001
                if _is_rate_limit(exc):
                    self._mark_exhausted(model_name)
                    last_exc = exc
                    continue
                raise

            self._active_model = model_name
            confidence = max((s.score for s in sources), default=0.0)
            return ChatResponse(
                answer=text.strip(),
                sources=sources,
                confidence=round(confidence, 3),
                provider="gemini",  # type: ignore[arg-type]
            )

        # Every model in the chain returned a 429. Surface a useful
        # message instead of a raw Google payload.
        raise RuntimeError(
            "All Gemini models in the fallback chain are exhausted for the day. "
            "Try again tomorrow, or add a paid-tier key to .env."
        ) from last_exc

    # ── Public API: streaming ─────────────────────────────────
    async def query_stream(
        self,
        message: str,
        history: list[ChatTurn] | None = None,
    ) -> AsyncIterator[StreamEvent]:
        prompt, sources = self._prompt(message, history)
        loop = asyncio.get_running_loop()

        # Emit sources once, up-front, so the UI can show them.
        if sources:
            yield StreamEvent(
                type="sources",
                sources=[s.model_dump() for s in sources],
                confidence=max((s.score for s in sources), default=0.0),
            )

        # Walk the model chain. We only fall back if the current model
        # fails BEFORE any chunk reaches the user; once we've started
        # streaming, mid-stream errors are surfaced as error events so
        # we don't glue two models' outputs together.
        available = self._available_models()
        if not available:
            yield StreamEvent(
                type="error",
                text="All Gemini models in the fallback chain are exhausted for the day.",
            )
            yield StreamEvent(type="done")
            return

        last_exc: BaseException | None = None
        for model_name in available:
            model = self._build_model(model_name)
            queue: asyncio.Queue[str | Exception | None] = asyncio.Queue()
            finish_state: dict[str, str] = {}

            def _produce(m=model, mn=model_name) -> None:
                try:
                    resp = m.generate_content(prompt, stream=True)
                    for chunk in resp:
                        fr = getattr(chunk, "finish_reason", None)
                        fr_name = getattr(fr, "name", str(fr) if fr is not None else None)
                        if fr_name and fr_name not in {"STOP", "FINISH_REASON_UNSPECIFIED", "None"}:
                            finish_state["reason"] = fr_name
                        text = getattr(chunk, "text", None)
                        if text:
                            loop.call_soon_threadsafe(queue.put_nowait, text)
                except Exception as exc:  # noqa: BLE001
                    if _is_rate_limit(exc):
                        self._mark_exhausted(mn)
                    loop.call_soon_threadsafe(queue.put_nowait, exc)
                finally:
                    loop.call_soon_threadsafe(queue.put_nowait, None)

            loop.run_in_executor(None, _produce)

            any_text = False
            fell_back = False
            while True:
                item = await queue.get()
                if item is None:
                    break
                if isinstance(item, Exception):
                    if _is_rate_limit(item) and not any_text:
                        # First model in chain failed before any output —
                        # close out this attempt and try the next model.
                        fell_back = True
                        last_exc = item
                        logger.info("Falling back from %s: %s", model_name, _humanize_error(item))
                        break
                    logger.exception("Gemini streaming failed")
                    yield StreamEvent(type="error", text=_humanize_error(item))
                    return
                any_text = True
                self._active_model = model_name
                yield StreamEvent(type="chunk", text=item)
                await asyncio.sleep(0)

            if fell_back:
                continue

            # Stream ended cleanly. Report truncation if the SDK
            # signaled a non-STOP finish reason or produced nothing.
            reason = finish_state.get("reason")
            if reason in {"MAX_TOKENS", "SAFETY", "RECITATION", "OTHER", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"}:
                yield StreamEvent(
                    type="error",
                    text=(
                        f"Model stopped early ({reason}). "
                        "Try a shorter or more focused question."
                    ),
                )
            elif not any_text:
                yield StreamEvent(
                    type="error",
                    text="No response was generated. Please try again.",
                )

            yield StreamEvent(type="done")
            return

        # All models in the chain failed before producing any output.
        yield StreamEvent(
            type="error",
            text="All Gemini models in the fallback chain are exhausted for the day.",
        )
        yield StreamEvent(type="done")

    # ── Lifecycle ──────────────────────────────────────────────
    async def aclose(self) -> None:
        # google-generativeai doesn't expose an explicit close; nothing to do.
        return None


def _humanize_error(exc: BaseException) -> str:
    """Turn a Gemini SDK exception into a one-line user-facing message.

    The raw `str(exc)` includes Google's verbose quota payloads (links,
    violation lists, retry-after hints) which are useful for developers
    but noise for portfolio visitors.
    """
    raw = str(exc)
    name = type(exc).__name__
    if "ResourceExhausted" in name or "429" in raw:
        return "Rate limit hit — give it ~60 seconds and try again."
    if "PermissionDenied" in name or "403" in raw:
        return "API key isn't authorized for this model."
    if "NotFound" in name or "404" in raw:
        return "Model not available on this key. Try a different model in .env."
    if "DeadlineExceeded" in name or "timeout" in raw.lower():
        return "Model took too long to respond. Try a shorter question."
    first = raw.split("\n", 1)[0].strip()
    return f"Generation failed: {first[:200]}" if first else "Generation failed."
