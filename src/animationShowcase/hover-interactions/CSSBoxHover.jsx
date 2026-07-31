import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react"
import { gsap } from "gsap"

// Helper utility for conditional classes
const cn = (...classes) => classes.filter(Boolean).join(" ")

/**
 * 3D CSS Box Component powered by GSAP
 */
export const CSSBox = forwardRef(
  (
    {
      width = 200,
      height = 200,
      depth = 200,
      faces = {},
      className,
      onMouseEnter,
      onMouseLeave,
      onClick,
      ...props
    },
    ref
  ) => {
    const boxRef = useRef(null)
    const rotation = useRef({ x: 0, y: 0 })

    // Expose control methods via ref
    useImperativeHandle(ref, () => ({
      rotateTo: (rotateX, rotateY, duration = 0.6) => {
        rotation.current = { x: rotateX, y: rotateY }
        return gsap.to(boxRef.current, {
          rotateX,
          rotateY,
          duration,
        //   ease: "power2.out",
        //   ease: "bounce.in",
        })
      },
      getRotation: () => rotation.current,
    }))

    const halfWidth = width / 2
    const halfHeight = height / 2
    const halfDepth = depth / 2

    return (
      <div
        className={cn("relative group cursor-pointer", className)}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          perspective: "1000px",
        }}
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

// Text Content Helper
const BoxText = ({ children, className }) => (
  <div
    className={cn(
      "w-full h-full uppercase flex items-center justify-center p-0 text-xl md:text-2xl font-bold tracking-wider select-none",
      className
    )}
  >
    {children}
  </div>
)

// Main Hover Demo Component
export default function CSSBoxHoverDemo() {
  const boxRefs = useRef([])
  const isRotating = useRef([])
  const currentRotations = useRef([])

  const boxes = [
    { text: "January 15, 2025", size: 300 },
    { text: "Live Q&A", size: 200 },
    { text: "10:00", size: 120 },
    { text: "to", size: 70 },
    { text: "11:30", size: 120 },
    { text: "CET", size: 120 },
    { text: "Online", size: 180 },
    { text: "Recording Available", size: 380 },
    { text: "In English", size: 220 },
    { text: "Register Now", size: 280 },
    { text: "Free Access", size: 240 },
  ]

  useEffect(() => {
    currentRotations.current = new Array(boxes.length).fill(0)
    isRotating.current = new Array(boxes.length).fill(false)
  }, [boxes.length])

  const handleHover = (index) => {
    if (isRotating.current[index]) return

    const box = boxRefs.current[index]
    if (!box) return

    isRotating.current[index] = true

    const nextRotation = currentRotations.current[index] + 90
    currentRotations.current[index] = nextRotation

    // Trigger GSAP rotation animation via imperative handle
    const tween = box.rotateTo(0, nextRotation, 0.5)

    if (tween) {
      tween.then(() => {
        isRotating.current[index] = false
      })
    } else {
      isRotating.current[index] = false
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full py-12 gap-3 overflow-hidden">
      {boxes.map(({ text, size }, index) => (
        <CSSBox
          key={index}
          ref={(el) => {
            boxRefs.current[index] = el
          }}
          width={size}
          height={38}
          depth={size}
          className="hover:z-10"
          onMouseEnter={() => handleHover(index)}
          faces={{
            front: <BoxText>{text}</BoxText>,
            back: <BoxText>{text}</BoxText>,
            left: <BoxText>{text}</BoxText>,
            right: <BoxText>{text}</BoxText>,
          }}
        />
      ))}
    </div>
  )
}