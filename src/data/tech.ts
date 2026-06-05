export type TechGroup = {
  label: string
  items: string[]
}

/**
 * Skills taxonomy for the "Things I know" section.
 * Grouped by where the tool sits in the stack, not by brand wall.
 * Items are written the way I'd actually say them out loud — including
 * the long names like "Django & Django REST Framework (DRF)" — so the
 * pills read as expertise claims, not buzzwords.
 */
export const TECH_GROUPS: TechGroup[] = [
  {
    label: 'languages',
    items: ['Python', 'TypeScript & JavaScript', 'C / C++', 'SQL', 'MATLAB'],
  },
  {
    label: 'backend frameworks',
    items: [
      'Django & Django REST Framework (DRF)',
      'FastAPI',
    ],
  },
  {
    label: 'frontend & ui',
    items: ['React 18 & Vite', 'Tailwind CSS', 'GSAP (Animation)'],
  },
  {
    label: 'ai, data & analytics',
    items: [
      'Jupyter Notebooks',
      'RAG Architecture & Vector Stores (ChromaDB, pgvector)',
      'LLM Integrations (Gemini, OpenRouter)',
      'PostgreSQL & SQLite',
      'Redis',
    ],
  },
  {
    label: 'devops, infrastructure & tools',
    items: [
      'Docker & Containerization',
      'Linux Environment & Virtual Machines',
      'Git & GitHub',
      'Cloud Deployment (Railway, Vercel)',
    ],
  },
]
