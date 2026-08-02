import React, { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

// SVG Path vectors for numbers 1 to 5
const NUMBERS_PATHS = [
  // "1"
  "M128 32V224M128 32L88 72",
  // "2"
  "M78 85C78 55 100 32 128 32C156 32 178 55 178 85C178 125 78 165 78 224H178",
  // "3"
  "M80 40H176L120 116C150 116 178 135 178 170C178 205 150 224 128 224C95 224 78 198 78 175",
  // "4"
  "M158 224V32L78 152H178",
  // "5"
  "M172 40H88V120C98 112 112 108 128 108C158 108 178 130 178 166C178 202 154 224 128 224C98 224 80 200 80 180"
]

const NUM_CIRCLES = 35
const CIRCLE_RADIUS = 20

export default function GSAPGooeyTextMorph() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const pathRefs = useRef([])
  const circleRefs = useRef([])
  const animationTimeline = useRef(null)

  // Trigger GSAP Morph whenever selected number index changes
  useEffect(() => {
    const currentPathEl = pathRefs.current[currentIndex]
    if (!currentPathEl) return

    // Calculate path length & step interval
    const totalLength = currentPathEl.getTotalLength()
    const step = totalLength / (NUM_CIRCLES - 1)

    // Kill any ongoing animations to prevent overlapping tweaks
    if (animationTimeline.current) {
      animationTimeline.current.kill()
    }

    const tl = gsap.timeline()
    animationTimeline.current = tl

    circleRefs.current.forEach((circle, i) => {
      if (!circle) return

      // Get target coordinate along SVG path vector
      const point = currentPathEl.getPointAtLength(i * step)

      // GSAP animate each circle toward its designated point on the path
      tl.to(
        circle,
        {
          cx: point.x,
          cy: point.y,
          duration: 0.8,
          ease: "power2.out",
        },
        i * 0.025 // Incremental delay creates liquid morph flow
      )
    })
  }, [currentIndex])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen  text-stone-100 select-none font-sans">
      <h2 className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-8">
        SVG Filter Gooey Text Morph
      </h2>

      {/* SVG Canvas Area */}
      <div className="relative w-80 h-80 flex items-center justify-center bg-stone-900/40 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 256 256"
          style={{ filter: "url(#gooey-filter)" }} // Applies the matrix filter below
        >
          {/* SVG Filter Definition */}
          <defs>
            <filter id="gooey-filter">
              {/* 1. Gaussian Blur blends individual circles into a continuous shape */}
              <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
              
              {/* 2. Color Matrix sharpens blurred edges back into solid vector bounds */}
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 25 -15
                "
                result="gooey"
              />
            </filter>
          </defs>

          {/* Hidden reference paths used to measure point vectors */}
          {NUMBERS_PATHS.map((d, idx) => (
            <path
              key={idx}
              ref={(el) => (pathRefs.current[idx] = el)}
              d={d}
              fill="none"
              stroke="none"
              style={{ display: "none" }}
            />
          ))}

          {/* Rendered circles that morph along vector paths */}
          <g fill="#f5f5f4">
            {Array.from({ length: NUM_CIRCLES }).map((_, i) => (
              <circle
                key={i}
                ref={(el) => (circleRefs.current[i] = el)}
                cx={128} // Initial spawn position centered
                cy={128}
                r={CIRCLE_RADIUS}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Interactive Controls */}
      <div className="flex items-center gap-4 mt-8">
        {NUMBERS_PATHS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-12 h-12 rounded-full font-serif text-lg font-medium transition-all duration-300 border ${
              currentIndex === idx
                ? "bg-stone-100 text-stone-950 border-stone-100 scale-110 shadow-lg shadow-white/10"
                : "bg-stone-900/80 text-stone-400 border-stone-800 hover:border-stone-600 hover:text-stone-200"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  )
}