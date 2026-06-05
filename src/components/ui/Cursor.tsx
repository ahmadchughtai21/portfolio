import { useEffect, useRef } from 'react'
import { reducedMotion } from '@/lib/utils'

/**
 * Custom round cursor.
 *  - Inner dot tracks pointer 1:1
 *  - Outer ring lags with easing for a satisfying "weight"
 *  - Scales up over interactive elements via `[data-cursor="hover"]` markers
 *  - Hidden on touch devices (handled in CSS for the rest)
 *  - Hidden entirely under prefers-reduced-motion
 *
 * The component always renders, but starts with `display: none`; the effect
 * turns it on only when the device actually supports a fine pointer. This
 * avoids a setState-in-effect pattern while still being SSR-safe.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const enabledRef = useRef(false)

  // Effect 1 — capability check + body class for "hide system cursor"
  useEffect(() => {
    if (reducedMotion()) return
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)')
    if (!mq.matches) return
    enabledRef.current = true
    if (containerRef.current) containerRef.current.style.display = ''
    document.body.classList.add('has-cursor')
    return () => document.body.classList.remove('has-cursor')
  }, [])

  // Effect 2 — animation loop, only runs once `enabledRef` becomes true.
  // We poll once via rAF to avoid re-subscribing the loop on every render.
  useEffect(() => {
    if (reducedMotion()) return
    let raf = 0
    let cleanup: (() => void) | null = null

    const start = () => {
      if (!enabledRef.current) {
        raf = requestAnimationFrame(start)
        return
      }
      const ring = ringRef.current
      const dot = dotRef.current
      if (!ring || !dot) return

      let mx = window.innerWidth / 2
      let my = window.innerHeight / 2
      let rx = mx
      let ry = my
      let scale = 1

      const onMove = (e: PointerEvent) => {
        mx = e.clientX
        my = e.clientY
      }
      const onOver = (e: Event) => {
        const t = e.target as HTMLElement | null
        if (!t) return
        const isInteractive = !!t.closest(
          'a, button, [data-cursor="hover"], input, textarea, [role="button"]'
        )
        scale = isInteractive ? 2.4 : 1
      }

      const tick = () => {
        rx += (mx - rx) * 0.18
        ry += (my - ry) * 0.18
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerover', onOver, { passive: true })

      cleanup = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerover', onOver)
      }
    }
    start()

    return () => {
      cancelAnimationFrame(raf)
      cleanup?.()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{ display: 'none' }}
    >
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-7 w-7 rounded-full border transition-[background-color,border-color] duration-300"
        style={{
          borderColor: 'var(--color-accent)',
          background: 'transparent',
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full"
        style={{ background: 'var(--color-accent)' }}
      />
    </div>
  )
}
