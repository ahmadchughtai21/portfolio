import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { streamChat, type ChatTurn } from '@/lib/chatApi'
import { BOOT_SEQUENCE, type BootLine } from './bootSequence'
import { findCommand, isSudoEasterEgg } from './commands'
import { ragSearch } from './knowledge'
import { TerminalTitle } from './TerminalTitle'
import { TerminalLine } from './TerminalLine'
import { TerminalInput } from './TerminalInput'

/* ── Line model ────────────────────────────────────────────── */
export type Line =
  | { id: string; kind: 'boot'; tone: BootLine['tone']; text: string }
  | { id: string; kind: 'cmd'; text: string }
  | { id: string; kind: 'reply'; text: string[]; tone?: 'ok' | 'warn' | 'dim' | 'accent' }
  | { id: string; kind: 'assistant'; text: string; sources?: string[]; streaming?: boolean }
  | { id: string; kind: 'error'; text: string }
  | { id: string; kind: 'thinking' }

/* ── Pre-made prompts ────────────────────────────────────────
   Clickable chips below the input. One-tap gets a visitor a
   useful answer without having to think of a question first. */
const QUICK_PROMPTS = [
  'What do you build?',
  "What's your stack?",
  'Show me your projects',
  'Are you open to work?',
  'How do I contact you?',
]

/* How many of the most recent exchanges the model gets to "see"
   when answering the current question. 3 exchanges = 6 turns
   (3 user + 3 assistant). Bigger than 3 makes follow-ups like
   "what about the other one?" hard to anchor. */
const HISTORY_EXCHANGES = 3

/* ── Component ─────────────────────────────────────────────── */
export function Terminal() {
  const setBooted = useStore((s) => s.setBooted)
  const triggerGlitch = useStore((s) => s.triggerGlitch)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const setTheme = useStore((s) => s.setTheme)

  const [lines, setLines] = useState<Line[]>([])
  const [booting, setBooting] = useState(true)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState<number | null>(null)
  const [thinking, setThinking] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Last few user/assistant turns, sent to the backend so the model
  // can resolve follow-up questions ("what about the other one?",
  // "tell me more about that"). Trimmed to HISTORY_EXCHANGES * 2
  // turns on every successful exchange.
  const [turns, setTurns] = useState<ChatTurn[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const streamLineIdRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Lets the user interrupt the boot sequence by typing or clicking a
  // chip. Set by the boot useEffect on mount; called from runInput.
  const bootCancelRef = useRef<(() => void) | null>(null)

  // Auto-scroll on new content
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [lines, thinking, streaming])

  /* ── Fullscreen: Escape to exit, lock body scroll ────────── */
  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [isFullscreen])

  // Clean up any in-flight stream on unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  /* ── Boot sequence ────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    let t: number | null = null
    let lineIdx = 0
    let charIdx = 0
    let current = ''

    const CPS = (line: BootLine) => line.cps ?? 30
    const tick = () => {
      if (cancelled) return
      if (lineIdx >= BOOT_SEQUENCE.length) {
        setBooting(false)
        setBooted(true)
        return
      }
      const line = BOOT_SEQUENCE[lineIdx]
      if (line.instant) {
        setLines((prev) => [
          ...prev,
          {
            id: `boot-${lineIdx}`,
            kind: 'boot',
            tone: line.tone,
            text: line.text,
          },
        ])
        const hold = line.hold ?? 60
        lineIdx++
        t = window.setTimeout(tick, hold)
        return
      }
      if (charIdx === 0) current = ''
      if (charIdx < line.text.length) {
        current += line.text[charIdx]
        setLines((prev) => {
          const next = [...prev]
          const last = next[next.length - 1]
          if (last && last.kind === 'boot' && last.id === `boot-${lineIdx}`) {
            next[next.length - 1] = { ...last, text: current }
          } else {
            next.push({
              id: `boot-${lineIdx}`,
              kind: 'boot',
              tone: line.tone,
              text: current,
            })
          }
          return next
        })
        charIdx++
        const delay = 1000 / CPS(line) + (Math.random() * 14 - 7)
        t = window.setTimeout(tick, Math.max(6, delay))
      } else {
        charIdx = 0
        lineIdx++
        const hold = line.hold ?? 50
        t = window.setTimeout(tick, hold)
      }
    }

    t = window.setTimeout(tick, 320)

    // Expose a cancel handle so the user can interrupt the boot by
    // typing or clicking a chip. Cleanup also clears the ref.
    bootCancelRef.current = () => {
      cancelled = true
      if (t) window.clearTimeout(t)
    }

    return () => {
      cancelled = true
      if (t) window.clearTimeout(t)
      bootCancelRef.current = null
    }
  }, [setBooted])

  /* ── AI chat (streaming, with local fallback) ────────────── */
  const runAIChat = useCallback(
    (message: string) => {
      setStreaming(true)
      setThinking(true)
      setLines((prev) => [
        ...prev,
        { id: `think-${Date.now()}`, kind: 'thinking' },
      ])

      const lineId = `a-${Date.now()}`
      streamLineIdRef.current = lineId
      let firstChunk = false
      let collectedSources: string[] = []
      let collectedText = ''
      const abort = new AbortController()
      abortRef.current = abort

      // Snapshot the conversation so the model can resolve follow-ups.
      const priorTurns = turns.slice(-HISTORY_EXCHANGES * 2)

      streamChat(
        message,
        {
          onSources: (sources) => {
            collectedSources = sources.map((s) => s.id)
          },
          onChunk: (text) => {
            collectedText += text
            if (!firstChunk) {
              // First byte: drop the "thinking" line, open the assistant line.
              firstChunk = true
              setThinking(false)
              setLines((prev) => [
                ...prev.filter((l) => l.kind !== 'thinking'),
                {
                  id: lineId,
                  kind: 'assistant',
                  text,
                  sources: collectedSources,
                  streaming: true,
                },
              ])
            } else {
              setLines((prev) =>
                prev.map((l) =>
                  l.id === lineId && l.kind === 'assistant'
                    ? { ...l, text: l.text + text }
                    : l,
                ),
              )
            }
          },
          onDone: () => {
            setStreaming(false)
            setThinking(false)
            streamLineIdRef.current = null
            abortRef.current = null
            // Mark the line as no-longer-streaming.
            setLines((prev) =>
              prev.map((l) =>
                l.id === lineId && l.kind === 'assistant'
                  ? { ...l, streaming: false }
                  : l,
              ),
            )
            // Commit this exchange to the rolling history. Only on
            // success — error fallback paths handle their own memory.
            const finalText = collectedText.trim()
            if (finalText) {
              setTurns((prev) => {
                const next: ChatTurn[] = [
                  ...prev,
                  { role: 'user', content: message },
                  { role: 'assistant', content: finalText },
                ]
                return next.slice(-HISTORY_EXCHANGES * 2)
              })
            }
          },
          onError: (errorMsg) => {
            // If we never got a byte, fall back to the local keyword matcher
            // so the terminal always answers. Otherwise append a note.
            if (!firstChunk) {
              const match = ragSearch(message)
              const fallbackText =
                match?.answer ??
                "I don't have a strong answer for that. Try asking about my experience, projects, tech stack, or how to contact me."
              setLines((prev) => [
                ...prev.filter((l) => l.kind !== 'thinking'),
                {
                  id: lineId,
                  kind: 'assistant',
                  text: fallbackText,
                  sources: match?.id ? [match.id] : undefined,
                  streaming: false,
                },
              ])
              // Still commit the user turn + fallback answer to history
              // so follow-ups keep working through the local path.
              setTurns((prev) => {
                const next: ChatTurn[] = [
                  ...prev,
                  { role: 'user', content: message },
                  { role: 'assistant', content: fallbackText },
                ]
                return next.slice(-HISTORY_EXCHANGES * 2)
              })
            } else {
              const interruption = `\n\n[stream interrupted — ${errorMsg}]`
              const finalText = collectedText + interruption
              setLines((prev) =>
                prev.map((l) =>
                  l.id === lineId && l.kind === 'assistant'
                    ? {
                        ...l,
                        text: l.text + interruption,
                        streaming: false,
                      }
                    : l,
                ),
              )
              setTurns((prev) => {
                const next: ChatTurn[] = [
                  ...prev,
                  { role: 'user', content: message },
                  { role: 'assistant', content: finalText },
                ]
                return next.slice(-HISTORY_EXCHANGES * 2)
              })
            }
            setStreaming(false)
            setThinking(false)
            streamLineIdRef.current = null
            abortRef.current = null
          },
        },
        abort.signal,
        priorTurns,
      )
    },
    [turns],
  )

  /* ── Command + chat handler ───────────────────────────────── */
  const runInput = useCallback(
    (raw: string) => {
      // If the boot sequence is still animating, kill it. The lines it
      // already wrote stay on screen; no more will be appended. This
      // keeps the boot as a passive visual flavor instead of a gate.
      if (booting) {
        bootCancelRef.current?.()
        setBooting(false)
        setBooted(true)
      }
      const value = raw.trim()
      setLines((prev) => [
        ...prev,
        { id: `cmd-${Date.now()}`, kind: 'cmd', text: raw },
      ])

      if (!value) return

      if (isSudoEasterEgg(value)) {
        triggerGlitch()
        return
      }

      const found = findCommand(value)
      if (found) {
        const result = found.cmd.run(found.args)
        if (result) {
          if (result.sideEffect === 'clear') {
            setLines([])
            return
          }
          if (result.sideEffect === 'theme-dark') setTheme('dark')
          if (result.sideEffect === 'theme-light') setTheme('light')
          const text = Array.isArray(result.text) ? result.text : [result.text]
          setLines((prev) => [
            ...prev,
            {
              id: `reply-${Date.now()}`,
              kind: 'reply',
              tone: 'dim',
              text,
            },
          ])
        }
        return
      }

      // AI chat (streaming)
      runAIChat(value)
    },
    [runAIChat, booting, setBooted, setTheme, triggerGlitch],
  )

  /* ── Keyboard nav for history ─────────────────────────────── */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // `booting` is intentionally NOT in this guard — the boot is a
      // visual gimmick, the user can interact while it's animating.
      if (thinking || streaming) return
      if (input.trim()) setHistory((h) => [...h, input])
      setHistoryIdx(null)
      runInput(input)
      setInput('')
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const next =
        historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1)
      setHistoryIdx(next)
      setInput(history[next])
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx === null) return
      const next = historyIdx + 1
      if (next >= history.length) {
        setHistoryIdx(null)
        setInput('')
      } else {
        setHistoryIdx(next)
        setInput(history[next])
      }
      return
    }
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      setLines([])
      setTurns([]) // fresh window — forget the conversation
    }
  }

  /* ── Click anywhere in the terminal → focus the input ─────── */
  const onContainerClick = () => {
    if (!streaming) inputRef.current?.focus()
  }

  // `busy` gates the input + pre-made chips. Boot doesn't count — the
  // boot sequence is just decorative, the user can prompt immediately.
  const busy = thinking || streaming

  // Shared inner content (title bar, scroll area, input row, prompts).
  const terminalBody = (
    <>
      {/* Title bar */}
      <TerminalTitle
        onClear={() => {
          setLines([])
          setTurns([])
        }}
        onToggleTheme={toggleTheme}
        onToggleFullscreen={() => setIsFullscreen((f) => !f)}
        isFullscreen={isFullscreen}
        booting={booting}
      />

      {/* Content area */}
      <div
        ref={scrollRef}
        className={cn(
          'relative overflow-y-auto px-4 py-4 font-mono text-[12.5px] leading-[1.6] sm:px-5 sm:text-[13px]',
          isFullscreen
            ? 'min-h-0 flex-1'
            : 'h-[min(56vh,520px)] min-h-[320px]'
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -60px 60px -60px rgba(157,78,221,0.08)',
          }}
        />
        {lines.map((line) => (
          <TerminalLine key={line.id} line={line} />
        ))}
        {!booting && lines.length === 0 && !thinking && !streaming && (
          <div className="text-ink-mute">
            <span className="select-none text-accent">ahmad@chughtai</span>
            <span className="text-ink-mute">:</span>
            <span className="text-[var(--color-accent-bright)]">~</span>
            <span className="text-ink-mute">$ </span>
            <span className="ml-[1px] inline-block h-[1em] w-[7px] -mb-[2px] animate-pulse bg-[var(--color-accent-bright)] align-baseline" />
          </div>
        )}
      </div>

      {/* Input row */}
      <TerminalInput
        ref={inputRef}
        value={input}
        onChange={setInput}
        onKeyDown={onKeyDown}
        disabled={busy}
      />

      {/* Pre-made prompt chips — one-tap questions for visitors
          who don't know what to ask. */}
      <div
        className="flex flex-wrap items-center gap-1.5 border-t border-void-line-strong bg-void-elev/40 px-3 py-2 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
          try
        </span>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => runInput(p)}
            disabled={busy}
            data-cursor="hover"
            className="rounded-full border border-void-line-strong bg-void/40 px-2.5 py-1 font-mono text-[10px] text-ink-soft transition-all duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-bright)] hover:shadow-[0_0_14px_-4px_var(--color-accent-glow)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-void-line-strong disabled:hover:text-ink-soft disabled:hover:shadow-none"
          >
            {p}
          </button>
        ))}
      </div>
    </>
  )

  /* ── Fullscreen: portal to <body> so z-index escapes the Hero's
     `isolate` stacking context. ──────────────────────────── */
  if (isFullscreen) {
    return createPortal(
      <div
        onClick={onContainerClick}
        className="fixed inset-3 z-[150] flex flex-col overflow-hidden rounded-xl border border-void-line-strong bg-void-elev/95 shadow-[0_30px_120px_-30px_rgba(157,78,221,0.35),0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl transition-all duration-300 sm:inset-6"
        data-no-glitch
      >
        {terminalBody}
      </div>,
      document.body,
    )
  }

  return (
    <div
      onClick={onContainerClick}
      className="group/terminal relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-void-line-strong bg-void-elev/70 shadow-[0_30px_120px_-30px_rgba(157,78,221,0.35),0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl"
      data-no-glitch
    >
      {terminalBody}
    </div>
  )
}
