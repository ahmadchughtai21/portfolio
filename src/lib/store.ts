import { create } from 'zustand'

export type Theme = 'dark' | 'light'

type Store = {
  /* ── Theme ── */
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void

  /* ── Boot sequence ── */
  hasBooted: boolean
  setBooted: (b: boolean) => void

  /* ── Easter egg — sudo rm -rf / ── */
  isGlitching: boolean
  triggerGlitch: () => void
  resetGlitch: () => void

  /* ── Custom cursor visibility (toggled on fine pointers) ── */
  hasCursor: boolean
  setHasCursor: (b: boolean) => void

  /* ── Last-seen mouse position (consumed by Canvas + magnetic) ── */
  mouse: { x: number; y: number }
  setMouse: (x: number, y: number) => void
}

const initialTheme: Theme =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'

export const useStore = create<Store>((set) => ({
  theme: initialTheme,
  setTheme: (t) => set({ theme: t }),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  hasBooted: false,
  setBooted: (b) => set({ hasBooted: b }),

  isGlitching: false,
  triggerGlitch: () => set({ isGlitching: true }),
  resetGlitch: () => set({ isGlitching: false }),

  hasCursor: false,
  setHasCursor: (b) => set({ hasCursor: b }),

  mouse: { x: 0, y: 0 },
  setMouse: (x, y) => set({ mouse: { x, y } }),
}))
