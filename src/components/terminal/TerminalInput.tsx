import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * Input row at the bottom of the terminal.
 * The visible "label" mimics the prompt; the actual <input> is transparent
 * and overlays it, so the caret and the label align perfectly.
 */
export const TerminalInput = forwardRef<
  HTMLInputElement,
  {
    value: string
    onChange: (v: string) => void
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
    disabled?: boolean
  }
>(function TerminalInput({ value, onChange, onKeyDown, disabled }, ref) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-t border-void-line-strong bg-void-elev/60 px-4 py-2.5 font-mono text-[12.5px] sm:px-5 sm:text-[13px]',
        disabled ? 'opacity-50' : 'opacity-100'
      )}
    >
      <span className="select-none text-accent">ahmad@chughtai</span>
      <span className="text-ink-mute">:</span>
      <span className="text-[var(--color-accent-bright)]">~</span>
      <span className="text-ink-mute">$</span>
      <div className="relative ml-2 flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-ink">
          {value}
        </span>
        <input
          ref={ref}
          value={value}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Terminal input"
          className="w-full bg-transparent text-transparent caret-[var(--color-accent-bright)] outline-none placeholder:text-ink-mute"
          placeholder={disabled ? '' : 'type a command, or ask me anything…'}
        />
      </div>
    </div>
  )
})
