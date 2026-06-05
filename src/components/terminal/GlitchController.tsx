import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useStore } from '@/lib/store'

/**
 * sudo rm -rf / → kernel panic → reboot sequence.
 *
 * Timeline
 *  1. Overlay appears (purple flash) and freezes the page from input.
 *  2. All visible text on the page is "scrambled" to glyphs (GSAP-driven).
 *  3. The whole root is given a 3D rotateX collapse + chromatic glitch.
 *  4. A fake kernel panic message streams in.
 *  5. The page auto-reloads (`window.location.reload`) to "reboot".
 *
 * Note on React 19 rules
 *  - `react-hooks/set-state-in-effect` forbids synchronous setState in the
 *    effect body. We move every state transition (phase, log) into callbacks
 *    (`setTimeout` / `setInterval`) so the effect only schedules work.
 */
export function GlitchController() {
  const isGlitching = useStore((s) => s.isGlitching)
  const reset = useStore((s) => s.resetGlitch)
  const [phase, setPhase] = useState<'idle' | 'panic' | 'reboot'>('idle')
  const [log, setLog] = useState<string[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isGlitching) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      window.location.reload()
      return
    }

    // Defer the *entire* glitch sequence out of the effect body.
    const handle = window.setTimeout(runGlitch, 0)

    function runGlitch() {
      setPhase('panic')
      setLog([])

      const GLYPHS = '!<>-_\\/[]{}—=+*^?#________01'

      // 1. Scramble every text node on the page (skip our own overlay)
      const root = document.getElementById('root')
      if (!root) return
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          const t = n.nodeValue?.trim() ?? ''
          if (!t) return NodeFilter.FILTER_REJECT
          if (!n.parentElement) return NodeFilter.FILTER_REJECT
          if (n.parentElement.closest('[data-no-glitch]')) return NodeFilter.FILTER_REJECT
          return NodeFilter.FILTER_ACCEPT
        },
      })
      const textNodes: Text[] = []
      let n: Node | null
      while ((n = walker.nextNode())) textNodes.push(n as Text)

      const originals = textNodes.map((t) => t.nodeValue ?? '')
      const scrambleDuration = 1.4
      const tween = gsap.to(
        { progress: 0 },
        {
          progress: 1,
          duration: scrambleDuration,
          ease: 'power2.in',
          onUpdate: function () {
            const p = this.targets()[0].progress
            textNodes.forEach((node, i) => {
              const original = originals[i]
              const out = original
                .split('')
                .map((ch) => {
                  if (/\s/.test(ch)) return ch
                  if (Math.random() < p * 0.8) {
                    return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
                  }
                  return ch
                })
                .join('')
              node.nodeValue = out
            })
          },
        }
      )

      // 2. 3D perspective collapse on the entire root
      const wrap = document.getElementById('root')
      if (wrap) {
        gsap.to(wrap, {
          rotateX: 18,
          rotateZ: gsap.utils.random(-2, 2),
          scale: 0.94,
          duration: scrambleDuration,
          ease: 'power3.in',
          transformPerspective: 1400,
          transformOrigin: '50% 0%',
          filter: 'hue-rotate(35deg) saturate(1.4) blur(0.6px)',
        })
      }

      // 3. Stream the kernel panic
      const panicLines = [
        'Kernel panic — not syncing: attempted to remove root filesystem',
        'CPU:  0 PID:  1 Comm: portfolio-os Tainted: G    W         2.6.1',
        'Hardware name: LLM Corporation, Virtual Brain, BIOS v∞.∞.∞',
        'Call Trace:',
        '  ? rag_query+0x3c/0x80',
        '  ? llm_inference+0x91/0x1f0',
        '  ? user_chatbot_send+0x4b/0x110',
        '  ? schedule_tail+0x18/0x40',
        '  ? __schedule+0x2a2/0x8d0',
        '---[ end Kernel panic - not syncing ]---',
        '',
        'portfolio-os will reboot in 3s…',
      ]
      let i = 0
      const stream = window.setInterval(() => {
        if (i >= panicLines.length) {
          window.clearInterval(stream)
          setPhase('reboot')
          return
        }
        setLog((prev) => [...prev, panicLines[i++]])
      }, 110)

      // 4. Reboot
      const reloadTimer = window.setTimeout(() => {
        window.location.reload()
      }, 3200)

      // Cleanup if the effect is torn down before reboot (e.g. theme change)
      return () => {
        tween.kill()
        window.clearInterval(stream)
        window.clearTimeout(reloadTimer)
        reset()
      }
    }

    return () => {
      window.clearTimeout(handle)
      reset()
    }
  }, [isGlitching, reset])

  if (!isGlitching) return null

  return (
    <div
      data-no-glitch
      ref={rootRef}
      className="pointer-events-auto fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[rgba(5,5,10,0.92)] backdrop-blur-md"
    >
      {/* Top scanlines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(157,78,221,0.06) 0 1px, transparent 1px 3px)',
          mixBlendMode: 'screen',
        }}
      />

      <div
        ref={logRef}
        className="relative z-10 w-[min(720px,90vw)] font-mono text-[12px] leading-[1.55] text-[#ff6b6b]"
      >
        <div className="mb-3 flex items-center gap-3 text-[var(--color-accent-bright)]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
          <span className="uppercase tracking-[0.18em]">
            portfolio-os :: fault handler
          </span>
        </div>
        {log.map((line, i) => (
          <div
            key={i}
            style={{ animation: `pan-glow 1.4s ${i * 0.05}s ease-out both` }}
          >
            {line || '\u00A0'}
          </div>
        ))}
        {phase === 'reboot' && (
          <div className="mt-4 text-[var(--color-accent-bright)]">
            <span className="animate-pulse">[rebooting</span>
            <span className="animate-pulse"> …]</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pan-glow {
          0%   { opacity: 0; transform: translateX(-6px); text-shadow: 0 0 12px rgba(255,80,80,0.6); }
          30%  { opacity: 1; text-shadow: 0 0 12px rgba(255,80,80,0.6); }
          100% { opacity: 1; transform: translateX(0); text-shadow: none; }
        }
      `}</style>
    </div>
  )
}
