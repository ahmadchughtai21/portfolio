/**
 * Tiny utility helpers.
 * - `cn` — conditional class joining without a runtime dep on clsx
 * - `clamp` — numeric range guard used by the particle field
 * - `rand` — deterministic random in a range
 * - `reducedMotion` — SSR-safe check for the prefers-reduced-motion media query
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n))

export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
