import React, { useEffect, useRef } from "react"
import { gsap } from "gsap"

export default function Curtains() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")

    let width = (canvas.width = container.clientWidth)
    let height = (canvas.height = container.clientHeight)

    // Source code snippet text
    const codeSnippet = `if (rafID) cancelAnimationFrame(rafID); const input = main.toString(); const { width, height } = gridW, gridH; const gravity = 0.4, damping = 0.95; const charCanvases = {}; const fontSize = 12; for (const ch of new Set(input)) { if (ch === " ") continue; const off = document.createElement("canvas"); const octx = off.getContext("2d"); }`

    // PERFORMANCE OPTIMIZATION TUNING
    const numStrings = 44 
    const segmentsPerString = 22
    const gravity = 0.45
    const friction = 0.93

    // Pre-render glyph sprite sheet for hardware acceleration
    const glyphCache = {}
    const fontSpec = "bold 13px Courier, 'Courier New', monospace"
    const uniqueChars = Array.from(new Set(codeSnippet))

    uniqueChars.forEach((char) => {
      const offCanvas = document.createElement("canvas")
      offCanvas.width = 16
      offCanvas.height = 16
      const octx = offCanvas.getContext("2d")
      octx.font = fontSpec
      octx.fillStyle = "#2d2824"
      octx.textAlign = "center"
      octx.textBaseline = "middle"
      octx.fillText(char, 8, 8)
      glyphCache[char] = offCanvas
    })

    const mouse = {
      x: -1000,
      y: -1000,
      oldX: -1000,
      oldY: -1000,
      vx: 0,
      vy: 0,
    }

    let strings = []

    const initStrings = () => {
      strings = []
      
      const margin = 40
      const availableWidth = width - margin * 2
      const topOffset = 20 // Hangs right from top edge

      const spacing = availableWidth / (numStrings - 1)
      let codeIndex = 0

      for (let i = 0; i < numStrings; i++) {
        const anchorX = margin + spacing * i
        const points = []
        const segHeight = (height * 0.82) / segmentsPerString

        for (let j = 0; j < segmentsPerString; j++) {
          const y = topOffset + j * segHeight
          const char = codeSnippet[codeIndex % codeSnippet.length]
          codeIndex++

          points.push({
            x: anchorX,
            y: y,
            oldX: anchorX,
            oldY: y,
            glyph: glyphCache[char] || glyphCache["a"],
            pinned: j === 0, // Pin top point invisible at top margin
          })
        }
        strings.push(points)
      }
    }

    initStrings()

    // Fast Line Segment Distance function for sharp physics detection
    const distToSegmentSq = (px, py, x1, y1, x2, y2) => {
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2
      if (l2 === 0) return (px - x1) ** 2 + (py - y1) ** 2
      let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
      t = Math.max(0, Math.min(1, t))
      return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2
    }

    // High Performance Physics Engine
    const updatePhysics = () => {
      mouse.vx = mouse.x - mouse.oldX
      mouse.vy = mouse.y - mouse.oldY
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy)

      const segLen = (height * 0.82) / segmentsPerString

      for (let s = 0; s < strings.length; s++) {
        const points = strings[s]

        for (let i = 1; i < points.length; i++) {
          const p = points[i]

          // Verlet Motion Update
          const vx = (p.x - p.oldX) * friction
          const vy = (p.y - p.oldY) * friction

          p.oldX = p.x
          p.oldY = p.y

          p.x += vx
          p.y += vy + gravity

          // HIGH-PUSH PHYSICS INTERACTION
          if (mouseSpeed > 0.1) {
            const distSq = distToSegmentSq(
              p.x, p.y,
              mouse.oldX, mouse.oldY,
              mouse.x, mouse.y
            )

            // Contact threshold (35px squared = 1225)
            if (distSq < 1225) {
              const pushForce = Math.min(mouseSpeed * 1.6, 55)
              const dir = p.x >= mouse.x ? 1 : -1
              p.x += mouse.vx * 1.1 + dir * pushForce * 0.7
              p.y += mouse.vy * 1.1
            }
          }
        }

        // Reduced constraint iterations to 2 for optimal CPU performance
        for (let iteration = 0; iteration < 2; iteration++) {
          for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i]
            const p2 = points[i + 1]

            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const diff = (segLen - dist) / dist

            const offsetX = dx * diff * 0.5
            const offsetY = dy * diff * 0.5

            if (!p1.pinned) {
              p1.x -= offsetX
              p1.y -= offsetY
            }
            p2.x += offsetX
            p2.y += offsetY
          }
        }
      }

      mouse.oldX = mouse.x
      mouse.oldY = mouse.y
    }

    // Ultra-Fast Canvas Render
    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      for (let s = 0; s < strings.length; s++) {
        const points = strings[s]
        for (let i = 1; i < points.length; i++) {
          const p = points[i]
          ctx.drawImage(p.glyph, p.x - 8, p.y - 8)
        }
      }
    }

    const ticker = () => {
      updatePhysics()
      draw()
    }
    gsap.ticker.add(ticker)

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const handleResize = () => {
      width = canvas.width = container.clientWidth
      height = canvas.height = container.clientHeight
      initStrings()
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("resize", handleResize)

    return () => {
      gsap.ticker.remove(ticker)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen bg-[#e3d8c4] overflow-hidden select-none"
    >
      {/* Background Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(#000 0.75px, transparent 0.75px)`,
          backgroundSize: "8px 8px"
        }}
      />

      {/* Physics Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 block" />
    </div>
  )
}