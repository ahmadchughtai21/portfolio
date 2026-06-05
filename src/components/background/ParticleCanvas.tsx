import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'
import { reducedMotion } from '@/lib/utils'

/**
 * Starfield background.
 *
 *  - Dark mode   → small white-purple pinpoints + occasional 4-point
 *                  cross stars on the brighter ones, on a deep purple
 *                  gradient body. Occasional shooting star.
 *  - Light mode  → tiny deep-purple specks on a soft white gradient.
 *
 * Design intent
 *  - The canvas is transparent; the body below carries the dark/light
 *    gradient. We full-clear the canvas each frame (no trails) so the
 *    gradient shows through cleanly.
 *  - No halos / no glow rings — stars are pinpoints + small crosses,
 *    reading as a night sky, not as orbs.
 *  - Mouse proximity gives a subtle pull + brightness boost so the
 *    interaction is felt but not over-the-top.
 *
 * Performance
 *  - 220 small stars, each a 1-2 draw-call item (cross+dot, or dot only).
 *  - At most 2 shooting stars at a time, each drawn as a 3-segment line.
 *  - DPR capped at 1.5.
 *  - Skips work when `document.hidden`.
 */
export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // ── Tunables ────────────────────────────────────────────────
    const STAR_COUNT = 220
    const BRIGHT_RATIO = 0.28          // fraction that get a 4-point cross
    const MOUSE_RADIUS = 180
    const MOUSE_FORCE = 0.0025
    const MOUSE_BRIGHT = 0.9
    const SHOOT_COOLDOWN_MIN = 5_000   // ms
    const SHOOT_COOLDOWN_MAX = 12_000
    const DPR_CAP = 1.5

    type Star = {
      x: number
      y: number
      z: number            // 0..1 depth
      r: number            // core radius
      baseAlpha: number
      twinkleSpeed: number
      twinklePhase: number
      vx: number
      vy: number
      bright: boolean      // gets a 4-point cross
    }

    type Shoot = {
      x: number
      y: number
      vx: number
      vy: number
      life: number
      maxLife: number
      len: number
    }

    const stars: Star[] = []
    let shooting: Shoot | null = null
    let nextShootAt = 0
    let time = 0

    // Theme state
    let isLight = useStore.getState().theme === 'light'
    // We use two fixed star colors: dark → near-white tinted purple,
    // light → deep royal purple. Stars are visually identical otherwise.
    const color = isLight
      ? { r: 74, g: 14, b: 78 }            // deep royal purple
      : { r: 232, g: 220, b: 245 }         // near-white with a purple wash
    const brightColor = isLight
      ? { r: 45, g: 5, b: 48 }             // darker for contrast on white
      : { r: 255, g: 250, b: 255 }         // pure bright on dark

    // ── Sizing ──────────────────────────────────────────────────
    let dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
    let W = 0
    let H = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initStars()
      // Drop any in-flight shooting star (its coords are stale)
      shooting = null
      nextShootAt = time + SHOOT_COOLDOWN_MIN + Math.random() * (SHOOT_COOLDOWN_MAX - SHOOT_COOLDOWN_MIN)
    }

    const initStars = () => {
      stars.length = 0
      for (let i = 0; i < STAR_COUNT; i++) {
        const z = Math.random()
        const bright = Math.random() < BRIGHT_RATIO
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          z,
          r: 0.4 + z * (bright ? 1.1 : 0.6),
          baseAlpha: 0.35 + Math.random() * 0.55 * (bright ? 1 : 0.85),
          twinkleSpeed: 0.3 + Math.random() * 1.4,
          twinklePhase: Math.random() * Math.PI * 2,
          // Slight horizontal bias so the field feels like it's drifting
          vx: (Math.random() - 0.4) * 0.06,
          vy: (Math.random() - 0.5) * 0.04,
          bright,
        })
      }
    }

    resize()

    // ── Mouse (ref-only) ────────────────────────────────────────
    const mouse = { x: -9999, y: -9999, active: false, hasMoved: false }
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
      mouse.hasMoved = true
    }
    const onLeave = () => {
      mouse.active = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', resize, { passive: true })

    // ── Theme sync ──────────────────────────────────────────────
    const syncTheme = () => {
      const t = useStore.getState().theme
      if ((t === 'light') !== isLight) {
        isLight = t === 'light'
        if (isLight) {
          color.r = 74; color.g = 14; color.b = 78
          brightColor.r = 45; brightColor.g = 5; brightColor.b = 48
        } else {
          color.r = 232; color.g = 220; color.b = 245
          brightColor.r = 255; brightColor.g = 250; brightColor.b = 255
        }
      }
    }

    // ── Loop ────────────────────────────────────────────────────
    const reduce = reducedMotion()
    let raf = 0
    let lastT = performance.now()

    const spawnShooting = () => {
      // Start from the upper-left third, fly toward lower-right
      const startX = Math.random() * W * 0.4
      const startY = Math.random() * H * 0.3
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.4
      const speed = 8 + Math.random() * 6
      shooting = {
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 1100,
        len: 60 + Math.random() * 40,
      }
    }

    const tick = (t: number) => {
      if (typeof document !== 'undefined' && document.hidden) {
        lastT = t
        raf = requestAnimationFrame(tick)
        return
      }
      const dt = Math.min(48, t - lastT)
      lastT = t
      time += dt
      syncTheme()

      // Full clear — canvas is transparent, body gradient shows through
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineCap = 'round'

      // ── Shooting star spawn ───────────────────────────────
      if (!shooting && time > nextShootAt) {
        spawnShooting()
        nextShootAt = time + SHOOT_COOLDOWN_MIN + Math.random() * (SHOOT_COOLDOWN_MAX - SHOOT_COOLDOWN_MIN)
      }

      // ── Stars ─────────────────────────────────────────────
      const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`
      const brightStr = `rgb(${brightColor.r}, ${brightColor.g}, ${brightColor.b})`
      const mouseR2 = MOUSE_RADIUS * MOUSE_RADIUS
      const mx = mouse.x
      const my = mouse.y
      const mActive = mouse.active && mouse.hasMoved

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        // Drift
        s.x += s.vx * (0.4 + s.z)
        s.y += s.vy * (0.4 + s.z)

        // Mouse pull + brightness
        let boost = 0
        if (mActive) {
          const dx = mx - s.x
          const dy = my - s.y
          const d2 = dx * dx + dy * dy
          if (d2 < mouseR2) {
            const d = Math.sqrt(d2) || 1
            const falloff = 1 - d / MOUSE_RADIUS
            const f = falloff * MOUSE_FORCE * (0.5 + s.z)
            s.vx += (dx / d) * f
            s.vy += (dy / d) * f
            boost = falloff * MOUSE_BRIGHT
          }
        }

        // Damp + gentle wobble
        s.vx *= 0.97
        s.vy *= 0.97
        s.vx += Math.sin(time * 0.0004 + s.twinklePhase) * 0.003
        s.vy += Math.cos(time * 0.0003 + s.twinklePhase) * 0.003

        // Wrap
        if (s.x < -8) s.x = W + 8
        else if (s.x > W + 8) s.x = -8
        if (s.y < -8) s.y = H + 8
        else if (s.y > H + 8) s.y = -8

        // Twinkle
        const tw = 0.55 + 0.45 * Math.sin(time * 0.001 * s.twinkleSpeed + s.twinklePhase)
        const a = s.baseAlpha * tw * (1 + boost)
        if (a < 0.02) continue

        if (s.bright) {
          // Bright star: tiny core + 4-point cross
          const len = s.r * 4 + 2
          ctx.strokeStyle = brightStr
          ctx.globalAlpha = a * 0.55
          ctx.lineWidth = 0.6
          ctx.beginPath()
          ctx.moveTo(s.x - len, s.y)
          ctx.lineTo(s.x + len, s.y)
          ctx.moveTo(s.x, s.y - len)
          ctx.lineTo(s.x, s.y + len)
          ctx.stroke()

          // Diagonal spike (faint, half-length)
          const dlen = len * 0.45
          ctx.globalAlpha = a * 0.25
          ctx.beginPath()
          ctx.moveTo(s.x - dlen, s.y - dlen)
          ctx.lineTo(s.x + dlen, s.y + dlen)
          ctx.moveTo(s.x - dlen, s.y + dlen)
          ctx.lineTo(s.x + dlen, s.y - dlen)
          ctx.stroke()

          // Core dot
          ctx.fillStyle = brightStr
          ctx.globalAlpha = a
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Dim star: just a single pinpoint
          ctx.fillStyle = colorStr
          ctx.globalAlpha = a * 0.85
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 0.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Shooting star ────────────────────────────────────
      if (shooting) {
        shooting.life += dt
        shooting.x += shooting.vx
        shooting.y += shooting.vy

        const lifeT = shooting.life / shooting.maxLife
        if (lifeT >= 1 || shooting.x > W + 80 || shooting.y > H + 80) {
          shooting = null
        } else {
          // Tail goes from (x,y) backward along the velocity vector
          const tailX = shooting.x - shooting.vx * (shooting.len / 10)
          const tailY = shooting.y - shooting.vy * (shooting.len / 10)
          const fade = 1 - lifeT

          // Draw the trail as a gradient line: head bright, tail faded
          const grad = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY)
          grad.addColorStop(0, `rgba(${brightColor.r}, ${brightColor.g}, ${brightColor.b}, ${0.9 * fade})`)
          grad.addColorStop(1, `rgba(${brightColor.r}, ${brightColor.g}, ${brightColor.b}, 0)`)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.2
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.moveTo(shooting.x, shooting.y)
          ctx.lineTo(tailX, tailY)
          ctx.stroke()

          // Head dot
          ctx.fillStyle = `rgb(${brightColor.r}, ${brightColor.g}, ${brightColor.b})`
          ctx.globalAlpha = fade
          ctx.beginPath()
          ctx.arc(shooting.x, shooting.y, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }

    if (reduce) {
      tick(performance.now())
    } else {
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  )
}
