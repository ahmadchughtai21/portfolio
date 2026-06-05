import { TECH_GROUPS, type TechGroup } from '@/data/tech'
import { Reveal } from '../ui/Reveal'

/**
 * Skills — "Things I know".
 * Grouped by category so a visitor can scan what I lean on for each
 * layer of the stack without having to skim a flat list of brand names.
 */
export function Skills() {
  return (
    <section id="skills" className="relative px-5 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal className="mb-12 sm:mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-mute">
            [02] skills
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
            <h2 className="text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
              Skills.
            </h2>
            <p className="max-w-[44ch] text-[15px] leading-[1.7] text-ink-soft">
              The tools I reach for by default. Grouped by where they
              sit in the stack &mdash; not a brand wall, a working set.
            </p>
          </div>
        </Reveal>

        <Reveal
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          stagger={0.06}
        >
          {TECH_GROUPS.map((g) => (
            <SkillCard key={g.label} group={g} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function SkillCard({ group }: { group: TechGroup }) {
  return (
    <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-void-line-strong bg-void-elev/40 p-6 backdrop-blur-md transition-all duration-500 hover:border-[var(--color-accent)] hover:bg-void-elev/70 hover:shadow-[0_0_0_1px_var(--color-accent-soft),0_24px_80px_-30px_var(--color-accent-glow)]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-ink-mute">
          {group.label}
        </span>
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-void-line-strong transition-all duration-500 group-hover:bg-[var(--color-accent-bright)] group-hover:shadow-[0_0_10px_var(--color-accent-glow)]"
        />
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {group.items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-void-line-strong bg-void/40 px-2.5 py-1 font-mono text-[10.5px] text-ink-soft transition-colors duration-300 group-hover:border-void-line group-hover:text-ink"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
