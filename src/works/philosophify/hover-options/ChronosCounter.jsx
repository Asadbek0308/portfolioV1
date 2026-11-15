// Hover option: Chronos counter — a big year counter rolls from 600 BC to
// 2014 AD (the span of Philosophify's timeline) while a ruler of years slides
// past underneath and milestones flash up as the counter crosses them.
import { makeCanvasHover, rgba, clamp01, easeInOut } from '../../../lib/canvasHover'

const GOLD = [233, 216, 166]
const RED = [228, 87, 61]
const SERIF = 'Cinzel, "Playfair Display", Georgia, "Times New Roman", serif'
const FIRST = -600
const LAST = 2014
const RUN = 3.6 // seconds to roll through all of history
const HOLD = 1.6 // seconds holding on 2014 before starting again
const PX_PER_YEAR = 0.9 // ruler scale

// Dates from standard references ("c." = scholarly estimate)
const MILESTONES = [
  [-585, 'Thales predicts an eclipse', true],
  [-399, 'Trial of Socrates'],
  [-387, 'Plato founds the Academy', true],
  [-335, 'Aristotle opens the Lyceum', true],
  [1027, 'Avicenna completes The Book of Healing', true],
  [1265, 'Aquinas begins the Summa Theologiae'],
  [1637, "Descartes' Discourse on the Method"],
  [1781, "Kant's Critique of Pure Reason"],
  [1859, "Mill's On Liberty"],
  [1883, 'Thus Spoke Zarathustra'],
  [1921, "Wittgenstein's Tractatus"],
  [1943, 'Being and Nothingness'],
  [1949, 'The Second Sex'],
  [1971, 'A Theory of Justice'],
]

// There is no year 0: 1 BC is followed by 1 AD
const yearLabel = (y) => (y < 0 ? `${-y} BC` : `${Math.max(1, y)} AD`)

export default makeCanvasHover({
  staticTime: RUN + 0.5,
  render(ctx, s) {
    const a = s.amount
    const W = s.width
    const H = s.height
    const t = s.time % (RUN + HOLD)
    const p = easeInOut(clamp01(t / RUN))
    const year = Math.round(FIRST + (LAST - FIRST) * p)

    ctx.fillStyle = `rgba(8,8,10,${0.82 * a})`
    ctx.fillRect(0, 0, W, H)

    // The counter
    const cy = H * 0.42
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${Math.round(W * 0.16)}px ${SERIF}`
    ctx.fillStyle = rgba(GOLD, a)
    ctx.fillText(yearLabel(year), W / 2, cy)
    ctx.font = '600 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
    ctx.fillStyle = rgba(GOLD, 0.5 * a)
    ctx.fillText('CHRONOS · 600 BC → 2014 AD', W / 2, cy - W * 0.13)

    // Latest milestone passed, fading out over ~1 second of counting
    const passed = MILESTONES.filter(([y]) => y <= year)
    const latest = passed[passed.length - 1]
    if (latest) {
      const sinceYears = year - latest[0]
      const fade = p >= 1 ? 1 : clamp01(1 - sinceYears / 160)
      if (fade > 0) {
        ctx.font = `italic 400 ${Math.round(W * 0.038)}px "EB Garamond", Georgia, serif`
        ctx.fillStyle = rgba(GOLD, 0.9 * fade * a)
        ctx.fillText(`${latest[2] ? 'c. ' : ''}${yearLabel(latest[0])} — ${latest[1]}`, W / 2, cy + W * 0.12)
      }
    }

    // Ruler of years sliding past a fixed centre needle
    const ry = H * 0.72
    ctx.strokeStyle = rgba(GOLD, 0.3 * a)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.max(0, W / 2 + (FIRST - year) * PX_PER_YEAR), ry)
    ctx.lineTo(Math.min(W, W / 2 + (LAST - year) * PX_PER_YEAR), ry)
    ctx.stroke()
    // only draw the span the timeline actually covers
    const from = Math.max(FIRST, Math.floor((year - W / 2 / PX_PER_YEAR) / 50) * 50)
    const to = Math.min(LAST, year + W / 2 / PX_PER_YEAR)
    ctx.font = '600 9px ui-monospace, Menlo, Consolas, monospace'
    for (let y = from; y <= to; y += 50) {
      const x = W / 2 + (y - year) * PX_PER_YEAR
      const major = y % 200 === 0
      ctx.strokeStyle = rgba(GOLD, (major ? 0.6 : 0.25) * a)
      ctx.beginPath()
      ctx.moveTo(x, ry)
      ctx.lineTo(x, ry + (major ? 12 : 6))
      ctx.stroke()
      if (major) {
        ctx.fillStyle = rgba(GOLD, 0.5 * a)
        ctx.fillText(yearLabel(y === 0 ? 1 : y), x, ry + 22)
      }
    }
    // Milestone dots on the ruler
    for (const [y] of MILESTONES) {
      const x = W / 2 + (y - year) * PX_PER_YEAR
      if (x < -10 || x > W + 10) continue
      ctx.fillStyle = rgba(y <= year ? RED : GOLD, (y <= year ? 0.95 : 0.4) * a)
      ctx.beginPath()
      ctx.arc(x, ry, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
    // Needle
    ctx.strokeStyle = rgba(RED, a)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(W / 2, ry - 16)
    ctx.lineTo(W / 2, ry + 16)
    ctx.stroke()

    // Overall progress bar
    ctx.fillStyle = rgba(GOLD, 0.12 * a)
    ctx.fillRect(24, H - 28, W - 48, 3)
    ctx.fillStyle = rgba(RED, 0.9 * a)
    ctx.fillRect(24, H - 28, (W - 48) * p, 3)
  },
})
