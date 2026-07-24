import React, { useRef, useEffect, useState, useCallback } from 'react'

const lerp = (start, end, amt) => (1 - amt) * start + amt * end

export default function PaintReveal() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const prevPosRef = useRef(null)
  const isInitializedRef = useRef(false)

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const brushRadius = 50
  const maskColor = '#0a0a0a' // Dark sleek mask surface

  // 1. Measure and observe container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height)
        })
      }
    }

    updateSize()

    const resizeObserver = new ResizeObserver(() => updateSize())
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  // 2. Initialize and paint initial black mask layer safely
  useEffect(() => {
    if (dimensions.width === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Avoid wiping user progress on container resize once initialized
    if (!isInitializedRef.current) {
      // Step A: Explicitly set standard drawing mode to render solid mask
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = maskColor
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Step B: Switch mode so brush strokes punch transparent holes
      ctx.globalCompositeOperation = 'destination-out'
      isInitializedRef.current = true
    }
  }, [dimensions])

  // Helper function to punch transparent circle holes
  const drawCircle = useCallback((ctx, x, y, radius) => {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  // 3. Core interaction handler (Mouse & Touch supported)
  const handlePointerMove = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    const currentX = clientX - rect.left
    const currentY = clientY - rect.top

    if (prevPosRef.current) {
      const prev = prevPosRef.current
      const dist = Math.hypot(currentX - prev.x, currentY - prev.y)
      
      // Interpolate points between quick mouse moves so line stays smooth
      const steps = Math.max(Math.floor(dist / 6), 1)

      for (let i = 0; i <= steps; i++) {
        const percent = i / steps
        const interpX = lerp(prev.x, currentX, percent)
        const interpY = lerp(prev.y, currentY, percent)
        drawCircle(ctx, interpX, interpY, brushRadius)
      }
    } else {
      drawCircle(ctx, currentX, currentY, brushRadius)
    }

    prevPosRef.current = { x: currentX, y: currentY }
  }, [drawCircle])

  // Event Handlers
  const handleMouseMove = (e) => handlePointerMove(e.clientX, e.clientY)

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handlePointerEnd = () => {
    prevPosRef.current = null
  }

  return (
    <div
      ref={containerRef}
      onMouseLeave={handlePointerEnd}
      onTouchEnd={handlePointerEnd}
      className="relative w-full max-w-3xl aspect-[16/9] bg-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 select-none"
    >
      {/* Underlay Content (Revealed on paint) */}
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-white p-6 md:p-12 text-center pointer-events-none">
        <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-3">
          Secret Manifest
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-neutral-950 tracking-tight leading-none uppercase">
          Creative <br />
          <span className="text-neutral-500">Code Architecture</span>
        </h2>
        <p className="mt-4 text-xs md:text-sm font-medium text-neutral-400 max-w-sm">
          The Canvas API acts as a transparent window layer into underlying DOM elements when composite operations are leveraged.
        </p>
      </div>

      {/* Masking Canvas Layer */}
      {dimensions.width > 0 && (
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
          className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none"
        />
      )}

      {/* Initializing State */}
      {dimensions.width === 0 && (
        <div className="absolute inset-0 w-full h-full bg-neutral-950 z-20 flex items-center justify-center text-xs font-mono text-neutral-500">
          Initializing Canvas...
        </div>
      )}
    </div>
  )
}