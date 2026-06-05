import { useEffect, useState } from 'react'
import { Terminal } from '../terminal/Terminal'
import { MagneticButton } from '../ui/MagneticButton'
import { GithubMark, LinkedinMark } from '../ui/BrandIcons'
import { ArrowDown, ArrowUpRight, Globe, Mail, Phone } from 'lucide-react'

/**
 * Hero — 2-column split on lg+, stacked on mobile.
 *
 *  - Eyebrow: classic portfolio opener ("Hi, my name is") with a live-status
 *    dot so it doesn't read as filler.
 *  - Headline: the FULL NAME, typed out on first mount with a blinking
 *    cursor. The middle name ("Ahmad") keeps the gradient + italic accent
 *    so the line has character without feeling decorated.
 *  - Subtext: a value statement, not a skills list. The tech lives in
 *    the Skills section below — repeating it in the hero reads as a
 *    CV summary.
 *  - CTAs: portfolio verbs ("See my work", "Get in touch"), not CV verbs.
 */
export function Hero() {
  return (
    <section
      id="home"
      className="relative isolate flex min-h-[100dvh] items-center px-5 pt-28 pb-24 sm:pt-32 sm:px-6 sm:pb-28 md:pt-28 lg:pt-24 lg:pb-32"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* ── Left: portfolio copy ──────────────────────────── */}
        <div className="flex flex-col gap-8 lg:col-span-5">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-mute">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent-bright)]" />
            Hi, my name is
          </div>

          {/* Headline — typed out on mount */}
          <h1 className="text-balance break-words font-semibold tracking-[-0.04em] leading-[0.98] text-ink min-w-0">
            <TypingName />
          </h1>

          {/* Role subheading — sits between the name and the value statement */}
          <h2 className="-mt-2 text-balance text-[clamp(1.05rem,1.6vw,1.35rem)] font-normal leading-[1.4] text-ink-soft">
            Full Stack AI Application Engineer.
          </h2>

          {/* Subtext — value statement, not a skills list */}
          <p className="max-w-[44ch] text-pretty text-[16px] leading-[1.75] text-ink-soft sm:text-[17px]">
            I build AI-driven web applications — robust backends,
            focused frontends, and the asynchronous plumbing that
            keeps the user-facing surface fast. Based in Lahore,
            Pakistan.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton
              href="#projects"
              variant="primary"
              ariaLabel="See my work"
            >
              See my work
              <ArrowDown className="h-4 w-4" />
            </MagneticButton>
            <MagneticButton
              href="#contact"
              variant="ghost"
              ariaLabel="Get in touch"
            >
              Get in touch
              <ArrowUpRight className="h-4 w-4" />
            </MagneticButton>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2">
            <SocialLink
              href="https://github.com/ahmadchughtai21"
              label="GitHub"
            >
              <GithubMark className="h-[18px] w-[18px]" />
            </SocialLink>
            <SocialLink
              href="https://linkedin.com/in/chughtaiahmad"
              label="LinkedIn"
            >
              <LinkedinMark className="h-[18px] w-[18px]" />
            </SocialLink>
            <SocialLink href="https://ahmadchughtai.me" label="Website">
              <Globe className="h-[18px] w-[18px]" />
            </SocialLink>
            <SocialLink
              href="mailto:ahmadchughtai21@gmail.com"
              label="Email"
            >
              <Mail className="h-[18px] w-[18px]" />
            </SocialLink>
            <SocialLink
              href="tel:+923308455655"
              label="Phone"
              hideOnSmall
            >
              <Phone className="h-[18px] w-[18px]" />
            </SocialLink>
          </div>
        </div>

        {/* ── Right: terminal ──────────────────────────────── */}
        <div className="lg:col-span-7">
          <Terminal />
          <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-mute sm:text-left">
            ask me anything · or type{' '}
            <span className="text-ink-soft">help</span> to see commands
          </p>
        </div>
      </div>

      {/* Scroll hint (bottom of viewport) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center sm:flex">
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-mute">
          <span className="inline-block h-px w-8 bg-void-line-strong" />
          scroll
          <span className="ml-1 inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent-bright)]" />
        </div>
      </div>
    </section>
  )
}

/* ── Typing name ────────────────────────────────────────────
   Types the full name character by character on mount, with the
   middle name ("Ahmad") carrying the gradient + italic accent.
   A blinking cursor tracks the end of the typed text. Honors
   prefers-reduced-motion by snapping to the final state. */
const FULL_NAME = 'Muhammad Ahmad Chughtai.'
const AHMAD_START = 'Muhammad '.length // 9
const AHMAD_END = AHMAD_START + 'Ahmad'.length // 14

function TypingName() {
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reduce) {
      // Defer the snap-to-end out of the effect body to satisfy
      // react-hooks/set-state-in-effect.
      const handle = window.setTimeout(
        () => setCharCount(FULL_NAME.length),
        0
      )
      return () => window.clearTimeout(handle)
    }
    if (charCount >= FULL_NAME.length) return

    const ch = FULL_NAME[charCount]
    // Slightly longer pause after spaces for a natural rhythm;
    // base cadence ~55–100ms per character.
    const base = ch === ' ' ? 140 : 55
    const jitter = ch === ' ' ? 40 : 45
    const delay = base + Math.random() * jitter

    const timer = window.setTimeout(() => {
      setCharCount((c) => Math.min(c + 1, FULL_NAME.length))
    }, delay)
    return () => window.clearTimeout(timer)
  }, [charCount])

  const visible = FULL_NAME.slice(0, charCount)
  const beforeAhmad = visible.slice(0, Math.min(AHMAD_START, visible.length))
  const ahmadPart = visible.slice(
    AHMAD_START,
    Math.min(AHMAD_END, visible.length)
  )
  const afterAhmad = visible.slice(AHMAD_END)
  const done = charCount >= FULL_NAME.length

  return (
    <span
      aria-label={FULL_NAME}
      className="block text-[clamp(1.75rem,3.4vw,2.65rem)] italic"
    >
      {beforeAhmad}
      <span className="pr-[0.1em] text-gradient-accent">{ahmadPart}</span>
      {afterAhmad}
      <span
        aria-hidden
        className={`ml-0.5 inline-block h-[0.78em] w-[3px] translate-y-[0.12em] rounded-sm bg-[var(--color-accent-bright)] ${
          done ? 'animate-cursor' : 'animate-cursor'
        }`}
      />
    </span>
  )
}

function SocialLink({
  href,
  label,
  children,
  hideOnSmall,
}: {
  href: string
  label: string
  children: React.ReactNode
  hideOnSmall?: boolean
}) {
  const isExternal = href.startsWith('http') || href.startsWith('tel:')
  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
      aria-label={label}
      data-cursor="hover"
      className={`group grid h-10 w-10 place-items-center rounded-full border border-void-line-strong text-ink-soft transition-all duration-300 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-bright)] hover:shadow-[0_0_24px_-6px_var(--color-accent-glow)] ${
        hideOnSmall ? 'hidden sm:grid' : ''
      }`}
    >
      {children}
    </a>
  )
}
