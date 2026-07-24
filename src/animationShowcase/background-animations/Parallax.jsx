import React, { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const CHAPTERS = [
  {
    title: "TOKYO",
    subtitle: "A PHOTOGRAPHY PROJECT",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "AERIAL",
    subtitle: "A PHOTOGRAPHY PROJECT",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "PRAGUE",
    subtitle: "A PHOTOGRAPHY PROJECT",
    image: "https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1920&q=80",
  },
  {
    title: "COASTLINE",
    subtitle: "A PHOTOGRAPHY PROJECT",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1920&q=80",
  },
]

export default function CinematicScroll() {
  const containerRef = useRef(null)
  const sectionRefs = useRef([])
  const imageRefs = useRef([])
  const textRefs = useRef([])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Loop through each full-screen section to create individual parallax triggers
      sectionRefs.current.forEach((section, i) => {
        if (!section) return

        const img = imageRefs.current[i]
        const text = textRefs.current[i]

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top bottom", // Starts animating as soon as the section enters the bottom viewport
            end: "bottom top",   // Ends when the section leaves the top viewport
            scrub: true,         // Links animation directly to scroll fluidly
          },
        })

        // Parallax Effect: Background image moves slower than the text layer
        if (img) {
          tl.fromTo(img, { yPercent: -25 }, { yPercent: 25, ease: "none" }, 0)
        }

        // Text subtle drift up for extra depth separation
        if (text) {
          tl.fromTo(text, { yPercent: 8 }, { yPercent: -8, ease: "none" }, 0)
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="w-full bg-black select-none">
      {CHAPTERS.map((chapter, i) => (
        <section
          key={chapter.title}
          ref={(el) => (sectionRefs.current[i] = el)}
          className="relative h-screen w-full overflow-hidden border-b border-black/20"
        >
          {/* Background Image Container */}
          <div className="absolute inset-0 h-[124%] w-full -top-[12%] will-change-transform">
            <img
              ref={(el) => (imageRefs.current[i] = el)}
              src={chapter.image}
              alt={chapter.title}
              className="h-full w-full object-cover brightness-[0.85]"
            />
            {/* Subtle overlay darkening to maintain text contrast */}
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/40" />
          </div>

          {/* Cinematic Content Layer */}
          <div
            ref={(el) => (textRefs.current[i] = el)}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 will-change-transform"
          >
            <h1 className="text-6xl font-black tracking-tighter text-white sm:text-8xl md:text-[11rem] drop-shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              {chapter.title}
            </h1>
            <p className="mt-2 text-xs font-semibold tracking-[0.4em] text-white/90 sm:text-sm md:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              {chapter.subtitle}
            </p>
          </div>
        </section>
      ))}
    </div>
  )
}