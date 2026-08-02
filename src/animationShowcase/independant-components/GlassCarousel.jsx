import React, { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

const PAINTERS = [
  {
    id: "goya",
    name: "Francisco Goya",
    years: "1746 – 1828",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/b/bf/Vicente_L%C3%B3pez_Porta%C3%B1a_-_el_pintor_Francisco_de_Goya.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/8/82/Francisco_de_Goya%2C_Saturno_devorando_a_su_hijo_%281819-1823%29.jpg",
  },
  {
    id: "da-vinci",
    name: "Leonardo da Vinci",
    years: "1452 – 1519",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/2/2b/Leonardo_da_Vinci_-_Portrait_of_a_Musician_-_Pinacoteca_Ambrosiana_%28head_crop%29.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/6/6a/Mona_Lisa.jpg",
  },
  {
    id: "david",
    name: "Jacques-Louis David",
    years: "1748 – 1825",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/c/c6/David_Self_Portrait.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/4/45/Le_Philosophe_Jacques_Louis_David.jpg",
  },
  {
    id: "rembrandt",
    name: "Rembrandt van Rijn",
    years: "1606 – 1669",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/b/bd/Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/4/4d/Rembrandt_-_The_Anatomy_Lesson_of_Dr_Nicolaes_Tulp.jpg",
  },
  {
    id: "manet",
    name: "Édouard Manet",
    years: "1832 – 1883",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/2/20/%C3%89douard_Manet%2C_en_buste%2C_de_face_-_Nadar.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/c/cf/%C3%89douard_Manet_-_Jeanne_%28Spring%29.jpg",
  },
  {
    id: "van-gogh",
    name: "Vincent van Gogh",
    years: "1853 – 1890",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/4/4c/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%28454045%29.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/6/66/VanGogh-starry_night_ballance1.jpg",
  },
  {
    id: "michelangelo",
    name: "Michelangelo",
    years: "1475 – 1564",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/1/12/Michelangelo_Buonarroti_Met_DP889816.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/5/5b/Michelangelo_-_Creation_of_Adam_%28cropped%29.jpg",
  },
  {
    id: "monet",
    name: "Claude Monet",
    years: "1840 – 1926",
    portrait:
      "https://upload.wikimedia.org/wikipedia/commons/a/a4/Claude_Monet_1899_Nadar_crop.jpg",
    bgArtwork:
      "https://upload.wikimedia.org/wikipedia/commons/1/1b/Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg",
  },
]

const HOLD_DURATION = 2.2
const DIVE_DURATION = 0.65
const DIVE_EASE = "elastic.out(1,0.75)"
const TOTAL = PAINTERS.length
const STEP_ANGLE = (2 * Math.PI) / TOTAL

export default function GSAPGlassRefractionCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef(null)
  const nodesRef = useRef([])
  const bgRefs = useRef([])
  const firstNameRef = useRef(null)
  const lastNameRef = useRef(null)
  const startYearRef = useRef(null)
  const endYearRef = useRef(null)
  const settersRef = useRef([])

  const rotProxy = useRef({ angle: 0 })
  const isDragging = useRef(false)
  const startMouseAngle = useRef(0)
  const startRotAngle = useRef(0)
  const activeIndexRef = useRef(0)
  const idleTweenRef = useRef(null)

  const centerCoords = useRef({ x: 0, y: 0 })
  const cachedRadius = useRef(330)
  const isMobile = useRef(false)
  const rafId = useRef(null)

  const lastAngle = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)

  // Compute radius and layout metrics without triggering recalculations during drag
  const recalculateMetrics = () => {
    if (typeof window === "undefined") return
    const width = window.innerWidth
    isMobile.current = width < 640
    cachedRadius.current = width < 640 ? 210 : width < 1024 ? 270 : 330

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      centerCoords.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    }
  }

  const updatePositions = (currentAngle) => {
    let normalized = -currentAngle % (2 * Math.PI)
    if (normalized < 0) normalized += 2 * Math.PI
    const nearestIdx = Math.round(normalized / STEP_ANGLE) % TOTAL

    if (nearestIdx !== activeIndexRef.current) {
      const prevIdx = activeIndexRef.current
      activeIndexRef.current = nearestIdx

      // Perform non-blocking background transitions
      if (bgRefs.current[prevIdx]) {
        gsap.killTweensOf(bgRefs.current[prevIdx])
        gsap.to(bgRefs.current[prevIdx], { opacity: 0, scale: 1.05, duration: 0.8, ease: "power2.out", overwrite: "auto" })
      }
      if (bgRefs.current[nearestIdx]) {
        gsap.killTweensOf(bgRefs.current[nearestIdx])
        gsap.to(bgRefs.current[nearestIdx], { opacity: 0.6, scale: 1, duration: 0.8, ease: "power2.out", overwrite: "auto" })
      }

      setActiveIndex(nearestIdx)
    }

    const currentRadius = cachedRadius.current
    const minScale = isMobile.current ? 0.5 : 0.55
    const maxScale = isMobile.current ? 1.15 : 1.4

    for (let i = 0; i < TOTAL; i++) {
      const node = nodesRef.current[i]
      const setters = settersRef.current[i]
      if (!node || !setters) continue

      const angle = currentAngle + i * STEP_ANGLE - Math.PI / 2
      const x = Math.cos(angle) * currentRadius
      const y = Math.sin(angle) * currentRadius

      const distFromTop = Math.abs(
        Math.atan2(Math.sin(angle + Math.PI / 2), Math.cos(angle + Math.PI / 2))
      )

      const scale = gsap.utils.mapRange(0, Math.PI, maxScale, minScale, distFromTop)
      const stretch = gsap.utils.mapRange(0, Math.PI, 1.32, 1, distFromTop)
      const opacity = gsap.utils.mapRange(0, Math.PI, 1, 0.45, distFromTop)

      setters.x(x)
      setters.y(y)
      setters.scaleX(scale)
      setters.scaleY(scale * stretch)
      setters.opacity(opacity)
      
      // Fast integer mapping for z-index
      node.style.zIndex = ((1 - distFromTop / Math.PI) * 100) | 0
    }
  }

  const startIdleRotation = () => {
    idleTweenRef.current?.kill()

    const diveToNext = () => {
      const targetAngle = rotProxy.current.angle - STEP_ANGLE
      idleTweenRef.current = gsap.to(rotProxy.current, {
        angle: targetAngle,
        duration: DIVE_DURATION,
        ease: DIVE_EASE,
        onUpdate: () => updatePositions(rotProxy.current.angle),
        onComplete: scheduleHold,
      })
    }

    function scheduleHold() {
      idleTweenRef.current = gsap.delayedCall(HOLD_DURATION, diveToNext)
    }

    scheduleHold()
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      settersRef.current = nodesRef.current.map((node) => {
        if (!node) return null
        gsap.set(node, { xPercent: -50, yPercent: -50, force3D: true })
        return {
          x: gsap.quickSetter(node, "x", "px"),
          y: gsap.quickSetter(node, "y", "px"),
          scaleX: gsap.quickSetter(node, "scaleX"),
          scaleY: gsap.quickSetter(node, "scaleY"),
          opacity: gsap.quickSetter(node, "opacity"),
        }
      })

      if (bgRefs.current[0]) {
        gsap.set(bgRefs.current[0], { opacity: 0.6, scale: 1 })
      }

      recalculateMetrics()
      updatePositions(0)
      startIdleRotation()
    }, containerRef)

    const handleResize = () => {
      recalculateMetrics()
      updatePositions(rotProxy.current.angle)
    }

    window.addEventListener("resize", handleResize, { passive: true })

    return () => {
      idleTweenRef.current?.kill()
      if (rafId.current) cancelAnimationFrame(rafId.current)
      window.removeEventListener("resize", handleResize)
      ctx.revert()
    }
  }, [])

  useEffect(() => {
    const els = [firstNameRef.current, lastNameRef.current, startYearRef.current, endYearRef.current].filter(Boolean)
    if (els.length > 0) {
      gsap.fromTo(
        els,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.04, overwrite: "auto" }
      )
    }
  }, [activeIndex])

  const getAngleFromCenter = (clientX, clientY) => {
    return Math.atan2(clientY - centerCoords.current.y, clientX - centerCoords.current.x)
  }

  const handlePointerDown = (e) => {
    isDragging.current = true
    idleTweenRef.current?.kill()
    gsap.killTweensOf(rotProxy.current)

    recalculateMetrics()

    const angle = getAngleFromCenter(e.clientX, e.clientY)
    startMouseAngle.current = angle
    startRotAngle.current = rotProxy.current.angle

    lastAngle.current = angle
    lastTime.current = performance.now()
    velocity.current = 0

    window.addEventListener("pointermove", handlePointerMove, { passive: true })
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerUp)
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current) return

    const clientX = e.clientX
    const clientY = e.clientY

    if (rafId.current) return

    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      if (!isDragging.current) return

      const currentMouseAngle = getAngleFromCenter(clientX, clientY)
      const delta = currentMouseAngle - startMouseAngle.current
      rotProxy.current.angle = startRotAngle.current + delta
      updatePositions(rotProxy.current.angle)

      const now = performance.now()
      const dt = now - lastTime.current
      if (dt > 10) {
        let stepDelta = currentMouseAngle - lastAngle.current
        if (stepDelta > Math.PI) stepDelta -= 2 * Math.PI
        if (stepDelta < -Math.PI) stepDelta += 2 * Math.PI

        velocity.current = stepDelta / dt
        lastAngle.current = currentMouseAngle
        lastTime.current = now
      }
    })
  }

  const handlePointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false

    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    window.removeEventListener("pointercancel", handlePointerUp)

    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }

    const projectedSpin = velocity.current * 400
    const projectedAngle = rotProxy.current.angle + projectedSpin

    const nearestIndex = Math.round(-projectedAngle / STEP_ANGLE)
    const targetAngle = -nearestIndex * STEP_ANGLE

    const distance = Math.abs(targetAngle - rotProxy.current.angle)
    const duration = Math.min(Math.max(distance * 0.35, 0.5), 2.0)

    idleTweenRef.current?.kill()
    idleTweenRef.current = gsap.to(rotProxy.current, {
      angle: targetAngle,
      duration: duration,
      ease: "power2.out",
      onUpdate: () => updatePositions(rotProxy.current.angle),
      onComplete: startIdleRotation,
    })
  }

  const currentPainter = PAINTERS[activeIndex]

  return (
    <div className="relative w-screen h-screen bg-black text-stone-200 overflow-hidden select-none font-serif">
      {/* BACKGROUND ARTWORK LAYERS */}
      <div className="absolute inset-0 pointer-events-none">
        {PAINTERS.map((painter, i) => (
          <div
            key={painter.id}
            ref={(el) => (bgRefs.current[i] = el)}
            className="absolute inset-0 bg-cover bg-center opacity-0 will-change-transform"
            style={{
              backgroundImage: `url(${painter.bgArtwork})`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-radial-vignette opacity-85 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />
      </div>

      <div className="absolute top-4 sm:top-8 inset-x-0 z-10 text-center tracking-[0.2em] sm:tracking-[0.3em] text-[9px] sm:text-[11px] font-sans text-stone-400 uppercase px-4 pointer-events-none">
        Refracted Glass Composition
      </div>

      {/* DRAGGABLE RING */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        className="absolute left-1/2 bottom-1/12 sm:bottom-1/6 z-20 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[600px] md:h-[600px] rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
        style={{ transform: "translate(-50%, 50%)" }}
      >
        {PAINTERS.map((painter, i) => (
          <div
            key={painter.id}
            ref={(el) => (nodesRef.current[i] = el)}
            className="absolute top-1/2 left-1/2 rounded-full flex items-center justify-center pointer-events-none will-change-transform"
          >
            {/* GLASS CONTAINER */}
            <div className="relative rounded-full p-1.5 sm:p-2 md:p-3 shadow-[0_10px_25px_rgba(0,0,0,0.6)] bg-white/10 border border-white/20 transform-gpu">
              
              {/* Specular Highlight Overlay */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none opacity-30"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 100%)",
                }}
              />

              {/* PORTRAIT VESSEL */}
              <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-stone-900 border border-black/80">
                <img
                  src={painter.portrait}
                  alt={painter.name}
                  className="w-full h-full object-cover grayscale contrast-125 pointer-events-none"
                  loading="eager"
                  decoding="async"
                />
                <div
                  className="absolute inset-0 pointer-events-none rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.25) 0%, transparent 65%)",
                  }}
                />
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_rgba(0,0,0,0.85)] pointer-events-none" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CAPTION */}
      <div className="absolute inset-x-0 bottom-4 sm:bottom-6 md:bottom-10 z-30 text-center pointer-events-none px-4">
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-normal tracking-wide text-stone-100 drop-shadow-md">
            <span ref={firstNameRef} className="inline-block">
              {currentPainter.name.split(" ")[0]}
            </span>{" "}
            <span ref={lastNameRef} className="inline-block italic font-light">
              {currentPainter.name.split(" ").slice(1).join(" ")}
            </span>
          </h1>
          <p className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-sans tracking-[0.2em] sm:tracking-[0.25em] text-stone-400 mt-0.5 sm:mt-1 uppercase">
            <span ref={startYearRef} className="inline-block">
              {currentPainter.years.split("–")[0].trim()}
            </span>
            <span aria-hidden="true">–</span>
            <span ref={endYearRef} className="inline-block">
              {currentPainter.years.split("–")[1].trim()}
            </span>
          </p>
        </div>

        <div className="inline-block text-[8px] sm:text-[10px] font-sans tracking-[0.25em] sm:tracking-[0.35em] text-stone-500 uppercase mt-2 sm:mt-4">
          Tribute to Marvelous Painters
        </div>
      </div>

      <style>{`
        .bg-radial-vignette {
          background: radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.85) 85%);
        }
      `}</style>
    </div>
  )
}