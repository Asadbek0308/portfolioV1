// Work page hover effect for Philosophify: ASCII flames rising over the whole
// card. A classic "doom fire" heat simulation, drawn twice:
//   1. a tiny 1-pixel-per-cell heat map, scaled up and blurred → the glow
//   2. characters coloured by heat on top → the ASCII flames
// Flames are only fed while the card is hovered; afterwards they burn out on
// their own and the loop stops completely.
import { useEffect, useRef } from 'react'

const CELL_W = 7 // px per character column
const CELL_H = 10 // px per character row
const FONT = `bold ${CELL_H + 1}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
const FPS = 30
const FLAME_REACH = 0.4 // how far up the card the tallest tongues reach (0–1)
const BURNOUT_STEPS = 36 // after unhover the ashes fade in ~0.9s; lower = faster (e.g. 8 ≈ 0.4s)
const COLOR_CURVE = 1.3 // >1 keeps most of the flame orange/red, only the core yellow-white

// Uneven, slowly shifting heat along the base, so flames rise as separate
// tongues of different heights instead of one flat wall (0..1)
const baseHeat = (x, t) =>
  Math.min(
    1,
    Math.max(0, 0.5 + 0.25 * Math.sin(x * 0.35 + t * 0.11) + 0.15 * Math.sin(x * 0.9 - t * 0.23) + 0.1 * Math.sin(x * 2.1 + t * 0.5))
  )

// Characters from faint sparks to the dense core
const RAMP = " .'`,:;~^*+=!ixo%#&@"

// Classic 37-step fire palette: black → deep red → orange → yellow → white
const PALETTE = [
  [7, 7, 7], [31, 7, 7], [47, 15, 7], [71, 15, 7], [87, 23, 7], [103, 31, 7],
  [119, 31, 7], [143, 39, 7], [159, 47, 7], [175, 63, 7], [191, 71, 7], [199, 71, 7],
  [223, 79, 7], [223, 87, 7], [223, 87, 7], [215, 95, 7], [215, 95, 7], [215, 103, 15],
  [207, 111, 15], [207, 119, 15], [207, 127, 15], [207, 135, 23], [199, 135, 23],
  [199, 143, 23], [199, 151, 31], [191, 159, 31], [191, 159, 31], [191, 167, 39],
  [191, 167, 39], [191, 175, 47], [183, 175, 47], [183, 183, 47], [183, 183, 55],
  [207, 207, 111], [223, 223, 159], [239, 239, 199], [255, 255, 255],
]
const TOP = PALETTE.length - 1
const CHAR_COLORS = PALETTE.map(([r, g, b], i) => `rgba(${r},${g},${b},${Math.min(1, i / 8)})`)

export default function PhilosophifyHover({ active }) {
  const canvasRef = useRef(null)
  const glowRef = useRef(null)
  const activeRef = useRef(active)
  const wakeRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const glowCanvas = glowRef.current
    if (!canvas || !glowCanvas) return
    const ctx = canvas.getContext('2d')
    const glow = glowCanvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let maxHeat = TOP
    let heat = new Uint16Array(0)
    let glowImage = null
    let raf = null
    let last = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = Math.max(1, Math.ceil(width / CELL_W))
      rows = Math.max(2, Math.ceil(height / CELL_H))
      // Each row cools by 1.5 on average, so this heat reaches FLAME_REACH of the card
      maxHeat = Math.max(TOP, Math.round(rows * FLAME_REACH * 1.5))
      heat = new Uint16Array(cols * rows)

      glowCanvas.width = cols
      glowCanvas.height = rows
      glowImage = glow.createImageData(cols, rows)
    }

    let tick = 0

    // One step: every cell rises into the row above, flickering one column
    // left or right and cooling by 0–3, which breaks the heat into tongues.
    const step = () => {
      tick++
      const bottom = (rows - 1) * cols
      for (let x = 0; x < cols; x++) {
        heat[bottom + x] = activeRef.current ? Math.round(maxHeat * (0.7 + 0.3 * baseHeat(x, tick))) : 0
      }
      // Not hovered: every cell loses extra heat each frame, so the ashes vanish quickly
      const burnout = activeRef.current ? 0 : Math.ceil(maxHeat / BURNOUT_STEPS)
      let alive = false
      for (let y = 1; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const value = heat[y * cols + x]
          const drift = Math.floor(Math.random() * 3) - 1 // -1, 0 or 1: no sideways lean
          const dx = Math.min(cols - 1, Math.max(0, x + drift))
          const cool = Math.floor(Math.random() * 4) + burnout // 0..3 (+ burnout after unhover)
          const cooled = value > 0 ? Math.max(0, value - cool) : 0
          heat[(y - 1) * cols + dx] = cooled
          if (cooled > 0) alive = true
        }
      }
      return alive
    }

    // Heat → palette index, curved so the flame body stays orange/red
    const levelOf = (h) => Math.min(TOP, Math.round(Math.pow(h / maxHeat, COLOR_CURVE) * TOP))

    const draw = () => {
      // Glow: one pixel per cell, scaled + blurred by CSS
      const px = glowImage.data
      for (let i = 0; i < heat.length; i++) {
        const level = levelOf(heat[i])
        const [r, g, b] = PALETTE[level]
        const o = i * 4
        px[o] = r
        px[o + 1] = g
        px[o + 2] = b
        px[o + 3] = level < 3 ? 0 : Math.min(255, level * 9)
      }
      glow.putImageData(glowImage, 0, 0)

      // ASCII flames
      ctx.clearRect(0, 0, width, height)
      ctx.font = FONT
      ctx.textBaseline = 'top'
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const level = levelOf(heat[y * cols + x])
          if (level < 2) continue
          ctx.fillStyle = CHAR_COLORS[level]
          ctx.fillText(RAMP[Math.floor((level / (TOP + 1)) * RAMP.length)], x * CELL_W, y * CELL_H)
        }
      }
    }

    const clear = () => {
      ctx.clearRect(0, 0, width, height)
      glow.clearRect(0, 0, cols, rows)
    }

    const loop = (time) => {
      raf = requestAnimationFrame(loop)
      if (time - last < 1000 / FPS) return
      last = time
      const alive = step()
      draw()
      // Burned out and no longer hovered: stop until the next hover
      if (!alive && !activeRef.current) {
        cancelAnimationFrame(raf)
        raf = null
        clear()
      }
    }

    const wake = () => {
      if (reduceMotion) {
        // A single still frame of fully grown flames instead of an animation
        for (let i = 0; i < rows * 2; i++) step()
        draw()
        return
      }
      if (!raf) raf = requestAnimationFrame(loop)
    }
    wakeRef.current = { wake, clear }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      wakeRef.current = null
    }
  }, [])

  useEffect(() => {
    activeRef.current = active
    if (active) {
      wakeRef.current?.wake()
    } else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      wakeRef.current?.clear()
    }
  }, [active])

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      {/* Smoky dark base so the flames read as light; fades with the hover */}
      <div
        className={`absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/10 transition-opacity duration-500 ${
          active ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Heat glow: tiny canvas stretched to the card and blurred */}
      <canvas
        ref={glowRef}
        className="absolute inset-0 h-full w-full opacity-70 blur-xl mix-blend-screen"
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
