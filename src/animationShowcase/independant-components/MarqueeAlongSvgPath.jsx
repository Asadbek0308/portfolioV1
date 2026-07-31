import React, { useEffect, useRef, useMemo } from "react"
import { gsap } from "gsap"

// Utility function for conditional classes
const cn = (...classes) => classes.filter(Boolean).join(" ")

// Helper function to wrap values between min and max
const wrap = (min, max, value) => {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

// Default Image Data
const defaultImgs = [
  { src: "https://cdn.cosmos.so/b9909337-7a53-48bc-9672-33fbd0f040a1?format=jpeg", link: "https://www.instagram.com/p/DCOl6YTS85e/" },
  { src: "https://cdn.cosmos.so/ecdc9dd7-2862-4c28-abb1-dcc0947390f3?format=jpeg", link: "https://www.instagram.com/p/C4RTJvVpP4R/" },
  { src: "https://cdn.cosmos.so/79de41ec-baa4-4ac0-a9a4-c090005ca640?format=jpeg", link: "https://pangrampangram.com/products/mori" },
  { src: "https://cdn.cosmos.so/1a18b312-21cd-4484-bce5-9fb7ed1c5e01?format=jpeg", link: "https://www.sergidelgado.com/selected-work/ampersand" },
  { src: "https://cdn.cosmos.so/d765f64f-7a66-462f-8b2d-3d7bc8d7db55?format=jpeg", link: "https://www.instagram.com/p/C40XmANsoe_/" },
  { src: "https://cdn.cosmos.so/6b9f08ea-f0c5-471f-a620-71221ff1fb65?format=jpeg", link: "https://abduzeedo.com/super-stylish-type-explorations" },
  { src: "https://cdn.cosmos.so/40a09525-4b00-4666-86f0-3c45f5d77605?format=jpeg", link: "https://www.instagram.com/p/CrhdrGjr9yK/" },
  { src: "https://cdn.cosmos.so/14f05ab6-b4d0-4605-9007-8a2190a249d0?format=jpeg", link: "https://www.instagram.com/julian.stiber/p/By5RBApiDzE/" },
  { src: "https://cdn.cosmos.so/d05009a2-a2f8-4a4c-a0de-e1b0379dddb8?format=jpeg", link: "https://www.instagram.com/p/CeT3COysRNN/" },
  { src: "https://cdn.cosmos.so/ba646e35-efc2-494a-961b-b40f597e6fc9?format=jpeg", link: "https://www.instagram.com/godfreydadich/" },
  { src: "https://cdn.cosmos.so/e899f9c3-ed48-4899-8c16-fbd5a60705da?format=jpeg", link: "https://www.instagram.com/p/Bty1U6BhTOW/" },
  { src: "https://cdn.cosmos.so/24e83c11-c607-45cd-88fb-5059960b56a0?format=jpeg", link: "https://www.instagram.com/p/C48dxn1LqhC/" },
  { src: "https://cdn.cosmos.so/cd346bce-f415-4ea7-8060-99c5f7c1741a?format=jpeg", link: "https://www.instagram.com/p/C08ZDVyyRhK/" },
]

export function MarqueeAlongSvgPath({
  children,
  className,
  path,
  pathId,
  preserveAspectRatio = "xMidYMid meet",
  showPath = false,
  width = "100%",
  height = "100%",
  viewBox = "0 0 100 100",
  baseVelocity = 5,
  direction = "normal",
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  repeat = 3,
  draggable = false,
  dragSensitivity = 0.2,
  grabCursor = false,
  enableRollingZIndex = true,
  zIndexBase = 1,
  zIndexRange = 10,
  responsive = false,
}) {
  const containerRef = useRef(null)
  const marqueeContainerRef = useRef(null)
  const itemRefs = useRef([])

  // Track animation state with Refs
  const isHovered = useRef(false)
  const isDragging = useRef(false)
  const dragVelocity = useRef(0)
  const lastPointerPosition = useRef({ x: 0, y: 0 })
  const baseOffset = useRef(0)

  const generatedId = useMemo(
    () => pathId || `marquee-path-${Math.random().toString(36).substring(7)}`,
    [pathId]
  )

  // Duplicate items array based on repeat count
  const items = useMemo(() => {
    const childrenArray = React.Children.toArray(children)
    return childrenArray.flatMap((child, childIndex) =>
      Array.from({ length: repeat }, (_, repeatIndex) => {
        const itemIndex = repeatIndex * childrenArray.length + childIndex
        return {
          child,
          repeatIndex,
          itemIndex,
          key: `${childIndex}-${repeatIndex}`,
        }
      })
    )
  }, [children, repeat])

  // Responsive Scaling Handler
  useEffect(() => {
    if (!responsive) return

    const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number)
    const originalWidth = vbWidth || 100
    const originalHeight = vbHeight || 100

    const updateScale = () => {
      const wrapper = containerRef.current
      const marqueeContainer = marqueeContainerRef.current
      if (!wrapper || !marqueeContainer) return

      const wrapperWidth = wrapper.clientWidth
      const wrapperHeight = wrapper.clientHeight

      const scaleX = wrapperWidth / originalWidth
      const scaleY = wrapperHeight / originalHeight
      const scale = Math.min(scaleX, scaleY)

      const scaledWidth = originalWidth * scale
      const scaledHeight = originalHeight * scale

      const offsetX = (wrapperWidth - scaledWidth) / 2
      const offsetY = (wrapperHeight - scaledHeight) / 2

      marqueeContainer.style.width = `${originalWidth}px`
      marqueeContainer.style.height = `${originalHeight}px`
      marqueeContainer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
      marqueeContainer.style.transformOrigin = "top left"
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [responsive, viewBox])

  // GSAP Animation Ticker Update
  useEffect(() => {
    const dir = direction === "normal" ? 1 : -1
    const totalItems = items.length

    const updatePositions = () => {
      // Manage inertia and decay during/after drag
      if (!isDragging.current && Math.abs(dragVelocity.current) > 0.01) {
        dragVelocity.current *= 0.95
      } else if (!isDragging.current) {
        dragVelocity.current = 0
      }

      // Calculate movement step per frame
      const speedFactor = isHovered.current && slowdownOnHover ? slowDownFactor : 1
      const deltaMove = dir * baseVelocity * 0.05 * speedFactor + dragVelocity.current

      baseOffset.current += deltaMove

      // Update offset-distance property directly via GSAP
      itemRefs.current.forEach((el, index) => {
        if (!el) return

        const initialPosition = (index * 100) / totalItems
        const wrappedProgress = wrap(0, 100, baseOffset.current + initialPosition)

        // Set CSS offsetDistance directly for perfect SVG path traversal
        gsap.set(el, {
          css: {
            offsetDistance: `${wrappedProgress}%`,
            zIndex: enableRollingZIndex
              ? Math.floor(zIndexBase + (wrappedProgress / 100) * zIndexRange)
              : undefined,
          },
        })
      })
    }

    // Attach GSAP ticker
    gsap.ticker.add(updatePositions)

    return () => {
      gsap.ticker.remove(updatePositions)
    }
  }, [
    items.length,
    baseVelocity,
    direction,
    slowdownOnHover,
    slowDownFactor,
    enableRollingZIndex,
    zIndexBase,
    zIndexRange,
  ])

  // Pointer Handlers for Dragging
  const handlePointerDown = (e) => {
    if (!draggable) return
    e.currentTarget.setPointerCapture(e.pointerId)

    if (grabCursor) {
      e.currentTarget.style.cursor = "grabbing"
    }

    isDragging.current = true
    lastPointerPosition.current = { x: e.clientX, y: e.clientY }
    dragVelocity.current = 0
  }

  const handlePointerMove = (e) => {
    if (!draggable || !isDragging.current) return

    const currentPosition = { x: e.clientX, y: e.clientY }
    const deltaX = currentPosition.x - lastPointerPosition.current.x
    const deltaY = currentPosition.y - lastPointerPosition.current.y

    const projectedDelta = deltaX > 0 ? Math.hypot(deltaX, deltaY) : -Math.hypot(deltaX, deltaY)

    dragVelocity.current = projectedDelta * dragSensitivity
    lastPointerPosition.current = currentPosition
  }

  const handlePointerUp = (e) => {
    if (!draggable) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    isDragging.current = false

    if (grabCursor) {
      e.currentTarget.style.cursor = "grab"
    }
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        ref={marqueeContainerRef}
        className="relative"
        style={{ contain: "layout style" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          className="w-full h-full pointer-events-none"
        >
          <path
            id={generatedId}
            d={path}
            stroke={showPath ? "currentColor" : "none"}
            fill="none"
          />
        </svg>

        {items.map(({ child, repeatIndex, key }, idx) => (
          <div
            key={key}
            ref={(el) => (itemRefs.current[idx] = el)}
            className={cn(
              "absolute top-0 left-0 will-change-transform",
              draggable && grabCursor && "cursor-grab"
            )}
            style={{
              offsetPath: `path('${path}')`,
              offsetRotate: "auto",
            }}
            aria-hidden={repeatIndex > 0}
            onMouseEnter={() => (isHovered.current = true)}
            onMouseLeave={() => (isHovered.current = false)}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

// Demo Component
const SVG_PATH =
  "M1 209.434C58.5872 255.935 387.926 325.938 482.583 209.434C600.905 63.8051 525.516 -43.2211 427.332 19.9613C329.149 83.1436 352.902 242.723 515.041 267.302C644.752 286.966 943.56 181.94 995 156.5"

export default function MarqueeAlongSvgPathDemo() {
  return (
    <div className="w-screen h-screen bg-zinc-50 flex items-center justify-center overflow-hidden">
      <MarqueeAlongSvgPath
        path={SVG_PATH}
        viewBox="0 0 996 330"
        baseVelocity={2}
        slowdownOnHover={true}
        draggable={true}
        repeat={2}
        dragSensitivity={0.15}
        className="w-full h-full scale-105"
        responsive
        grabCursor
      >
        {defaultImgs.map((img, i) => (
          <div
            key={i}
            className="w-14 h-14 transition-transform duration-300 ease-in-out hover:scale-150"
          >
            <img
              src={img.src}
              alt={`Example ${i}`}
              className="w-full h-full object-cover rounded-md shadow-md"
              draggable={false}
            />
          </div>
        ))}
      </MarqueeAlongSvgPath>
    </div>
  )
}