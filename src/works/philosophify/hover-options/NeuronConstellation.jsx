// Hover option: Neuron constellation — thinkers appear as glowing nodes and
// lines of influence draw themselves between them, like Philosophify's Neuron
// Map. Nodes near the cursor brighten and link to it, as if the visitor were
// the newest idea joining the network.
import { makeCanvasHover, rgba, clamp01, easeInOut } from '../../../lib/canvasHover'

const GOLD = [233, 216, 166]
const RED = [228, 87, 61] // the visor red from the cover
const SERIF = 'Cinzel, "EB Garamond", Georgia, "Times New Roman", serif'
const CURSOR_REACH = 0.32 // cursor links to nodes within this share of the card width

const THINKERS = [
  'Socrates', 'Plato', 'Aristotle', 'Confucius', 'Avicenna', 'Aquinas', 'Descartes', 'Spinoza',
  'Locke', 'Hume', 'Rousseau', 'Kant', 'Hegel', 'Kierkegaard', 'Marx', 'Nietzsche', 'Wittgenstein', 'Sartre',
]
// Who influenced whom (teacher/reader → student/respondent)
const LINKS = [
  ['Socrates', 'Plato'], ['Plato', 'Aristotle'], ['Aristotle', 'Avicenna'], ['Aristotle', 'Aquinas'],
  ['Avicenna', 'Aquinas'], ['Descartes', 'Spinoza'], ['Descartes', 'Locke'], ['Locke', 'Hume'],
  ['Hume', 'Kant'], ['Rousseau', 'Kant'], ['Kant', 'Hegel'], ['Hegel', 'Marx'], ['Hegel', 'Kierkegaard'],
  ['Kierkegaard', 'Sartre'], ['Kant', 'Nietzsche'], ['Nietzsche', 'Sartre'], ['Kant', 'Wittgenstein'],
  ['Plato', 'Descartes'],
]

// Small seeded random generator so the layout is the same on every hover
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Spread the nodes out: keep the candidate farthest from the nodes already placed
function layout(width, height) {
  const rand = mulberry32(42)
  const nodes = []
  for (const name of THINKERS) {
    let best = null
    let bestDist = -1
    for (let attempt = 0; attempt < 30; attempt++) {
      const x = width * (0.1 + rand() * 0.8)
      const y = height * (0.1 + rand() * 0.78)
      const d = nodes.reduce((m, n) => Math.min(m, Math.hypot(n.x - x, n.y - y)), Infinity)
      if (d > bestDist) {
        bestDist = d
        best = { x, y }
      }
    }
    nodes.push({ name, ...best, phase: rand() * Math.PI * 2, delay: rand() * 0.6 })
  }
  return nodes
}

export default makeCanvasHover({
  fadeOut: 0.08,
  staticTime: 3,
  createState: () => ({ nodes: null, size: '' }),
  render(ctx, s) {
    const c = s.custom
    const key = `${Math.round(s.width)}x${Math.round(s.height)}`
    if (c.size !== key) {
      c.nodes = layout(s.width, s.height)
      c.size = key
    }
    const a = s.amount
    const byName = Object.fromEntries(c.nodes.map((n) => [n.name, n]))

    // Night-sky wash with a soft vignette
    const wash = ctx.createRadialGradient(s.width / 2, s.height / 2, 0, s.width / 2, s.height / 2, Math.max(s.width, s.height) * 0.75)
    wash.addColorStop(0, `rgba(14,16,24,${0.8 * a})`)
    wash.addColorStop(1, `rgba(4,5,9,${0.94 * a})`)
    ctx.fillStyle = wash
    ctx.fillRect(0, 0, s.width, s.height)

    // Gentle drift so the network feels alive
    const pos = (n) => [n.x + Math.sin(s.time * 0.6 + n.phase) * 4, n.y + Math.cos(s.time * 0.5 + n.phase) * 4]
    const appear = (n) => easeInOut(clamp01((s.time - n.delay) / 0.5))

    // Influence lines draw themselves from source to target
    ctx.lineWidth = 1
    LINKS.forEach(([from, to], i) => {
      const A = byName[from]
      const B = byName[to]
      const grow = easeInOut(clamp01((s.time - 0.4 - i * 0.07) / 0.6))
      if (grow <= 0) return
      const [x1, y1] = pos(A)
      const [x2, y2] = pos(B)
      ctx.strokeStyle = rgba(GOLD, 0.35 * a)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x1 + (x2 - x1) * grow, y1 + (y2 - y1) * grow)
      ctx.stroke()
    })

    // Cursor joins the network
    const reach = s.width * CURSOR_REACH
    const near = new Map()
    if (s.pointer.known) {
      for (const n of c.nodes) {
        const [x, y] = pos(n)
        const d = Math.hypot(x - s.pointer.x, y - s.pointer.y)
        if (d < reach) near.set(n.name, 1 - d / reach)
      }
      for (const n of c.nodes) {
        const strength = near.get(n.name)
        if (!strength) continue
        const [x, y] = pos(n)
        ctx.strokeStyle = rgba(RED, 0.75 * strength * a)
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(s.pointer.x, s.pointer.y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      const glow = ctx.createRadialGradient(s.pointer.x, s.pointer.y, 0, s.pointer.x, s.pointer.y, 18)
      glow.addColorStop(0, rgba(RED, 0.9 * a))
      glow.addColorStop(1, rgba(RED, 0))
      ctx.fillStyle = glow
      ctx.fillRect(s.pointer.x - 18, s.pointer.y - 18, 36, 36)
    }

    // Nodes + names
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const n of c.nodes) {
      const show = appear(n) * a
      if (show <= 0) continue
      const [x, y] = pos(n)
      const lit = near.get(n.name) || 0
      const r = 3 + lit * 3
      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 5)
      halo.addColorStop(0, rgba(lit ? RED : GOLD, 0.5 * show))
      halo.addColorStop(1, rgba(GOLD, 0))
      ctx.fillStyle = halo
      ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10)
      ctx.fillStyle = rgba(lit > 0.4 ? [255, 236, 220] : GOLD, show)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = `${lit > 0.4 ? 600 : 400} ${lit > 0.4 ? 12 : 11}px ${SERIF}`
      ctx.fillStyle = rgba(GOLD, (0.55 + lit * 0.45) * show)
      ctx.fillText(n.name.toUpperCase(), x, y + 8)
    }
  },
})
