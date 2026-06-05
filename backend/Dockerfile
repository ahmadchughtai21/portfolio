FROM python:3.12-slim

# ─── System deps ───────────────────────────────────────────────
# build-essential is needed for chromadb / sentence-transformers
# wheels that compile native code. You can drop it once you're
# sure all your deps ship as wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ─── Python deps ───────────────────────────────────────────────
# Copy ONLY the requirements files first so Docker can cache the
# pip install layer across code changes.
COPY requirements.txt requirements-rag.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ─── App ───────────────────────────────────────────────────────
COPY app ./app

# ─── Runtime ───────────────────────────────────────────────────
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
