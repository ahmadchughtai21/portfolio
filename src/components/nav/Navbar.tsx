import { useEffect, useState } from 'react'
import { ThemeToggle } from '../ui/ThemeToggle'
import { cn } from '@/lib/utils'

/**
 * Single-line top nav, fixed, glassy.
 * - Anchors jump to in-page sections.
 * - Becomes more opaque on scroll.
 * - The whole bar is < 80px tall (skill rule).
 * - On mobile (< sm) the link list is hidden — only the wordmark + theme
 *   toggle remain. Keeps the single-line nav rule on desktop without
 *   forcing a hamburger into the brief.
 */
const LINKS = [
  { href: '#home', label: 'home' },
  { href: '#about', label: 'about' },
  { href: '#projects', label: 'work' },
  { href: '#skills', label: 'skills' },
  { href: '#contact', label: 'contact' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-void-line-strong bg-void/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <a
          href="#home"
          data-cursor="hover"
          aria-label="Home"
          className="group flex items-center gap-2 font-mono text-sm text-ink"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md border border-void-line-strong bg-void-elev/60 text-[12px] font-bold text-[var(--color-accent-bright)] transition-all duration-500 group-hover:border-[var(--color-accent)] group-hover:shadow-[0_0_18px_-4px_var(--color-accent-glow)]"
          >
            ac
          </span>
          <span className="hidden font-medium sm:inline">ahmad</span>
          <span className="hidden text-ink-mute sm:inline">·</span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-ink-mute sm:inline">
            full-stack / ai
          </span>
        </a>

        <ul className="hidden items-center gap-5 md:gap-6 sm:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                data-cursor="hover"
                className="group relative font-mono text-[12px] uppercase tracking-[0.18em] text-ink-soft transition-colors duration-300 hover:text-ink"
              >
                {l.label}
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--color-accent)] transition-all duration-500 group-hover:w-full"
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
