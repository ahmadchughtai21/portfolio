/**
 * The boot sequence shown on first mount.
 * Each line has its own typing speed for natural rhythm.
 */
export type BootLine = {
  text: string
  /** Base ms per character; lower = faster */
  cps?: number
  /** Hold time after the line completes, before the next starts */
  hold?: number
  /** Per-line color (defaults to text-ink-soft) */
  tone?: 'ok' | 'info' | 'dim' | 'accent' | 'banner'
  /** If true, no typing animation — show the whole line instantly */
  instant?: boolean
}

export const BOOT_SEQUENCE: BootLine[] = [
  {
    text: 'portfolio-os v2.6.1 (tty1)',
    tone: 'dim',
    instant: true,
  },
  {
    text: 'booting kernel …',
    tone: 'dim',
    instant: true,
    hold: 120,
  },
  {
    text: '[  OK  ] loaded module: react@18.3.1',
    tone: 'ok',
    cps: 35,
  },
  {
    text: '[  OK  ] loaded module: vite@5.4',
    tone: 'ok',
    cps: 35,
  },
  {
    text: '[  OK  ] loaded module: tailwindcss@3.4',
    tone: 'ok',
    cps: 35,
  },
  {
    text: '[  OK  ] loaded module: django@5.1',
    tone: 'ok',
    cps: 35,
  },
  {
    text: '[  OK  ] loaded module: djangorestframework',
    tone: 'ok',
    cps: 32,
  },
  {
    text: '[  OK  ] loaded module: chromadb (rag store)',
    tone: 'ok',
    cps: 28,
  },
  {
    text: '[  OK  ] initialising neural interface',
    tone: 'info',
    cps: 32,
    hold: 80,
  },
  {
    text: '[  OK  ] mounting profile: ahmad@chughtai',
    tone: 'info',
    cps: 28,
  },
  {
    text: '[  OK  ] resolved DNS  →  github.com · linkedin.com',
    tone: 'info',
    cps: 28,
    hold: 80,
  },
  {
    text: '[  OK  ] ready. type `help` to see commands, or ask me anything.',
    tone: 'accent',
    cps: 26,
    hold: 200,
  },
]
