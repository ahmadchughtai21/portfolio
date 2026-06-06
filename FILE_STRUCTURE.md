# Portfolio — File Structure

Last updated: 2026-06-06

The project is a **Vite + React 19 + TypeScript** frontend (single-page portfolio
with a RAG-powered terminal) sitting next to a **FastAPI** backend that streams
Gemini answers.

```
portfolio/
├── README.md                      # Frontend overview
├── .env                           # VITE_API_BASE=http://localhost:8000
├── .env.example
├── .gitignore
├── index.html                     # Entry HTML, Google Fonts preconnect, theme-color
├── package.json
├── package-lock.json
├── tsconfig.json                  # Solution-style tsconfig
├── tsconfig.app.json              # App TS config (paths: { "@/*": ["./src/*"] })
├── tsconfig.node.json             # Node-side TS config (vite.config.ts)
├── vite.config.ts                 # Vite + @tailwindcss/vite plugin
├── eslint.config.js               # Flat ESLint config
├── FILE_STRUCTURE.md              # This file
│
├── public/
│   ├── favicon.svg                # Custom "a/" mark in neon purple
│   └── icons.svg                  # Inline SVG sprite (cursor, etc.)
│
├── src/
│   ├── main.tsx                   # React entry — mounts <App />
│   ├── App.tsx                    # Layered composition: bg → grain → sections → cursor → glitch
│   ├── index.css                  # Tailwind v4 + theme tokens, gradients, keyframes
│   ├── vite-env.d.ts              # Vite client types
│   │
│   ├── assets/
│   │   ├── hero.png               # Decorative hero asset
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── background/
│   │   │   └── ParticleCanvas.tsx     # 220 stars + 55 dust + shooting stars, transparent canvas
│   │   │
│   │   ├── nav/
│   │   │   └── Navbar.tsx             # Fixed glass nav: home, about, work, skills, contact
│   │   │
│   │   ├── sections/
│   │   │   ├── Hero.tsx               # Typing name, role subheading, terminal, prompt chips
│   │   │   ├── About.tsx              # [01] about, "Complete AI-driven..." heading, 4 quick facts
│   │   │   ├── Projects.tsx           # [02] work — stacked-card layout (visual / divider / text)
│   │   │   ├── Skills.tsx             # [03] skills — 5-card grid from TECH_GROUPS
│   │   │   └── Contact.tsx            # [04] contact — email / phone / site, copyright-only footer
│   │   │
│   │   ├── terminal/
│   │   │   ├── Terminal.tsx           # Fullscreen terminal, boot, streaming chat, conversation memory
│   │   │   ├── bootSequence.ts        # Boot output lines (typed by step)
│   │   │   ├── commands.ts            # help / clear / theme / sudo (everything else → RAG)
│   │   │   ├── knowledge.ts           # 11-entry local RAG knowledge base (frontend fallback)
│   │   │   ├── TerminalInput.tsx      # Input box + onSubmit
│   │   │   ├── TerminalLine.tsx       # Single line renderer with caret
│   │   │   ├── TerminalTitle.tsx      # Title bar with fullscreen + clear
│   │   │   └── GlitchController.tsx   # `sudo rm -rf /` easter egg
│   │   │
│   │   └── ui/
│   │       ├── BrandIcons.tsx         # Hand-rolled GithubMark / LinkedinMark SVGs
│   │       ├── Cursor.tsx             # Custom dot+ring cursor (fine pointers only)
│   │       ├── MagneticButton.tsx     # rAF-driven magnetic effect (no setState per move)
│   │       ├── Reveal.tsx             # IntersectionObserver + GSAP `expo.out` stagger
│   │       ├── ThemeProvider.tsx      # Theme context, dark default, system option
│   │       └── ThemeToggle.tsx        # 80×44 px icon-only theme toggle
│   │
│   ├── data/
│   │   ├── projects.ts                # `Project` type + project list (with optional github)
│   │   └── tech.ts                    # `TECH_GROUPS` for the Skills section
│   │
│   └── lib/
│       ├── chatApi.ts                 # `streamChat(message, handlers, signal?, history?)` + types
│       ├── store.ts                   # Zustand global store (theme, hasBooted, mouse, hasCursor)
│       └── utils.ts                   # `cn()` + small helpers
│
└── backend/
    ├── README.md                      # Backend overview
    ├── Dockerfile                     # Python 3.13-slim image, uvicorn entrypoint
    ├── .env                           # RAG_PROVIDER, GEMINI_API_KEY, model chain (gitignored)
    ├── .env.example
    ├── .gitignore
    ├── requirements.txt               # FastAPI core deps
    ├── requirements-rag.txt           # ChromaDB / OpenAI / sentence-transformers (deferred)
    │
    └── app/
        ├── __init__.py
        ├── main.py                    # FastAPI app, lifespan, CORS, router include
        │
        ├── api/
        │   ├── __init__.py
        │   ├── deps.py                # DI providers (rag_service, knowledge)
        │   └── routes/
        │       ├── __init__.py
        │       ├── chat.py            # POST /chat (full) + /chat/stream (SSE)
        │       ├── health.py          # GET /health → model, chain, exhausted
        │       ├── projects.py        # GET /projects
        │       └── skills.py          # GET /skills
        │
        ├── core/
        │   ├── __init__.py
        │   └── config.py              # pydantic-settings: cors_origins, GEMINI_MODEL_CHAIN, RAG_HISTORY_TURNS
        │
        ├── data/
        │   ├── knowledge.json         # 13-entry RAG knowledge base (about, experience, stack, …)
        │   ├── projects.json
        │   └── skills.json
        │
        ├── models/
        │   ├── __init__.py
        │   └── schemas.py             # Pydantic models, ChatResponse, HealthResponse
        │
        └── services/
            ├── __init__.py
            ├── knowledge.py           # JSON loader for knowledge.json
            │
            └── rag/
                ├── __init__.py
                ├── base.py            # Abstract `RAGService` + `StreamEvent` TypedDict
                ├── factory.py         # `@lru_cache get_rag_service()`
                ├── gemini.py          # Gemini fallback chain, history-aware, `_humanize_error`
                ├── mock.py            # Keyword-only RAG implementation
                └── retrieval.py       # `_score_query`, history-aware retrieval
```

## What lives where

**Frontend (`src/`)**
- `components/sections/` — the 5 page sections, in the order they appear.
- `components/terminal/` — every piece of the terminal UI. `Terminal.tsx` is the
  container; `GlitchController.tsx` mounts independently at the App root so its
  glitch overlay can cover the whole page.
- `components/ui/` — primitives reused across sections.
- `lib/` — non-React glue: API client, Zustand store, utility helpers.
- `data/` — typed content (project list, skill groups) — no fetching.
- `index.css` — design tokens (colors, gradients, keyframes). All theme values
  live here; no inline color hexes outside.

**Backend (`backend/app/`)**
- `api/routes/` — HTTP surface, one file per resource.
- `core/config.py` — single source of truth for env vars; pydantic-settings
  with custom validators (`cors_origins` parses comma-separated, `gemini_model_chain`
  splits into a list).
- `models/schemas.py` — request/response models. `ChatResponse.provider` is
  `Literal["mock", "vector", "gemini"]`; `HealthResponse` carries
  `model`, `model_chain`, `exhausted`.
- `services/rag/` — pluggable RAG backends behind a single `RAGService`
  interface. `gemini.py` is the only one that hits a network; `mock.py`
  uses pure keyword retrieval for offline dev. The factory picks based on
  `RAG_PROVIDER` env var.

## Excluded from the listing

These directories exist on disk but are not part of the source tree:

| Path                   | Why excluded                              |
| ---------------------- | ----------------------------------------- |
| `node_modules/`        | npm install — regenerate from `package.json` |
| `dist/`                | Vite build output                        |
| `.vite/`               | Vite cache                               |
| `backend/.venv/`       | Python virtualenv                        |
| `backend/**/__pycache__/` | Python bytecode                        |

## Scripts

```bash
# Frontend
npm run dev        # vite dev server on :5173
npm run build      # tsc + vite build → dist/
npm run preview    # serve dist/ locally
npm run lint       # eslint

# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```
