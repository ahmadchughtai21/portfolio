import { useEffect } from 'react'
import { useStore } from '@/lib/store'

/**
 * Single source of truth for the active theme.
 * Writes to <html> as `.light` / `.dark` (defaults to `.dark`)
 * so CSS vars flip globally without re-rendering components.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.style.colorScheme = theme
  }, [theme])

  return <>{children}</>
}
