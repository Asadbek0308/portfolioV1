// ScrollToTop.jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) // instant, ignores any global smooth-scroll CSS
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [pathname])

  return null
}

export default ScrollToTop