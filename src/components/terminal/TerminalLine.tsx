import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Line } from './Terminal'

/**
 * Renders a single terminal line.
 * - `boot` lines use a soft caret at the end while typing.
 * - `cmd` lines echo the user input in prompt + accent color.
 * - `reply` lines support multi-line arrays (left-padded).
 * - `assistant` lines are wrapped in a left-bordered block for chat feel.
 * - `thinking` shows a 3-dot animated loader with a "Fetching context..." label.
 */
export function TerminalLine({ line }: { line: Line }) {
  if (line.kind === 'boot') {
    return (
      <div
        className={cn(
          'whitespace-pre-wrap break-words',
          line.tone === 'ok' && 'text-[var(--color-accent-bright)]',
          line.tone === 'info' && 'text-ink-soft',
          line.tone === 'dim' && 'text-ink-mute',
          line.tone === 'accent' && 'text-ink',
          !line.tone && 'text-ink-soft'
        )}
      >
        {line.text}
        <Caret />
      </div>
    )
  }
  if (line.kind === 'cmd') {
    return (
      <div className="mt-2 whitespace-pre-wrap break-words text-ink">
        <span className="select-none text-accent">ahmad@chughtai</span>
        <span className="text-ink-mute">:</span>
        <span className="text-[var(--color-accent-bright)]">~</span>
        <span className="text-ink-mute">$ </span>
        {line.text}
      </div>
    )
  }
  if (line.kind === 'reply') {
    return (
      <div className="ml-1 mt-1 whitespace-pre-wrap break-words text-ink-soft">
        {line.text.map((t, i) => (
          <div key={i}>{t || '\u00A0'}</div>
        ))}
      </div>
    )
  }
  if (line.kind === 'assistant') {
    return (
      <div className="mt-3 border-l-2 border-[var(--color-accent)]/60 bg-[var(--color-accent-soft)] px-3 py-2 text-ink">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-bright)]" />
          assistant
        </div>
        <div className="whitespace-pre-wrap leading-[1.6]">
          {line.text}
          {line.streaming && <Caret />}
        </div>
        {line.sources && line.sources.length > 0 && (
          <div className="mt-2 text-[10px] font-mono text-ink-mute">
            ctx → {line.sources.join(' · ')}
          </div>
        )}
      </div>
    )
  }
  if (line.kind === 'error') {
    return (
      <div className="ml-1 mt-1 text-[#ff6b6b]">error: {line.text}</div>
    )
  }
  if (line.kind === 'thinking') {
    return <Thinking />
  }
  return null
}

function Caret() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const id = window.setInterval(() => setOn((v) => !v), 480)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span
      aria-hidden
      className={cn(
        'ml-[1px] inline-block h-[1em] w-[7px] -mb-[2px] align-baseline transition-opacity duration-150',
        on ? 'opacity-100' : 'opacity-0',
        'bg-[var(--color-accent-bright)]'
      )}
    />
  )
}

function Thinking() {
  return (
    <div className="ml-1 mt-1 flex items-center gap-2 text-ink-mute">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent-bright)]">
        Fetching context
      </span>
      <span className="flex gap-1">
        <Dot delay={0} />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </span>
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-bright)]"
      style={{
        animation: 'term-dot 1.1s ease-in-out infinite',
        animationDelay: `${delay}s`,
      }}
    />
  )
}
