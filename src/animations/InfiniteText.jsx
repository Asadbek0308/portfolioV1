import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const BASE_SPEED = 180 // px per second

const InfiniteText = ({ text = "FRONTEND DEVELOPER" }) => {
  const containerRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    const container = containerRef.current
    if (!track || !container) return

    let singleWidth = track.children[0].offsetWidth
    let xPos = 0
    let currentSpeed = BASE_SPEED // signed px/sec
    let targetSpeed = BASE_SPEED

    // Keeps the loop width correct across resizes/breakpoints/font
    // loads — nothing to recalculate manually.
    const ro = new ResizeObserver(() => {
      singleWidth = track.children[0].offsetWidth
    })
    ro.observe(track.children[0])

    // Manual per-frame increment instead of a repeat:-1 tween whose
    // timeScale gets flipped negative. That was the freeze: reversing
    // an infinitely-repeating tween isn't guaranteed continuous across
    // its own repeat boundaries. A plain increment has no boundary to
    // get stuck on — reversing direction is just subtracting a
    // negative number.
    const tick = (time, deltaTime) => {
      currentSpeed += (targetSpeed - currentSpeed) * 0.06 // smooth speed changes
      xPos -= currentSpeed * (deltaTime / 1000)

      if (singleWidth > 0) {
        // gsap.utils.wrap handles negative overflow correctly (unlike
        // raw `%`), so reversing direction never causes a jump.
        xPos = gsap.utils.wrap(-singleWidth, 0, xPos)
      }
      gsap.set(track, { x: xPos })
    }

    gsap.ticker.add(tick)

    const trigger = ScrollTrigger.create({
      onUpdate: (self) => {
        const direction = self.direction // 1 down, -1 up
        const velocityBoost = gsap.utils.clamp(0, 5, Math.abs(self.getVelocity() / 300))
        targetSpeed = direction * BASE_SPEED * (1 + velocityBoost)
      },
    })

    return () => {
      gsap.ticker.remove(tick)
      trigger.kill()
      ro.disconnect()
    }
  }, [])

  const content = `${text}\u00A0—\u00A0`

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden whitespace-nowrap select-none py-2"
    >
      <div ref={trackRef} className="inline-flex will-change-transform">
        <span className="inline-block shrink-0 font-bold text-4xl sm:text-6xl md:text-9xl uppercase tracking-tighter">
          {content.repeat(4)}
        </span>
        <span aria-hidden="true" className="inline-block shrink-0 font-bold text-4xl sm:text-6xl md:text-9xl uppercase tracking-tighter">
          {content.repeat(4)}
        </span>
      </div>
    </div>
  )
}

export default InfiniteText