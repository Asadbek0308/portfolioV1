// ScrollToTop.jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getLenis } from '../lib/lenis'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const lenis = getLenis()
    if (lenis) {
      // Lenis keeps its own scroll target; a plain window.scrollTo can be undone by it
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}

export default ScrollToTop
