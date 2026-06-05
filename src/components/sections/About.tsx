import { Reveal } from '../ui/Reveal'

export function About() {
  return (
    <section id="about" className="relative px-5 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10 lg:gap-16">
          <div className="md:col-span-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-mute">
              [01] about
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
              Complete AI-driven web applications, end to end.
            </h2>
          </div>
          <div className="md:col-span-7">
            <div className="space-y-5 text-pretty text-[15.5px] leading-[1.75] text-ink-soft sm:text-[17px] sm:leading-[1.8]">
              <p>
                I&rsquo;m Muhammad Ahmad Chughtai, a full-stack engineer
                based in Lahore. I build robust Django and FastAPI
                backends, snappy React frontends, and the asynchronous
                AI plumbing in between &mdash; ensuring the heavy LLM
                lifting stays off the request path so the user-facing
                application remains fast and fluid.
              </p>
              <p>
                My recent focus is on practical AI integration and
                agentic workflows. Rather than just wrapping APIs, I
                build resilient systems using intelligent model
                routing, structured data extraction, and reliable
                vector retrieval. It&rsquo;s about making complex
                language models serve the application without
                compromising performance or predictability.
              </p>
              <p className="text-ink">
                I care deeply about clean architecture, scalable
                deployments, and shipping code that thrives in
                production.
              </p>
            </div>

            {/* Quick facts — 2-col on mobile, 4-col on md+ */}
            <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {[
                { v: 'Full-Stack & AI', label: 'focus' },
                { v: 'Lahore, PK', label: 'location' },
                { v: '3+ yr', label: 'self-building' },
                { v: 'UMT BSCS \'27', label: 'education' },
              ].map((f) => (
                <li
                  key={f.label}
                  className="rounded-xl border border-void-line-strong bg-void-elev/40 p-4 backdrop-blur"
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                    {f.label}
                  </div>
                  <div className="mt-1.5 truncate text-[15px] font-semibold text-ink sm:text-base">
                    {f.v}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
