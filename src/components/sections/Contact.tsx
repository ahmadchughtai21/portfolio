import { MagneticButton } from '../ui/MagneticButton'
import { Reveal } from '../ui/Reveal'
import { GithubMark, LinkedinMark } from '../ui/BrandIcons'
import { ArrowUpRight, Mail, Phone, Globe } from 'lucide-react'

export function Contact() {
  return (
    <section id="contact" className="relative px-5 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
          <div>
            <h2 className="max-w-[14ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-5xl md:text-6xl lg:text-7xl">
              Let&rsquo;s build something{' '}
              <span className="italic text-[var(--color-accent-bright)]">useful</span>.
            </h2>
            <p className="mt-6 max-w-[55ch] text-pretty text-[15.5px] leading-[1.75] text-ink-soft sm:text-[17px] sm:leading-[1.8]">
              Open to internships, freelance and contract work.
              Comfortable integrating into teams or taking full
              ownership of a build.
            </p>
            <ul className="mt-8 space-y-2 font-mono text-[13px] text-ink-soft">
              <li>
                <span className="text-ink-mute">email ·</span>{' '}
                <a
                  href="mailto:ahmadchughtai21@gmail.com"
                  className="text-ink underline-offset-4 transition-colors hover:text-[var(--color-accent-bright)] hover:underline"
                >
                  ahmadchughtai21@gmail.com
                </a>
              </li>
              <li>
                <span className="text-ink-mute">phone ·</span>{' '}
                <a
                  href="tel:+923308455655"
                  className="text-ink underline-offset-4 transition-colors hover:text-[var(--color-accent-bright)] hover:underline"
                >
                  +92 330 8455655
                </a>
              </li>
              <li>
                <span className="text-ink-mute">site ·</span>{' '}
                <a
                  href="https://ahmadchughtai.me"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline-offset-4 transition-colors hover:text-[var(--color-accent-bright)] hover:underline"
                >
                  ahmadchughtai.me
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-start gap-6 md:items-end">
            <MagneticButton
              href="mailto:ahmadchughtai21@gmail.com"
              variant="primary"
              ariaLabel="Send email"
            >
              Start a conversation
              <ArrowUpRight className="h-4 w-4" />
            </MagneticButton>
            <div className="flex items-center gap-2.5">
              <SocialRing href="https://github.com/ahmadchughtai21" label="GitHub">
                <GithubMark className="h-[18px] w-[18px]" />
              </SocialRing>
              <SocialRing
                href="https://linkedin.com/in/chughtaiahmad"
                label="LinkedIn"
              >
                <LinkedinMark className="h-[18px] w-[18px]" />
              </SocialRing>
              <SocialRing href="https://ahmadchughtai.me" label="Website">
                <Globe className="h-[18px] w-[18px]" />
              </SocialRing>
              <SocialRing href="mailto:ahmadchughtai21@gmail.com" label="Email">
                <Mail className="h-[18px] w-[18px]" />
              </SocialRing>
              <SocialRing href="tel:+923308455655" label="Phone" hideOnSmall>
                <Phone className="h-[18px] w-[18px]" />
              </SocialRing>
            </div>
          </div>
        </Reveal>

        <div className="divider my-16 sm:my-20" />

        <div className="flex items-center font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-mute">
          <span>© {new Date().getFullYear()} muhammad ahmad chughtai</span>
        </div>
      </div>
    </section>
  )
}

function SocialRing({
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
      className={`grid h-10 w-10 place-items-center rounded-full border border-void-line-strong text-ink-soft transition-all duration-300 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-bright)] hover:shadow-[0_0_24px_-6px_var(--color-accent-glow)] ${
        hideOnSmall ? 'hidden sm:grid' : ''
      }`}
    >
      {children}
    </a>
  )
}
