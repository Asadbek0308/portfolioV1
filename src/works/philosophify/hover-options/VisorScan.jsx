// Hover option: Visor scan — a red laser line, the colour of the visor on the
// cover, sweeps down the card. Behind it the engraving turns into a blueprint
// grid with HUD corner brackets and readouts about a different philosopher on
// each pass, plus a targeting reticle that follows the cursor.
import { makeCanvasHover, rgba, clamp01, easeInOut } from '../../../lib/canvasHover'

const RED = [228, 87, 61]
const CYAN = [140, 210, 255]
const MONO = '600 11px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
const SWEEP = 1.6 // seconds per pass from top to bottom
const HOLD = 1.2 // seconds the finished scan is held before the next subject

const SUBJECTS = [
  ['PLATO', 'c. 428–348 BC', 'ATHENS', 'THE REPUBLIC'],
  ['SOCRATES', 'c. 470–399 BC', 'ATHENS', 'APOLOGY (via Plato)'],
  ['ARISTOTLE', '384–322 BC', 'STAGIRA', 'NICOMACHEAN ETHICS'],
  ['CONFUCIUS', '551–479 BC', 'LU, CHINA', 'ANALECTS'],
  ['HYPATIA', 'c. 355–415 AD', 'ALEXANDRIA', 'MATHEMATICS'],
  ['KANT', '1724–1804', 'KÖNIGSBERG', 'CRITIQUE OF PURE REASON'],
]

function bracket(ctx, x, y, dx, dy, len) {
  ctx.beginPath()
  ctx.moveTo(x + dx * len, y)
  ctx.lineTo(x, y)
  ctx.lineTo(x, y + dy * len)
  ctx.stroke()
}

export default makeCanvasHover({
  staticTime: SWEEP + 0.5,
  render(ctx, s) {
    const a = s.amount
    const W = s.width
    const H = s.height
    const cycle = SWEEP + HOLD
    const pass = Math.floor(s.time / cycle)
    const local = s.time - pass * cycle
    const scanned = easeInOut(clamp01(local / SWEEP)) // 0..1 share of the card scanned
    const lineY = scanned * H
    const [name, era, place, work] = SUBJECTS[pass % SUBJECTS.length]

    // Scanned region: blueprint tint + grid
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, W, lineY)
    ctx.clip()
    ctx.fillStyle = `rgba(8,22,48,${0.72 * a})`
    ctx.fillRect(0, 0, W, H)
    for (let x = 0; x <= W; x += 16) {
      ctx.strokeStyle = rgba(CYAN, (x % 80 === 0 ? 0.28 : 0.1) * a)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + 0.5, 0)
      ctx.lineTo(x + 0.5, H)
      ctx.stroke()
    }
    for (let y = 0; y <= H; y += 16) {
      ctx.strokeStyle = rgba(CYAN, (y % 80 === 0 ? 0.28 : 0.1) * a)
      ctx.beginPath()
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(W, y + 0.5)
      ctx.stroke()
    }
    ctx.restore()

    // The laser line
    if (scanned < 1) {
      const band = ctx.createLinearGradient(0, lineY - 40, 0, lineY + 6)
      band.addColorStop(0, rgba(RED, 0))
      band.addColorStop(1, rgba(RED, 0.35 * a))
      ctx.fillStyle = band
      ctx.fillRect(0, lineY - 40, W, 46)
      ctx.save()
      ctx.shadowColor = rgba(RED, a)
      ctx.shadowBlur = 14
      ctx.fillStyle = rgba([255, 140, 110], a)
      ctx.fillRect(0, lineY - 1, W, 2)
      ctx.restore()
    }

    // HUD corner brackets close in as the hover starts
    const inset = 14 + (1 - a) * 20
    ctx.strokeStyle = rgba(CYAN, 0.85 * a)
    ctx.lineWidth = 2
    bracket(ctx, inset, inset, 1, 1, 22)
    bracket(ctx, W - inset, inset, -1, 1, 22)
    bracket(ctx, inset, H - inset, 1, -1, 22)
    bracket(ctx, W - inset, H - inset, -1, -1, 22)

    // Readouts: header always, subject lines appear as the laser passes them
    ctx.font = MONO
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    const blink = Math.sin(s.time * 8) > 0 ? 1 : 0.35
    ctx.fillStyle = rgba(RED, a * blink)
    ctx.beginPath()
    ctx.arc(inset + 16, inset + 20, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = rgba(CYAN, 0.9 * a)
    ctx.fillText(scanned < 1 ? 'NEURAL VISOR · SCANNING' : 'NEURAL VISOR · MATCH FOUND', inset + 26, inset + 14)

    const lines = [`SUBJECT  ${name}`, `ERA      ${era}`, `ORIGIN   ${place}`, `KNOWN    ${work}`]
    const baseY = H - inset - 24 - lines.length * 16
    lines.forEach((text, i) => {
      const y = baseY + i * 16
      if (lineY < y) return
      ctx.fillStyle = rgba(i === 0 ? [255, 236, 220] : CYAN, (i === 0 ? 1 : 0.8) * a)
      ctx.fillText(text, inset + 16, y)
    })

    // Targeting reticle on the cursor
    if (s.pointer.known) {
      const { x, y } = s.pointer
      const spin = s.time * 1.5
      ctx.strokeStyle = rgba(RED, 0.9 * a)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, y, 16, spin, spin + Math.PI * 1.4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x - 26, y)
      ctx.lineTo(x - 8, y)
      ctx.moveTo(x + 8, y)
      ctx.lineTo(x + 26, y)
      ctx.moveTo(x, y - 26)
      ctx.lineTo(x, y - 8)
      ctx.moveTo(x, y + 8)
      ctx.lineTo(x, y + 26)
      ctx.stroke()
      ctx.font = '600 10px ui-monospace, Menlo, Consolas, monospace'
      ctx.fillStyle = rgba(RED, 0.9 * a)
      ctx.fillText(`${Math.round(x)}, ${Math.round(y)}`, x + 20, y + 18)
    }
  },
})
