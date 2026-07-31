import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react"
import { gsap } from "gsap"

// Helper utility for conditional CSS classes
const cn = (...classes) => classes.filter(Boolean).join(" ")

/**
 * 3D Draggable & Rotatable CSS Box powered by GSAP
 */
export const CSSBox = forwardRef(
  (
    {
      width = 200,
      height = 200,
      depth = 200,
      perspective = 600,
      faces = {},
      draggable = true,
      className = "",
      onMouseEnter,
      onMouseLeave,
      onClick,
      ...props
    },
    ref
  ) => {
    const boxRef = useRef(null)
    // Initialized to { x: 0, y: 0 } so the front face faces directly into the screen
    const rotation = useRef({ x: 0, y: 0 })
    const isDragging = useRef(false)
    const lastPointerPos = useRef({ x: 0, y: 0 })
    const velocity = useRef({ x: 0, y: 0 })

    // Expose control methods to parent refs
    useImperativeHandle(ref, () => ({
      rotateTo: (targetX, targetY, duration = 0.8) => {
        rotation.current = { x: targetX, y: targetY }
        return gsap.to(boxRef.current, {
          rotateX: targetX,
          rotateY: targetY,
          duration,
          ease: "power3.out",
        })
      },
      getRotation: () => rotation.current,
    }))

    // Apply initial rotation transform on mount (0deg X, 0deg Y)
    useEffect(() => {
      if (boxRef.current) {
        gsap.set(boxRef.current, {
          rotateX: rotation.current.x,
          rotateY: rotation.current.y,
        })
      }
    }, [])

    // Inertia ticker loop for smooth momentum after dragging releases
    useEffect(() => {
      const updateInertia = () => {
        if (!isDragging.current) {
          if (
            Math.abs(velocity.current.x) > 0.05 ||
            Math.abs(velocity.current.y) > 0.05
          ) {
            rotation.current.y += velocity.current.x
            rotation.current.x -= velocity.current.y

            velocity.current.x *= 0.92
            velocity.current.y *= 0.92

            gsap.set(boxRef.current, {
              rotateX: rotation.current.x,
              rotateY: rotation.current.y,
            })
          }
        }
      }

      gsap.ticker.add(updateInertia)
      return () => gsap.ticker.remove(updateInertia)
    }, [])

    // Pointer event handlers for 3D drag interaction
    const handlePointerDown = (e) => {
      if (!draggable) return
      e.currentTarget.setPointerCapture(e.pointerId)
      isDragging.current = true
      lastPointerPos.current = { x: e.clientX, y: e.clientY }
      velocity.current = { x: 0, y: 0 }
    }

    const handlePointerMove = (e) => {
      if (!isDragging.current || !draggable) return

      const deltaX = e.clientX - lastPointerPos.current.x
      const deltaY = e.clientY - lastPointerPos.current.y

      velocity.current = { x: deltaX * 0.4, y: deltaY * 0.4 }

      rotation.current.y += deltaX * 0.5
      rotation.current.x -= deltaY * 0.5

      gsap.set(boxRef.current, {
        rotateX: rotation.current.x,
        rotateY: rotation.current.y,
      })

      lastPointerPos.current = { x: e.clientX, y: e.clientY }
    }

    const handlePointerUp = (e) => {
      if (!draggable) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch (err) {
        // Handle capture release edge cases gracefully
      }
      isDragging.current = false
    }

    const halfWidth = width / 2
    const halfHeight = height / 2
    const halfDepth = depth / 2

    return (
      <div
        className={cn(
          "relative select-none",
          draggable && "cursor-grab active:cursor-grabbing",
          className
        )}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          perspective: `${perspective}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        {...props}
      >
        <div
          ref={boxRef}
          className="w-full h-full relative"
          style={{
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0 flex items-center justify-center backface-hidden overflow-hidden"
            style={{
              transform: `translateZ(${halfDepth}px)`,
            }}
          >
            {faces.front}
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 flex items-center justify-center backface-hidden overflow-hidden"
            style={{
              transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
            }}
          >
            {faces.back}
          </div>

          {/* Right Face */}
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center backface-hidden overflow-hidden"
            style={{
              width: `${depth}px`,
              left: `calc(50% - ${halfDepth}px)`,
              transform: `rotateY(90deg) translateZ(${halfWidth}px)`,
            }}
          >
            {faces.right}
          </div>

          {/* Left Face */}
          <div
            className="absolute top-0 bottom-0 flex items-center justify-center backface-hidden overflow-hidden"
            style={{
              width: `${depth}px`,
              left: `calc(50% - ${halfDepth}px)`,
              transform: `rotateY(-90deg) translateZ(${halfWidth}px)`,
            }}
          >
            {faces.left}
          </div>

          {/* Top Face */}
          <div
            className="absolute left-0 right-0 flex items-center justify-center backface-hidden overflow-hidden"
            style={{
              height: `${depth}px`,
              top: `calc(50% - ${halfDepth}px)`,
              transform: `rotateX(90deg) translateZ(${halfHeight}px)`,
            }}
          >
            {faces.top}
          </div>

          {/* Bottom Face */}
          <div
            className="absolute left-0 right-0 flex items-center justify-center backface-hidden overflow-hidden"
            style={{
              height: `${depth}px`,
              top: `calc(50% - ${halfDepth}px)`,
              transform: `rotateX(-90deg) translateZ(${halfHeight}px)`,
            }}
          >
            {faces.bottom}
          </div>
        </div>
      </div>
    )
  }
)

CSSBox.displayName = "CSSBox"

// Text Face helper component
const TextFace = ({ texts, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    {texts.map((text, i) => (
      <div key={i} className="text-[#0015ff] font-bold tracking-wider leading-none">
        {text}
      </div>
    ))}
  </div>
)

// Main Demo Component
export default function CSSBoxDemo() {
  const boxRef = useRef(null)

  const handleReset = () => {
    boxRef.current?.rotateTo(0, 0)
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center overflow-hidden gap-6">
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Click & Drag to rotate 3D box
        </p>
        <button
          onClick={handleReset}
          className="px-3 py-1 text-xs font-mono r:bg-zinc-50 transition-colors cursor-pointer text-zinc-600"
        >
          Reset Face-On (0, 0)
        </button>
      </div>

      <CSSBox
        ref={boxRef}
        width={200}
        height={200}
        depth={200}
        perspective={600}
        className="text-3xl"
        faces={{
          front: (
            <TextFace
              texts={["YOU CAN", "JUST", "DO THINGS"]}
              className="text-right justify-end items-end h-full w-full p-2 select-none"
            />
          ),
          back: (
            <TextFace
              texts={["MAKE THINGS", "YOU WISH", "EXISTED"]}
              className="text-left justify-end h-full w-full p-2 select-none"
            />
          ),
          right: (
            <TextFace
              texts={["MAKE THINGS", "YOU WISH", "EXISTED"]}
              className="text-left justify-end h-full w-full p-2 select-none"
            />
          ),
          left: (
            <TextFace
              texts={["BREAK", "THINGS", "MOVE", "FAST"]}
              className="items-end w-full h-full p-2 select-none"
            />
          ),
          top: (
            <TextFace
              texts={["YOU CAN", "JUST", "DO THINGS"]}
              className="text-right justify-end items-end h-full w-full p-2 select-none"
            />
          ),
          bottom: (
            <TextFace
              texts={["BREAK", "THINGS", "MOVE", "FAST"]}
              className="items-end w-full h-full p-2 select-none"
            />
          ),
        }}
      />
    </div>
  )
}