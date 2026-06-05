import { useRef, useEffect } from 'react'
import { cn, reducedMotion } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  className?: string
  external?: boolean
  ariaLabel?: string
}

/**
 * Button with a magnetic pull effect.
 *
 * Performance
 *  - We deliberately do NOT keep the position in React state. Pointermove
 *    fires at ~120Hz on modern devices; setState-ing at that rate churns
 *    the React tree. Instead we mutate the DOM transform directly, and
 *    only on pointerleave we briefly set state to trigger a CSS transition
 *    back to (0, 0).
 *  - We use a single rAF loop to apply transforms — smoother than
 *    event-driven updates, no React renders.
 */
export function MagneticButton({
  children,
  href,
  onClick,
  variant = 'primary',
  className = '',
  external,
  ariaLabel,
}: Props) {
  const anchorRef = useRef<HTMLAnchorElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  // Re-used mutable position object so React doesn't track it
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)
  const activeRef = useRef(false)

  useEffect(() => {
    if (reducedMotion()) return
    const el = (anchorRef.current ?? buttonRef.current) as HTMLElement | null
    if (!el) return

    const tick = () => {
      // Easing toward target
      current.current.x += (target.current.x - current.current.x) * 0.22
      current.current.y += (target.current.y - current.current.y) * 0.22
      el.style.transform = `translate3d(${current.current.x.toFixed(2)}px, ${current.current.y.toFixed(2)}px, 0)`
      // Keep animating while there's still meaningful distance to travel
      const dx = target.current.x - current.current.x
      const dy = target.current.y - current.current.y
      if (activeRef.current || Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        el.style.transition = 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)'
        rafRef.current = 0
      }
    }

    const startLoop = () => {
      el.style.transition = 'none'
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      const max = Math.max(r.width, r.height) * 0.7
      if (dist < max) {
        const k = (1 - dist / max) * 0.35
        target.current.x = dx * k
        target.current.y = dy * k
      } else {
        target.current.x = 0
        target.current.y = 0
      }
      activeRef.current = true
      startLoop()
    }

    const onLeave = () => {
      activeRef.current = false
      target.current.x = 0
      target.current.y = 0
      // Force one more frame so it eases back, then transition takes over
      startLoop()
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(rafRef.current)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const base =
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 will-change-transform select-none'
  const primary =
    'text-white bg-[var(--color-accent)] hover:shadow-[0_0_36px_-6px_var(--color-accent-glow)]'
  const ghost =
    'text-ink border border-void-line-strong hover:border-[var(--color-accent)] hover:text-[var(--color-accent-bright)] bg-void-elev/40 backdrop-blur'
  const classNameFinal = cn(base, variant === 'primary' ? primary : ghost, className)

  if (href) {
    return (
      <a
        ref={anchorRef}
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        className={classNameFinal}
        data-cursor="hover"
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        {variant === 'primary' && <Sweep />}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </a>
    )
  }
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={classNameFinal}
      data-cursor="hover"
    >
      {variant === 'primary' && <Sweep />}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}

function Sweep() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
    />
  )
}
