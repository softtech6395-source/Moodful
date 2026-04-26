import { useEffect, useRef } from 'react'
import type { ParticleConfig } from '../lib/moods'

interface Particle {
  x: number
  y: number
  vx?: number
  vy?: number
  r?: number
  w?: number
  a?: number
  len?: number
  wob?: number
  wobSp?: number
  base?: number
  pulse?: number
}

function hexA(hex: string, a: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export default function ParticleCanvas({ particles: cfg }: { particles: ParticleConfig | null }) {
  const cnvRef = useRef<HTMLCanvasElement | null>(null)
  const dimsRef = useRef({ W: 0, H: 0 })
  const cfgRef = useRef<ParticleConfig | null>(null)
  const partsRef = useRef<Particle[]>([])
  const phaseRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    cfgRef.current = cfg
    if (!cfg) {
      partsRef.current = []
      return
    }
    partsRef.current = spawn(cfg, dimsRef.current.W, dimsRef.current.H)
  }, [cfg])

  useEffect(() => {
    const cnv = cnvRef.current
    if (!cnv) return
    const ctx = cnv.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = window.innerWidth
      const H = window.innerHeight
      cnv.width = W * dpr
      cnv.height = H * dpr
      cnv.style.width = W + 'px'
      cnv.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dimsRef.current = { W, H }
      const c = cfgRef.current
      if (c && c.type === 'breathe' && partsRef.current[0]) {
        partsRef.current[0].x = W / 2
        partsRef.current[0].y = H / 2
      }
      // re-spawn rain/streaks if particles haven't been seeded yet
      if (c && partsRef.current.length === 0) {
        partsRef.current = spawn(c, W, H)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const { W, H } = dimsRef.current
      ctx.clearRect(0, 0, W, H)
      const c = cfgRef.current
      if (!c) return
      phaseRef.current += 0.016

      const parts = partsRef.current

      if (c.type === 'rain') {
        ctx.lineCap = 'round'
        for (const p of parts) {
          p.y += (p.vy ?? 0) * c.speed
          p.x += p.vx ?? 0
          if (p.y > H + 20) { p.y = -12; p.x = Math.random() * W }
          ctx.strokeStyle = hexA(c.color, p.a ?? 0.5)
          ctx.lineWidth = p.w ?? 1
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - 1.4, p.y + (p.len ?? 0))
          ctx.stroke()
        }
      } else if (c.type === 'bubbles') {
        for (const p of parts) {
          p.wob = (p.wob ?? 0) + (p.wobSp ?? 0)
          p.y += (p.vy ?? 0) * c.speed
          p.x += (p.vx ?? 0) + Math.sin(p.wob) * 0.4
          if (p.y < -(p.r ?? 0)) { p.y = H + (p.r ?? 0); p.x = Math.random() * W }
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r ?? 1)
          grad.addColorStop(0, hexA(c.color, p.a ?? 0.4))
          grad.addColorStop(1, hexA(c.color, 0))
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r ?? 1, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (c.type === 'drift') {
        for (const p of parts) {
          p.x += (p.vx ?? 0) * c.speed
          p.y += (p.vy ?? 0) * c.speed
          const r = p.r ?? 0
          if (p.x < -r) p.x = W + r
          if (p.x > W + r) p.x = -r
          if (p.y < -r) p.y = H + r
          if (p.y > H + r) p.y = -r
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
          grad.addColorStop(0, hexA(c.color, p.a ?? 0.2))
          grad.addColorStop(1, hexA(c.color, 0))
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (c.type === 'streaks') {
        ctx.lineCap = 'round'
        for (const p of parts) {
          p.x += (p.vx ?? 0) * c.speed
          p.y += (p.vy ?? 0) * c.speed
          const len = p.len ?? 0
          if (p.x > W + len) { p.x = -len; p.y = Math.random() * H }
          if (p.y > H + len) p.y = -len
          ctx.strokeStyle = hexA(c.color, p.a ?? 0.5)
          ctx.lineWidth = p.w ?? 1
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - len * 0.7, p.y - len * 0.3)
          ctx.stroke()
        }
      } else if (c.type === 'breathe') {
        const p = parts[0]
        if (!p) return
        p.pulse = (Math.sin(phaseRef.current * 0.55) + 1) / 2
        const r = (p.base ?? 0) * (0.6 + p.pulse * 0.7)
        for (let i = 4; i > 0; i--) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * i * 0.55, 0, Math.PI * 2)
          ctx.strokeStyle = hexA(c.color, 0.13 * (1 - i / 5))
          ctx.lineWidth = 1
          ctx.stroke()
        }
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        grad.addColorStop(0, hexA(c.color, 0.5))
        grad.addColorStop(1, hexA(c.color, 0))
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return <canvas ref={cnvRef} className="fixed inset-0 z-[1] pointer-events-none" />
}

function spawn(c: ParticleConfig, W: number, H: number): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < c.count; i++) out.push(make(c, W, H, true))
  return out
}

function make(c: ParticleConfig, W: number, H: number, randomY: boolean): Particle {
  const sz = c.size[0] + Math.random() * (c.size[1] - c.size[0])
  switch (c.type) {
    case 'rain':
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : -10,
        vy: 6 + Math.random() * 6,
        vx: -0.6,
        len: 9 + Math.random() * 16,
        w: sz,
        a: 0.25 + Math.random() * 0.45,
      }
    case 'bubbles':
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : H + 20,
        vy: -(0.25 + Math.random() * 0.55),
        vx: (Math.random() - 0.5) * 0.4,
        r: sz,
        a: 0.18 + Math.random() * 0.45,
        wob: Math.random() * Math.PI * 2,
        wobSp: 0.014 + Math.random() * 0.018,
      }
    case 'drift':
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vy: (Math.random() - 0.5) * 0.18,
        vx: (Math.random() - 0.5) * 0.28,
        r: sz,
        a: 0.06 + Math.random() * 0.16,
      }
    case 'streaks':
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 3 + Math.random() * 4,
        vy: 1 + Math.random() * 2,
        len: 30 + Math.random() * 60,
        w: sz,
        a: 0.35 + Math.random() * 0.45,
      }
    case 'breathe':
      return { x: W / 2, y: H / 2, r: sz, base: sz, pulse: 0 }
  }
}
