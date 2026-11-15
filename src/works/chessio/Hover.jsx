// Work page hover effect for Chessio: the card turns into a chessboard and the
// cursor becomes a knight. The square under it lights up and glowing dots mark
// every square the knight could jump to, following the cursor as it moves.
// Everything is drawn on one canvas; the loop only runs while hovered or
// while fading out, then stops completely.
import { useEffect, useRef } from 'react'

const FILES = 8 // the card is always exactly 8 squares wide, like a real board
const KNIGHT_JUMPS = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
]
const LIGHT = [240, 217, 181] // Chessio's Classic Wood light square
const DARK = [181, 136, 99] //   ...and dark square
const DOT = [246, 225, 160]
const HIGHLIGHT = [246, 246, 105] // last-move yellow, like the app
const FOLLOW = 0.25 // how quickly the knight glides to the cursor (0–1 per frame)
const FADE = 0.12 // how quickly board, dots and highlight fade in/out (0–1 per frame)

const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`
const approach = (value, target, rate) => {
  const next = value + (target - value) * rate
  return Math.abs(next - target) < 0.005 ? target : next
}

export default function ChessioHover({ active }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const activeRef = useRef(active)
  const wakeRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const card = root?.parentElement
    if (!canvas || !card) return
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let size = 0 // square size in px
    let rows = 0
    let raf = null

    // Animated state (all plain numbers: no React re-renders)
    const pointer = { x: 0, y: 0, known: false }
    const knight = { x: 0, y: 0 }
    let board = 0 // 0..1 board opacity
    const dots = new Map() // "col,row" -> 0..1 visibility
    let square = null // [col, row] under the knight

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      size = width / FILES
      rows = Math.max(1, Math.ceil(height / size))
    }

    const onPointerMove = (e) => {
      const rect = card.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      if (!pointer.known) {
        // first sighting: place the knight right under the cursor, no glide
        knight.x = pointer.x
        knight.y = pointer.y
        pointer.known = true
      }
      wake()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (board <= 0) return

      // Board squares + a dark wash so the board reads over the card
      ctx.fillStyle = `rgba(10,10,10,${0.55 * board})`
      ctx.fillRect(0, 0, width, height)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < FILES; c++) {
          ctx.fillStyle = rgba((c + r) % 2 === 0 ? LIGHT : DARK, 0.22 * board)
          ctx.fillRect(c * size, r * size, size, size)
        }
      }

      // Square under the knight
      if (square) {
        ctx.fillStyle = rgba(HIGHLIGHT, 0.35 * board)
        ctx.fillRect(square[0] * size, square[1] * size, size, size)
      }

      // Legal knight moves: glowing dots that grow/shrink as they appear/leave
      for (const [key, amount] of dots) {
        if (amount <= 0) continue
        const [c, r] = key.split(',').map(Number)
        const cx = (c + 0.5) * size
        const cy = (r + 0.5) * size
        const radius = size * 0.16 * amount
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3)
        glow.addColorStop(0, rgba(DOT, 0.45 * amount * board))
        glow.addColorStop(1, rgba(DOT, 0))
        ctx.fillStyle = glow
        ctx.fillRect(cx - radius * 3, cy - radius * 3, radius * 6, radius * 6)
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fillStyle = rgba(DOT, 0.95 * amount * board)
        ctx.fill()
      }

      // The knight itself, following the cursor
      ctx.save()
      ctx.globalAlpha = board
      ctx.font = `${Math.round(size * 0.9)}px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = 12
      ctx.shadowOffsetY = 4
      ctx.lineWidth = 3
      ctx.strokeStyle = '#111'
      ctx.strokeText('♞', knight.x, knight.y)
      ctx.shadowColor = 'transparent'
      ctx.fillStyle = '#fafafa'
      ctx.fillText('♞', knight.x, knight.y)
      ctx.restore()
    }

    const frame = () => {
      const on = activeRef.current
      const rate = reduceMotion ? 1 : FADE

      // Keyboard focus (no pointer yet): park the knight in the middle
      if (on && !pointer.known) {
        pointer.x = knight.x = width / 2
        pointer.y = knight.y = height / 2
        pointer.known = true
      }

      board = approach(board, on ? 1 : 0, rate)
      knight.x = reduceMotion ? pointer.x : approach(knight.x, pointer.x, FOLLOW)
      knight.y = reduceMotion ? pointer.y : approach(knight.y, pointer.y, FOLLOW)

      const col = Math.min(FILES - 1, Math.max(0, Math.floor(knight.x / size)))
      const row = Math.min(rows - 1, Math.max(0, Math.floor(knight.y / size)))
      square = [col, row]

      // Target set of dots for the current square
      const targets = new Set()
      if (on) {
        for (const [dc, dr] of KNIGHT_JUMPS) {
          const c = col + dc
          const r = row + dr
          if (c >= 0 && c < FILES && r >= 0 && r < rows) targets.add(`${c},${r}`)
        }
      }
      for (const key of targets) if (!dots.has(key)) dots.set(key, 0)
      let dotsMoving = false
      for (const [key, amount] of dots) {
        const next = approach(amount, targets.has(key) ? 1 : 0, reduceMotion ? 1 : 0.22)
        if (next === 0 && !targets.has(key)) dots.delete(key)
        else dots.set(key, next)
        if (next !== (targets.has(key) ? 1 : 0)) dotsMoving = true
      }

      draw()

      const settled =
        board === (on ? 1 : 0) && knight.x === pointer.x && knight.y === pointer.y && !dotsMoving
      // Nothing left to animate: stop until the pointer moves or the hover changes
      if (settled) {
        raf = null
        if (!on) {
          pointer.known = false
          dots.clear()
        }
        return
      }
      raf = requestAnimationFrame(frame)
    }

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    // Called when the hover changes: the knight replaces the mouse pointer on the card
    wakeRef.current = (on) => {
      card.style.cursor = on ? 'none' : ''
      wake()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    card.addEventListener('pointermove', onPointerMove)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      card.removeEventListener('pointermove', onPointerMove)
      card.style.cursor = ''
      wakeRef.current = null
    }
  }, [])

  useEffect(() => {
    activeRef.current = active
    wakeRef.current?.(active)
  }, [active])

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
