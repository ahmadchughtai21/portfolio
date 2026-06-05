# portfolio-api

FastAPI backend for the portfolio. Ships today with a keyword-based
RAG mock; the real ChromaDB + LLM pipeline slots in via
`RAG_PROVIDER=vector` in `.env` once you install the optional deps.

## Stack

- **FastAPI** + **Pydantic v2** for the HTTP surface
- **Pydantic Settings** for env-driven config
- **uvicorn** for the ASGI server
- Pluggable **RAG service** (mock now, ChromaDB later)

## Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, lifespan, routers
│   ├── core/
│   │   └── config.py        # Settings (loads .env)
│   ├── api/
│   │   ├── deps.py          # FastAPI dependency providers
│   │   └── routes/
│   │       ├── health.py    # GET /api/health
│   │       ├── chat.py      # POST /api/chat
│   │       ├── projects.py  # GET /api/projects
│   │       └── skills.py    # GET /api/skills
│   ├── models/
│   │   └── schemas.py       # Pydantic request/response models
│   ├── services/
│   │   ├── knowledge.py     # Loads app/data/knowledge.json
│   │   └── rag/
│   │       ├── base.py      # Abstract RAGService
│   │       ├── mock.py      # Keyword-overlap matcher
│   │       ├── vector.py    # Stub for ChromaDB implementation
│   │       └── factory.py   # Picks the right service from .env
│   └── data/
│       ├── knowledge.json
│       ├── projects.json
│       └── skills.json
├── requirements.txt         # Core (FastAPI, uvicorn, pydantic)
├── requirements-rag.txt     # Optional (chromadb, openai, gemini)
├── Dockerfile
├── .env.example
└── README.md
```

## Quick start

```bash
cd backend

# 1. Create a venv
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. Install
pip install -r requirements.txt

# 3. Configure
cp .env.example .env        # then edit if needed

# 4. Run
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive Swagger UI.

## Endpoints

| Method | Path             | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| GET    | `/`              | Service banner + useful links            |
| GET    | `/api/health`    | Liveness probe + active RAG provider     |
| POST   | `/api/chat`      | RAG turn: `{ message, history? } → ...` |
| GET    | `/api/projects`  | Project listings (from `data/projects.json`) |
| GET    | `/api/skills`    | Skills taxonomy (from `data/skills.json`)   |
| GET    | `/docs`          | Swagger UI                               |
| GET    | `/redoc`         | ReDoc UI                                 |

## Wiring up the real RAG

1. Install the optional deps:
   ```bash
   pip install -r requirements-rag.txt
   ```
2. Add your API keys to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   # or
   GEMINI_API_KEY=...
   ```
3. Implement the methods in `app/services/rag/vector.py`:
   - On startup, hydrate a Chroma collection from
     `app/data/knowledge.json`.
   - In `query`, embed the message, retrieve top-k chunks, build a
     prompt, and call the LLM. Return the LLM text + the chunk
     ids/scores as `sources`.
4. Flip the switch:
   ```
   RAG_PROVIDER=vector
   ```
5. Restart. `/api/health` will report `provider: "vector"`.

The chat route never changes — it depends on the `RAGService`
interface, not a concrete class.

## CORS

The default `CORS_ORIGINS` allows the Vite dev server
(`http://localhost:5173`). Add your deployed frontend origin to
`.env` when you ship it.
