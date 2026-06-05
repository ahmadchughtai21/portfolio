/**
 * Mocked RAG knowledge base.
 * In production this is replaced with a real FastAPI / DRF backend.
 * The matcher is intentionally simple — keyword overlap + scoring —
 * because the goal is to feel responsive in a portfolio context.
 */
export type RagEntry = {
  id: string
  keywords: string[]
  answer: string
}

export const KNOWLEDGE: RagEntry[] = [
  {
    id: 'about',
    keywords: ['about', 'who', 'whoami', 'you', 'your', 'bio', 'summary', 'background'],
    answer:
      "I'm Muhammad Ahmad Chughtai, a Full-Stack Software Engineer based in Lahore, Pakistan. I focus on AI application design, async backends, and state-driven frontends. Currently finishing my BSCS at UMT while building personal projects on the side.",
  },
  {
    id: 'experience',
    keywords: ['experience', 'years', 'work', 'history', 'senior', 'junior', 'years'],
    answer:
      "I've been building production software for ~3 years. Most of it is Django + React with a heavy AI bent: multimodal pipelines, RAG systems, and the async plumbing that keeps fast UIs snappy when the AI work is slow.",
  },
  {
    id: 'python',
    keywords: ['python', 'django', 'drf', 'rest', 'flask', 'fastapi'],
    answer:
      "Python is my default backend weapon. Most of my recent work uses Django 5 with DRF, JWT auth, Celery for background work, and Pydantic-shaped validation. I care about request budgets — the AI calls happen off the request path so the user-facing endpoint stays under 500ms.",
  },
  {
    id: 'javascript',
    keywords: ['javascript', 'js', 'ts', 'typescript', 'react', 'vite', 'frontend'],
    answer:
      "React 18 + Vite for production frontends, Tailwind + CSS variables for styling. I lean on async/await throughout, use React Query or SWR for server state, and keep components small enough that prop-drilling never gets out of hand.",
  },
  {
    id: 'ai',
    keywords: ['ai', 'llm', 'rag', 'gemini', 'openai', 'groq', 'chroma', 'embedding', 'vector', 'agent', 'pipeline'],
    answer:
      "I build RAG systems, async LLM pipelines, and tool-using agents. My current stack: Groq + Gemini + OpenAI in a fallback rotation, ChromaDB for vector storage, Gemini embeddings, and WeasyPrint for PDF generation. I handle rate limits and context formatting deliberately — the goal is outputs that don't make things up.",
  },
  {
    id: 'database',
    keywords: ['database', 'sql', 'postgres', 'postgresql', 'sqlite', 'redis', 'schema', 'orm'],
    answer:
      "PostgreSQL for production, SQLite for local dev. I model relationships deliberately — TackTack alone has tables for daily-to-yearly recurrence, hierarchical subtasks, and per-user isolation. ORM is Django's, and I reach for raw SQL when the query plan matters.",
  },
  {
    id: 'devops',
    keywords: ['docker', 'compose', 'aws', 'gcp', 'cloud', 'railway', 'vercel', 'deploy', 'ci', 'linux'],
    answer:
      "Docker + Docker Compose for local parity, Railway + Vercel for hosting small services, Linux (Arch + Ubuntu) for day-to-day. I keep the multi-container topology honest — Django, frontend, ChromaDB, and a worker all run as separate services in compose.",
  },
  {
    id: 'projects',
    keywords: ['project', 'projects', 'built', 'shipped', 'apps', 'whiteboard', 'tacktack'],
    answer:
      "Two personal projects: whiteboard (multimodal AI study app with RAG chat) and tacktack (AI task manager with natural-language scheduling). Both are deployed. Type `projects` for a quick rundown or scroll to the Projects section below.",
  },
  {
    id: 'contact',
    keywords: ['contact', 'email', 'reach', 'hire', 'available', 'freelance', 'work'],
    answer:
      "Best way to reach me: ahmadchughtai21@gmail.com. I'm open to full-time roles, internships, and selective contract work. Remote-friendly, async by default, UTC+5.",
  },
  {
    id: 'location',
    keywords: ['location', 'where', 'based', 'remote', 'timezone', 'pakistan', 'lahore'],
    answer:
      "Lahore, Pakistan · UTC+5. Comfortable working remote-first with US and EU time zones; happy to overlap a few hours daily.",
  },
  {
    id: 'education',
    keywords: ['education', 'university', 'degree', 'student', 'study', 'umt', 'fcc'],
    answer:
      "BSCS at the University of Management and Technology, Lahore (2023 – present). FSc Pre-Engineering at Forman Christian College (2021 – 2023). Coursework spans Deep Learning, OS, Algorithms, Data Structures, and Databases.",
  },
]

/**
 * Find the best matching knowledge entry for a user query.
 * Returns null when nothing scores above the threshold — the caller
 * should then fall back to a polite "I don't know" reply.
 */
export function ragSearch(query: string): RagEntry | null {
  const q = query.toLowerCase()
  const tokens = q.split(/\W+/).filter(Boolean)
  if (tokens.length === 0) return null

  let best: { entry: RagEntry; score: number } | null = null
  for (const entry of KNOWLEDGE) {
    let score = 0
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.length > 4 ? 3 : 2
      for (const t of tokens) {
        if (kw.includes(t) || t.includes(kw)) score += 1
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }
  if (!best || best.score < 2) return null
  return best.entry
}
