/**
 * Hand-rolled, single-purpose brand marks for GitHub and LinkedIn.
 * Lucide dropped brand icons, and these are too recognisable to fake
 * with a generic glyph. Kept as 1.5-stroke single-path SVGs to match
 * the visual rhythm of the rest of the icon set.
 */
import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function GithubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M9 19c-4.5 1.5-4.5-2-6-2.5" />
      <path d="M15 22v-3.5a3 3 0 0 0-.9-2.5c3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.5 4.7 4.7 0 0 0-.1-3.5s-1.1-.3-3.6 1.3a12 12 0 0 0-6 0C6.5 1.6 5.4 1.9 5.4 1.9A4.7 4.7 0 0 0 5.3 5.4 5 5 0 0 0 4 8.9c0 5 3 6.2 6 6.5a3 3 0 0 0-.9 2.3V22" />
    </svg>
  )
}

export function LinkedinMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}
