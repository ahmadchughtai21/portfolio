import { ArrowUpRight } from 'lucide-react'
import { PROJECTS, type Project } from '@/data/projects'
import { GithubMark } from '../ui/BrandIcons'
import { Reveal } from '../ui/Reveal'

/**
 * Bento grid.
 * Personal projects — 1 column on mobile, 2 columns on md+. Each card uses
 * a different visual treatment (graph vs grid) so the bento reads as varied,
 * not "two identical cards" — the bento background diversity rule.
 *
 * Card structure
 *  - Outer wrapper is a <div> (not an <a>) so the Source button (z-20) can
 *    sit ABOVE the full-card overlay link (z-10) and stay independently
 *    clickable.
 *  - Layout is a vertical stack with two distinct sections so the visual
 *    and the text never overlap:
 *      [ TOP    ]  visual  (fixed height, no overlap into text)
 *      ─── divider ───
 *      [ BOTTOM ]  meta · title · blurb · tags · source
 *    The top-right arrow and the full-card overlay link are absolutely
 *    positioned so they don't disturb the stack.
 */
export function Projects() {
  return (
    <section id="projects" className="relative px-5 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal className="mb-14 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
          <h2 className="max-w-[18ch] text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
            Things I&rsquo;ve built.
          </h2>
          <p className="max-w-[40ch] text-[15px] leading-[1.7] text-ink-soft">
            A mix of personal projects — some deployed, some still
            in progress. Hover for the vibe; click to open.
          </p>
        </Reveal>

        <Reveal
          className="grid auto-rows-[minmax(360px,auto)] grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:auto-rows-[minmax(380px,auto)]"
          stagger={0.1}
        >
          {PROJECTS.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div
      data-cursor="hover"
      className="group relative isolate flex flex-col overflow-hidden rounded-2xl border border-void-line-strong bg-void-elev/40 p-6 backdrop-blur-md transition-all duration-500 hover:border-[var(--color-accent)] hover:bg-void-elev/70 hover:shadow-[0_0_0_1px_var(--color-accent-soft),0_24px_80px_-30px_var(--color-accent-glow)] sm:p-7"
    >
      {/* Decorative top-right arrow that slides on hover.
          Only rendered when the project has a live link to follow. */}
      {project.href && (
        <span
          aria-hidden
          className="absolute right-5 top-5 z-20 grid h-9 w-9 place-items-center rounded-full border border-void-line-strong text-ink-soft transition-all duration-500 group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-accent-bright)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        >
          <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:rotate-45" />
        </span>
      )}

      {/* TOP: visual treatment. Fixed height, never overlaps the text
          section below because the text section is in its own div, not
          pushed by margins. The visual fills this section. */}
      <div className="relative h-32 sm:h-36">
        <ProjectVisual visual={project.visual} />
      </div>

      {/* Hairline divider so the two sections read as distinct, not as
          one blob. Subtle — same color family as the border. */}
      <div
        aria-hidden
        className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-void-line-strong to-transparent"
      />

      {/* BOTTOM: meta · title · blurb · tags. Grows to fill remaining
          card height. The Source button is a direct child of the card
          root (below) so it can stack at z-30 above the full-card
          overlay (z-10) without being trapped in this section's
          stacking context. */}
      <div className="relative mt-4 flex flex-1 flex-col">
        <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.18em] text-ink-mute">
          <span>{project.id}</span>
          <span>{project.year}</span>
        </div>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">
          {project.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-[1.65] text-ink-soft">
          {project.blurb}
        </p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-5">
          {project.tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-void-line-strong bg-void/40 px-2.5 py-1 font-mono text-[10px] text-ink-soft"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Source button — direct child of the card root, absolutely
          positioned in the bottom-right so it stacks unambiguously
          above the full-card overlay (z-10) and opens the GitHub
          repo instead of the live demo. */}
      {project.github && (
        <a
          href={project.github}
          target="_blank"
          rel="noreferrer"
          aria-label={`${project.title} — source`}
          data-cursor="hover"
          className="absolute bottom-6 right-6 z-30 inline-flex items-center gap-1.5 rounded-full border border-void-line-strong bg-void-elev/80 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft backdrop-blur-sm transition-all duration-300 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-bright)] hover:shadow-[0_0_18px_-4px_var(--color-accent-glow)] sm:bottom-7 sm:right-7"
        >
          <GithubMark className="h-3.5 w-3.5" />
          Source
        </a>
      )}

      {/* Full-card overlay link — captures clicks on whitespace (z-10) so
          the user lands on the live demo. The Source button above (z-20)
          sits above this overlay and is independently clickable. */}
      {project.href && (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${project.title}`}
          className="absolute inset-0 z-10 rounded-2xl"
        />
      )}
    </div>
  )
}

/* ── Per-card visuals ─────────────────────────────────────── */
function ProjectVisual({ visual }: { visual: Project['visual'] }) {
  switch (visual) {
    case 'graph':
      return <VisualGraph />
    case 'grid':
      return <VisualGrid />
    default:
      return null
  }
}

function VisualGraph() {
  // Multimodal pipeline: audio + image + pdf → markdown → RAG chat.
  // Fills its parent container; the SVG preserves aspect ratio so
  // the diagram stays readable at any card width.
  const nodes = [
    { x: 24, y: 40, label: 'audio' },
    { x: 24, y: 80, label: 'image' },
    { x: 24, y: 120, label: 'pdf' },
    { x: 150, y: 80, label: 'md' },
    { x: 260, y: 40, label: 'rag' },
    { x: 260, y: 120, label: 'chat' },
  ]
  return (
    <svg
      aria-hidden
      className="pointer-events-none h-full w-full opacity-90 transition-opacity duration-500 group-hover:opacity-100"
      viewBox="0 0 320 160"
      preserveAspectRatio="xMinYMid meet"
    >
      <defs>
        <linearGradient id="grad-graph" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
          <stop offset="50%" stopColor="var(--color-accent-bright)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Edges */}
      <path
        d="M40,40 Q95,40 150,80 M40,80 L150,80 M40,120 Q95,120 150,80 M150,80 Q205,80 260,40 M150,80 Q205,80 260,120"
        fill="none"
        stroke="url(#grad-graph)"
        strokeWidth="1.4"
        strokeDasharray="3 4"
      />
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            r={5.5}
            fill="var(--color-accent-bright)"
            opacity={0.95}
          />
          <circle
            cx={n.x}
            cy={n.y}
            r={10}
            fill="none"
            stroke="var(--color-accent)"
            strokeOpacity={0.4}
          />
          <text
            x={n.x + 14}
            y={n.y + 4}
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill="var(--color-ink-soft)"
            style={{ fill: 'var(--color-ink-soft)' }}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function VisualGrid() {
  // 4-pane dashboard: 2x2 grid mirroring the actual product.
  // Fills its parent container; squares stay roughly equal on resize.
  return (
    <div
      aria-hidden
      className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[3px] rounded-md border border-void-line-strong bg-void-line p-[2px]"
    >
      {[
        'list',
        'detail',
        'stats',
        'tags',
      ].map((label, i) => (
        <div
          key={label}
          className="relative flex flex-col gap-1 rounded-[3px] bg-void-elev/80 p-1.5 sm:p-2"
        >
          <div className="font-mono text-[7px] uppercase tracking-[0.12em] text-ink-mute sm:text-[8px]">
            {label}
          </div>
          <div className="flex-1 space-y-[2px]">
            {[0, 1].map((j) => (
              <div
                key={j}
                className="h-[3px] rounded-sm bg-void-line-strong"
                style={{
                  width: `${i === 2 ? 80 - j * 15 : 60 - j * 18}%`,
                  background:
                    i === 2
                      ? 'var(--color-accent)'
                      : 'var(--color-void-line-strong)',
                  opacity: i === 2 ? 0.9 : 0.7,
                }}
              />
            ))}
          </div>
          {i === 0 && (
            <div className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent-bright)]" />
          )}
        </div>
      ))}
    </div>
  )
}
