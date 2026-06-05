import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * GSAP scroll-reveal.
 * Renders children inside a container. When the container enters
 * the viewport, child elements fade + rise into place.
 *
 * Accepts `selector` to target specific child selectors (defaults to `:scope > *`).
 * Honors `prefers-reduced-motion`.
 */
export function Reveal({
  children,
  selector,
  className = '',
  delay = 0,
  stagger = 0.08,
  y = 28,
}: {
  children: React.ReactNode
  selector?: string
  className?: string
  delay?: number
  stagger?: number
  y?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }
    const targets = selector
      ? el.querySelectorAll<HTMLElement>(selector)
      : Array.from(el.children) as HTMLElement[]

    gsap.set(targets, { y, opacity: 0, willChange: 'transform, opacity' })

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(targets, {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'expo.out',
              stagger,
              delay,
            })
            obs.disconnect()
          }
        })
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [selector, delay, stagger, y])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
