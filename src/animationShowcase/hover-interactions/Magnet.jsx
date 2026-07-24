import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

const Magnet = ({ children = <button>Hover Me</button> }) => {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const xTo = gsap.quickTo(element, "x", { duration: 1, ease: "elastic.out(1, 0.3)" })
    const yTo = gsap.quickTo(element, "y", { duration: 1, ease: "elastic.out(1, 0.3)" })

    const mouseMove = (e) => {
      const { clientX, clientY } = e
      const { width, height, left, top } = element.getBoundingClientRect()
      const x = clientX - (left + width / 2)
      const y = clientY - (top + height / 2)
      xTo(x)
      yTo(y)
    }

    const mouseLeave = () => {
      xTo(0)
      yTo(0)
    }

    element.addEventListener("mousemove", mouseMove)
    element.addEventListener("mouseleave", mouseLeave)

    return () => {
      element.removeEventListener("mousemove", mouseMove)
      element.removeEventListener("mouseleave", mouseLeave)
    }
  }, [])

  return React.cloneElement(children, { ref })
}

export default Magnet