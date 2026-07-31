import React, { useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const GALLERY_DATA = [
  { id: 1, title: 'Neon Horizon', category: 'Cyberpunk', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80' },
  { id: 2, title: 'Monochrome Structure', category: 'Architecture', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80' },
  { id: 3, title: 'Kinetic Waves', category: 'Abstract', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1000&q=80' },
  { id: 4, title: 'Emerald Forest', category: 'Nature', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80' },
  { id: 5, title: 'Desert Solitude', category: 'Landscape', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80' },
  { id: 6, title: 'Urban Geometry', category: 'Street', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80' },
  { id: 7, title: 'Prism Light', category: 'Minimalism', image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=80' },
  { id: 8, title: 'Cosmic Dust', category: 'Space', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80' },
  { id: 9, title: 'Alpine Summit', category: 'Mountains', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80' },
  { id: 10, title: 'Fluid Form', category: '3D Render', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80' },
]

const HorizontalGallery = () => {
  const triggerRef = useRef(null)
  const trackRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const track = trackRef.current
      if (!track) return

      const totalWidth = track.scrollWidth
      const viewportWidth = window.innerWidth
      
      // Starting offset (moves cards further right before scroll triggers)
      const initialOffset = viewportWidth * 0.4 // Adjust factor (e.g., 0.4 = 40% screen width shift right)
      const xDistance = totalWidth - viewportWidth + initialOffset

      if (xDistance <= 0) return

      // Set starting position further to the right
      gsap.set(track, { x: initialOffset })

      // Animate from initialOffset to the full scroll end
      gsap.to(track, {
        x: -(totalWidth - viewportWidth)*1.5,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: `+=${xDistance}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }, triggerRef)

    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 100)

    return () => {
      clearTimeout(timer)
      ctx.revert()
    }
  }, [])

  return (
    <div className=" overflow-x-hidden">
      {/* Top Section */}
      <section className="flex h-screen w-full items-center justify-center p-8/50">
        <div className="max-w-xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Horizontal Scroll
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Scroll down to trigger the horizontal gallery.
          </p>
        </div>
      </section>

      {/* Pin Wrapper */}
      <div ref={triggerRef} className="h-screen w-full overflow-hidden">
        <div
          ref={trackRef}
          className="flex h-full items-center gap-6 px-12"
          style={{ width: 'max-content', flexWrap: 'nowrap' }}
        >
          {GALLERY_DATA.map((item, index) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-white/10 shadow-xl"
              style={{ width: '280px', height: '360px', flex: '0 0 280px' }}
            >
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80" />

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-slate-200 backdrop-blur-md">
                    {item.category}
                  </span>
                  <span>{String(index + 1).padStart(2, '0')} / 10</span>
                </div>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <section className="flex h-screen w-full items-center justify-center p-8/50">
        <div className="max-w-xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            End of Gallery
          </h2>
          <p className="mt-4 text-slate-400">
            Vertical scrolling resumes naturally.
          </p>
        </div>
      </section>
    </div>
  )
}

export default HorizontalGallery