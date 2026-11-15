// Hover option: Typewriter quote — the cover darkens and a well-attested
// philosophical quotation types itself out in a classical serif with a
// blinking caret, then the author and source fade in. Each hover shows the
// next quote in the list.
import { makeCanvasHover, rgba, clamp01 } from '../../../lib/canvasHover'

const GOLD = [233, 216, 166]
const RED = [228, 87, 61]
const CHARS_PER_SECOND = 30

// Only quotations with a clear, checkable source
const QUOTES = [
  ['The unexamined life is not worth living.', 'Socrates', 'Plato, Apology 38a'],
  ['I think, therefore I am.', 'René Descartes', 'Discourse on the Method, 1637'],
  ['Whereof one cannot speak, thereof one must be silent.', 'Ludwig Wittgenstein', 'Tractatus, 1921'],
  ['He who has a why to live can bear almost any how.', 'Friedrich Nietzsche', 'Twilight of the Idols, 1889'],
  ['One is not born, but rather becomes, a woman.', 'Simone de Beauvoir', 'The Second Sex, 1949'],
  ['Man is condemned to be free.', 'Jean-Paul Sartre', 'Existentialism Is a Humanism, 1946'],
]

let nextQuote = 0 // shared across cards and hovers: each hover moves on to the next quote

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

export default makeCanvasHover({
  fadeOut: 0.09,
  staticTime: 20, // reduced motion: the full quote at once
  createState: () => ({ quote: null }),
  render(ctx, s) {
    const c = s.custom
    if (!c.quote) {
      c.quote = QUOTES[nextQuote % QUOTES.length]
      nextQuote++
    }
    const [text, author, source] = c.quote
    const a = s.amount
    const W = s.width
    const H = s.height

    ctx.fillStyle = `rgba(10,9,8,${0.84 * a})`
    ctx.fillRect(0, 0, W, H)

    const size = Math.round(W * 0.07)
    ctx.font = `italic 500 ${size}px "EB Garamond", "Playfair Display", Georgia, serif`
    const lines = wrap(ctx, `“${text}”`, W * 0.8)
    const lineHeight = size * 1.25
    const blockTop = H * 0.45 - (lines.length * lineHeight) / 2

    // Type it out character by character
    let remaining = Math.floor(s.time * CHARS_PER_SECOND)
    const total = lines.reduce((n, l) => n + l.length, 0)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    let caret = null
    lines.forEach((line, i) => {
      const visible = line.slice(0, Math.max(0, remaining))
      remaining -= line.length
      const width = ctx.measureText(line).width
      const x = (W - width) / 2
      const y = blockTop + i * lineHeight
      ctx.fillStyle = rgba(GOLD, a)
      ctx.fillText(visible, x, y)
      if (visible.length < line.length && !caret) caret = [x + ctx.measureText(visible).width, y]
    })
    const typed = s.time * CHARS_PER_SECOND >= total
    if (!caret) {
      const last = lines[lines.length - 1]
      caret = [(W + ctx.measureText(last).width) / 2, blockTop + (lines.length - 1) * lineHeight]
    }
    if (!typed || Math.sin(s.time * 6) > 0) {
      ctx.fillStyle = rgba(RED, a)
      ctx.fillRect(caret[0] + 3, caret[1] - size * 0.45, 2, size * 0.9)
    }

    // Author + source fade in once the quote is complete
    const after = clamp01((s.time - total / CHARS_PER_SECOND - 0.2) / 0.6)
    if (after > 0) {
      const y = blockTop + lines.length * lineHeight + size * 0.4
      ctx.textAlign = 'center'
      ctx.font = `600 ${Math.round(size * 0.42)}px Cinzel, Georgia, serif`
      ctx.fillStyle = rgba(GOLD, 0.95 * after * a)
      ctx.fillText(`— ${author.toUpperCase()}`, W / 2, y)
      ctx.font = '600 10px ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace'
      ctx.fillStyle = rgba(GOLD, 0.5 * after * a)
      ctx.fillText(source.toUpperCase(), W / 2, y + size * 0.55)
    }
  },
})
