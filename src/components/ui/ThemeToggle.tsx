import { Moon, Sun } from 'lucide-react'
import { useStore } from '@/lib/store'

/**
 * Theme toggle.
 *
 * Why no labels
 *  - The earlier version had 9px "dark"/"light" labels that physically
 *    overlapped the 28px thumb. Removing them — the icon position is
 *    enough to read the state.
 *
 * Design
 *  - Wider track (80px) and a 32px thumb that slides between the two
 *    halves. Two faint dots mark the inactive slot for a hint of
 *    affordance.
 */
export function ThemeToggle() {
  const theme = useStore((s) => s.theme)
  const toggle = useStore((s) => s.toggleTheme)
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="group relative flex h-11 w-[80px] items-center rounded-full border border-void-line-strong bg-void-elev/60 backdrop-blur transition-all duration-500 hover:border-[var(--color-accent)] hover:shadow-[0_0_24px_-6px_var(--color-accent-glow)] active:scale-95"
    >
      {/* Two faint dots marking the inactive slot for affordance */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full transition-all duration-500 ${
          isLight ? 'bg-ink-mute/40 scale-75' : 'bg-ink-mute'
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute right-3 h-1.5 w-1.5 rounded-full transition-all duration-500 ${
          isLight ? 'bg-ink-mute' : 'bg-ink-mute/40 scale-75'
        }`}
      />

      {/* The sliding thumb */}
      <span
        className={`absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLight
            ? 'left-[44px] shadow-[0_0_22px_-2px_rgba(74,14,78,0.55)]'
            : 'left-[4px] shadow-[0_0_22px_-2px_rgba(157,78,221,0.6)]'
        }`}
        style={{ background: isLight ? '#4a0e4e' : '#9d4edd' }}
      >
        <Sun
          className={`absolute h-4 w-4 text-white transition-all duration-500 ${
            isLight ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
        <Moon
          className={`absolute h-4 w-4 text-white transition-all duration-500 ${
            isLight ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
      </span>
    </button>
  )
}
