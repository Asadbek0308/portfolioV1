// Hover option: ASCII chess — chess symbols and moves in algebraic notation
// (e4, Nf3, O-O, Qxf7#…) drift up the card in amber monospace and fade out,
// in the same spirit as Philosophify's ASCII fire.
import { makeCanvasHover, rgba, SYMBOL_FONT } from '../../../lib/canvasHover'

const SYMBOLS = ['♞', '♛', '♜', '♝', '♟', '♚', '♘', '♕', '♖', '♗']
const MOVES = ['e4', 'Nf3', 'O-O', 'Qxf7#', 'exd5', 'Bb5+', 'c4', 'Nxe5', 'O-O-O', 'Rxe8+', 'g4!?', 'Kh1', 'd4', 'Bxh7+', '1-0', '½-½']
const SPAWN_PER_SECOND = 16
const MAX_PARTICLES = 90

const PALETTE = [
  [255, 214, 120],
  [246, 190, 80],
  [235, 150, 60],
  [255, 240, 200],
]

function spawn(s) {
  const symbol = Math.random() < 0.55
  return {
    text: symbol
      ? SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      : MOVES[Math.floor(Math.random() * MOVES.length)],
    symbol,
    x: Math.random() * s.width,
    y: s.height + 20,
    speed: 35 + Math.random() * 55, // px per second upwards
    size: symbol ? 16 + Math.random() * 22 : 11 + Math.random() * 6,
    sway: Math.random() * Math.PI * 2,
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
  }
}

export default makeCanvasHover({
  fadeOut: 0.07,
  staticTime: 0,
  createState: () => ({ particles: [], debt: 0, warm: false }),
  render(ctx, s, dt, on) {
    const c = s.custom
    const a = s.amount

    // Start with the card already partly filled, so the effect is visible at once
    if (!c.warm) {
      c.warm = true
      for (let i = 0; i < 40; i++) {
        const p = spawn(s)
        p.y = s.height * (0.35 + Math.random() * 0.65)
        c.particles.push(p)
      }
    }
    if (on) {
      c.debt += dt * SPAWN_PER_SECOND
      while (c.debt >= 1 && c.particles.length < MAX_PARTICLES) {
        c.particles.push(spawn(s))
        c.debt -= 1
      }
    }

    const wash = ctx.createLinearGradient(0, s.height, 0, 0)
    wash.addColorStop(0, `rgba(8,6,4,${0.88 * a})`)
    wash.addColorStop(1, `rgba(8,6,4,${0.45 * a})`)
    ctx.fillStyle = wash
    ctx.fillRect(0, 0, s.width, s.height)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    c.particles = c.particles.filter((p) => {
      p.y -= p.speed * dt
      p.sway += dt * 1.6
      const height = 1 - p.y / s.height // 0 at the bottom, 1 at the top
      const life = Math.max(0, 1 - Math.max(0, height - 0.35) / 0.5) // fade in the upper half
      if (life <= 0 || p.y < -30) return false
      const x = p.x + Math.sin(p.sway) * 8
      ctx.font = p.symbol
        ? `${Math.round(p.size)}px ${SYMBOL_FONT}`
        : `700 ${Math.round(p.size)}px ui-monospace, Menlo, Consolas, monospace`
      ctx.fillStyle = rgba(p.color, life * a)
      ctx.fillText(p.text, x, p.y)
      return true
    })
  },
})
