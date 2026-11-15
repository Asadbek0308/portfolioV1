// Hover option: a small board fades in and plays the four-move Scholar's Mate
// by itself (1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#). The last move flashes
// "Checkmate" and the black king tips over, then the game starts again.
import { makeCanvasHover, rgba, drawPiece, easeInOut, clamp01, LIGHT, DARK, AMBER } from '../../../lib/canvasHover'

const START = [
  'rnbqkbnr',
  'pppppppp',
  '........',
  '........',
  '........',
  '........',
  'PPPPPPPP',
  'RNBQKBNR',
]
const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const MOVES = [
  ['e2', 'e4', 'e4'],
  ['e7', 'e5', 'e5'],
  ['f1', 'c4', 'Bc4'],
  ['b8', 'c6', 'Nc6'],
  ['d1', 'h5', 'Qh5'],
  ['g8', 'f6', 'Nf6??'],
  ['h5', 'f7', 'Qxf7#'],
]
const MOVE_TIME = 0.95 // seconds per move (slide + pause)
const SLIDE = 0.5
const MATE_TIME = 2.4 // how long the final position is held
const CYCLE = MOVES.length * MOVE_TIME + MATE_TIME

const toRC = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97] // 'e2' -> [row, col]

export default makeCanvasHover({
  staticTime: MOVES.length * MOVE_TIME + 1.5, // reduced motion: show the mating position
  render(ctx, s) {
    const a = s.amount
    const t = s.time % CYCLE
    const boardSize = Math.min(s.width, s.height) * 0.72
    const sq = boardSize / 8
    const ox = (s.width - boardSize) / 2
    const oy = (s.height - boardSize) / 2 - sq * 0.4

    ctx.fillStyle = `rgba(10,10,10,${0.65 * a})`
    ctx.fillRect(0, 0, s.width, s.height)

    // Replay the game up to the current moment
    const board = START.map((row) => row.split(''))
    const done = Math.min(MOVES.length, Math.floor(t / MOVE_TIME))
    for (let m = 0; m < done; m++) {
      const [fr, fc] = toRC(MOVES[m][0])
      const [tr, tc] = toRC(MOVES[m][1])
      board[tr][tc] = board[fr][fc]
      board[fr][fc] = '.'
    }
    const moving = done < MOVES.length ? MOVES[done] : null
    const slide = moving ? easeInOut(clamp01((t - done * MOVE_TIME) / SLIDE)) : 0
    const highlight = moving && slide > 0 ? moving : MOVES[done - 1]

    // Board with last-move highlight
    ctx.save()
    ctx.globalAlpha = a
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 24
    ctx.fillStyle = '#2a1d12'
    ctx.fillRect(ox - 6, oy - 6, boardSize + 12, boardSize + 12)
    ctx.shadowColor = 'transparent'
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = rgba((r + c) % 2 ? DARK : LIGHT, 1)
        ctx.fillRect(ox + c * sq, oy + r * sq, sq, sq)
      }
    }
    if (highlight) {
      for (const square of highlight.slice(0, 2)) {
        const [r, c] = toRC(square)
        ctx.fillStyle = 'rgba(246,246,105,0.55)'
        ctx.fillRect(ox + c * sq, oy + r * sq, sq, sq)
      }
    }
    ctx.restore()

    // Pieces (the moving one is drawn separately, on top)
    const [mfr, mfc] = moving ? toRC(moving[0]) : [-1, -1]
    const mateProgress = done === MOVES.length ? clamp01((t - MOVES.length * MOVE_TIME) / 0.6) : 0
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (p === '.' || (r === mfr && c === mfc && slide > 0)) continue
        const white = p === p.toUpperCase()
        const isMatedKing = p === 'k' && mateProgress > 0
        drawPiece(ctx, GLYPH[p.toLowerCase()], ox + (c + 0.5) * sq, oy + (r + 0.55) * sq, sq * 0.82, {
          white,
          alpha: a,
          rotate: isMatedKing ? easeInOut(mateProgress) * 1.35 : 0,
        })
      }
    }
    if (moving && slide > 0) {
      const [tr, tc] = toRC(moving[1])
      const p = board[mfr][mfc]
      const x = ox + (mfc + (tc - mfc) * slide + 0.5) * sq
      const y = oy + (mfr + (tr - mfr) * slide + 0.55) * sq
      drawPiece(ctx, GLYPH[p.toLowerCase()], x, y, sq * 0.9, { white: p === p.toUpperCase(), alpha: a })
    }

    // Move list under the board
    const shown = MOVES.slice(0, done + (slide > 0.5 ? 1 : 0))
    const text = shown
      .map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}.${m[2]}` : m[2]))
      .join(' ')
    ctx.font = '600 12px ui-monospace, Menlo, Consolas, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = rgba(LIGHT, 0.85 * a)
    ctx.fillText(text || 'Scholar’s Mate', s.width / 2, oy + boardSize + 16)

    if (mateProgress > 0) {
      ctx.font = `800 ${Math.round(sq * 0.7)}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillStyle = rgba(AMBER, a * mateProgress)
      ctx.textBaseline = 'bottom'
      ctx.fillText('CHECKMATE', s.width / 2, oy - 12)
    }
  },
})
