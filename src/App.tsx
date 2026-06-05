import { ParticleCanvas } from './components/background/ParticleCanvas'
import { Cursor } from './components/ui/Cursor'
import { ThemeProvider } from './components/ui/ThemeProvider'
import { Navbar } from './components/nav/Navbar'
import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Projects } from './components/sections/Projects'
import { Skills } from './components/sections/Skills'
import { Contact } from './components/sections/Contact'
import { GlitchController } from './components/terminal/GlitchController'

export default function App() {
  return (
    <ThemeProvider>
      {/* Layer 0 — interactive particle background (fixed) */}
      <ParticleCanvas />

      {/* Layer 1 — fixed page-wide grain overlay (decorative) */}
      <div className="grain" />

      {/* Layer 2 — content */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Contact />
        </main>
      </div>

      {/* Layer 99 — custom cursor (only on fine pointers) */}
      <Cursor />

      {/* Layer 100 — easter-egg overlay */}
      <GlitchController />
    </ThemeProvider>
  )
}
