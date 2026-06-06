export type Project = {
  id: string
  title: string
  blurb: string
  tags: string[]
  year: string
  /** Visual treatment rendered inside the card (bento background diversity) */
  visual: 'graph' | 'grid' | 'pulse' | 'orbit' | 'wave' | 'mono'
  /** Live deployed URL (omit for projects still in progress). */
  href?: string
  /** Source repository URL — shown as a "Source" button on the card. */
  github?: string
}

export const PROJECTS: Project[] = [
  {
    id: 'whiteboard',
    title: 'whiteboard',
    blurb:
      'Multimodal AI study app. Gemini turns lecture audio, photos, and PDFs into unified Markdown notes, with a RAG chat panel that answers from your own uploads. Async Django pipeline keeps the request < 500ms even while the AI works in the background.',
    tags: ['Django', 'DRF', 'Gemini', 'ChromaDB', 'WeasyPrint'],
    year: '2025',
    visual: 'graph',
    href: 'https://whiteboard.ahmadchughtai.me',
    github: 'https://github.com/ahmadchughtai21/whiteboard',
  },
  {
    id: 'tacktack',
    title: 'tacktack',
    blurb:
      'Task manager that turns natural-language strings into structured schedules via Groq. Handles daily-to-yearly recurrence, hierarchical subtasks, and descriptive tags. 4-pane React dashboard with custom smart views and per-user data isolation.',
    tags: ['React 18', 'Vite', 'Groq', 'DRF', 'PostgreSQL'],
    year: '2024',
    visual: 'grid',
    href: 'https://tack.ahmadchughtai.me',
    github: 'https://github.com/ahmadchughtai21/ai_todo',
  },
]
