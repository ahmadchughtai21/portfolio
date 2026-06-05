import { Maximize2, Minimize2, Moon, RotateCcw, Sun } from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * Title bar — minimal, no fake traffic lights that aren't interactive.
 * The title shows current state. The right cluster has a clear button,
 * a theme toggle, and a fullscreen toggle (the icon swaps between
 * maximize/minimize based on the parent's `isFullscreen` state).
 */
export function TerminalTitle({
  onClear,
  onToggleTheme,
  onToggleFullscreen,
  isFullscreen,
  booting,
}: {
  onClear: () => void
  onToggleTheme: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  booting: boolean
}) {
  const theme = useStore((s) => s.theme)
  return (
    <div className="flex items-center justify-between border-b border-void-line-strong bg-void-elev/80 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full bg-[#ff5f57] transition-opacity',
            booting ? 'animate-pulse' : 'opacity-90'
          )}
        />
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full bg-[#febc2e] transition-opacity',
            booting ? 'animate-pulse' : 'opacity-90'
          )}
        />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] opacity-90" />
      </div>

      <div className="flex items-center gap-2 text-[11px] font-mono text-ink-soft">
        <span className="hidden sm:inline">ahmad@chughtai</span>
        <span className="hidden text-ink-mute sm:inline">—</span>
        <span className="text-ink-mute">~ / zsh</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClear()
          }}
          aria-label="Clear terminal"
          data-cursor="hover"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-void-line hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleTheme()
          }}
          aria-label="Toggle theme"
          data-cursor="hover"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-void-line hover:text-ink"
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFullscreen()
          }}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={isFullscreen}
          data-cursor="hover"
          className={cn(
            'ml-1 grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-void-line',
            isFullscreen
              ? 'text-[var(--color-accent-bright)]'
              : 'text-ink-soft hover:text-ink'
          )}
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
