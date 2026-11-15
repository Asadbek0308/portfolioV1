// Shared plumbing for canvas hover effects on Work page cards.
// makeCanvasHover({ render, ... }) returns a component with the same contract
// as any src/works/<slug>/Hover.jsx: it takes `active` and draws over the card.
//
// The loop runs only while the card is hovered or still fading out, then stops.
// `render(ctx, s, dt, on)` gets:
//   s.width / s.height  card size in px        s.time    seconds since the hover began
//   s.amount            0..1 fade in/out       s.pointer {x, y, known} relative to the card
//   s.custom            per-card scratch state from createState()
import { useEffect, useRef } from 'react'

export const approach = (value, target, rate) => {
  const next = value + (target - value) * rate
  return Math.abs(next - target) < 0.005 ? target : next
}
export const clamp01 = (v) => Math.min(1, Math.max(0, v))
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
export const easeOutBack = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export const LIGHT = [240, 217, 181] // Chessio "Classic Wood"
export const DARK = [181, 136, 99]
export const AMBER = [246, 190, 80]
export const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`
export const SYMBOL_FONT = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", serif'

// Solid chess glyph with an outline, readable on light and dark backgrounds
export function drawPiece(ctx, glyph, x, y, size, { white = true, alpha = 1, rotate = 0 } = {}) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.translate(x, y)
  if (rotate) ctx.rotate(rotate)
  ctx.font = `${Math.round(size)}px ${SYMBOL_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = Math.max(1.5, size * 0.06)
  ctx.strokeStyle = white ? '#111' : '#eee'
  ctx.strokeText(glyph, 0, 0)
  ctx.fillStyle = white ? '#fafafa' : '#141414'
  ctx.fillText(glyph, 0, 0)
  ctx.restore()
}

export function makeCanvasHover({
  render,
  createState = () => ({}),
  fadeIn = 0.12,
  fadeOut = 0.1,
  staticTime = 2, // reduced motion: draw one still frame at this time instead of animating
}) {
  function CanvasHover({ active }) {
    const rootRef = useRef(null)
    const canvasRef = useRef(null)
    const activeRef = useRef(active)
    const wakeRef = useRef(null)

    useEffect(() => {
      const canvas = canvasRef.current
      const card = rootRef.current?.parentElement
      if (!canvas || !card) return
      const ctx = canvas.getContext('2d')
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const s = {
        width: 0,
        height: 0,
        amount: 0,
        time: 0,
        pointer: { x: 0, y: 0, known: false },
        custom: createState(),
      }
      let raf = null
      let last = 0

      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        s.width = rect.width
        s.height = rect.height
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      const onPointerMove = (e) => {
        const rect = card.getBoundingClientRect()
        s.pointer.x = e.clientX - rect.left
        s.pointer.y = e.clientY - rect.top
        s.pointer.known = true
      }

      const frame = (now) => {
        const on = activeRef.current
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
        last = now

        if (on && !s.pointer.known) {
          // keyboard focus: pretend the pointer is in the middle
          s.pointer.x = s.width / 2
          s.pointer.y = s.height / 2
        }
        s.amount = approach(s.amount, on ? 1 : 0, reduceMotion ? 1 : on ? fadeIn : fadeOut)
        s.time = reduceMotion ? staticTime : s.time + dt

        ctx.clearRect(0, 0, s.width, s.height)
        if (s.amount > 0) render(ctx, s, reduceMotion ? 0 : dt, on)

        const done = !on && s.amount === 0
        if (done || reduceMotion) {
          raf = null
          last = 0
          if (done) {
            s.time = 0
            s.pointer.known = false
            s.custom = createState()
          }
          return
        }
        raf = requestAnimationFrame(frame)
      }

      wakeRef.current = () => {
        if (!raf) raf = requestAnimationFrame(frame)
      }

      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)
      card.addEventListener('pointermove', onPointerMove)

      return () => {
        if (raf) cancelAnimationFrame(raf)
        ro.disconnect()
        card.removeEventListener('pointermove', onPointerMove)
        wakeRef.current = null
      }
    }, [])

    useEffect(() => {
      activeRef.current = active
      wakeRef.current?.()
    }, [active])

    return (
      <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
    )
  }
  return CanvasHover
}
