import React, { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import InfiniteText from '../animations/InfiniteText'
import FilterProjects from '../animations/FilterProjects'

gsap.registerPlugin(ScrollTrigger, SplitText)

const Animations = () => {
  const containerRef = useRef(null)
  const heroTitleRef = useRef(null)
  const textSectionRef = useRef(null)
  const revealTextRef = useRef(null)
  const reduceMotion = useRef(false)

  useLayoutEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      // --- HERO TITLE CHAR REVEAL ---
      let heroSplit
      if (heroTitleRef.current) {
        heroSplit = new SplitText(heroTitleRef.current, {
          type: 'chars',
          charsClass: 'inline-block will-change-transform',
        })
        gsap.from(heroSplit.chars, {
          yPercent: 120,
          opacity: 0,
          rotate: 6,
          stagger: 0.02,
          duration: 0.9,
          ease: 'power4.out',
          delay: 0.15,
        })
      }

      // --- PINNED SPLITTEXT WORD REVEAL ---
      let textSplit
      if (revealTextRef.current && textSectionRef.current) {
        if (reduceMotion.current) {
          gsap.set(revealTextRef.current, { opacity: 1 })
        } else {
          textSplit = new SplitText(revealTextRef.current, {
            type: 'words',
            wordsClass: 'inline-block will-change-transform',
          })
          gsap.fromTo(
            textSplit.words,
            { opacity: 0.15 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: 'none',
              scrollTrigger: {
                trigger: textSectionRef.current,
                start: 'top top',
                end: '+=120%',
                pin: true,
                pinSpacing: true,
                scrub: 0.5,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            }
          )
        }
      }

      const refresh = () => requestAnimationFrame(() => ScrollTrigger.refresh())
      document.fonts?.ready?.then(refresh)

      return () => {
        heroSplit?.revert()
        textSplit?.revert()
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative bg-base-100 text-base-content font-sans">
      {/* HERO */}
      <div className="flex flex-col justify-center items-center overflow-x-hidden pt-24 pb-10">
        <InfiniteText text="EXPERIMENTS" />
        <h1
          ref={heroTitleRef}
          className="text-5xl md:text-8xl uppercase font-bold py-6 text-center px-6 tracking-tight"
        >
          Animations Lab
        </h1>
        <InfiniteText text="GSAP · CANVAS · SCROLLTRIGGER" />
      </div>

      {/* PROJECT FILTER GRID */}
      <FilterProjects />

      {/* PINNED SCRUB TEXT */}
      <section
        ref={textSectionRef}
        className="h-screen w-full flex justify-center items-center p-6 md:p-12 text-base-content font-sans"
      >
        <div className="max-w-5xl text-center">
          <p
            ref={revealTextRef}
            className="text-3xl sm:text-5xl md:text-6xl font-medium leading-tight tracking-tight"
          >
            Every effect here starts as a bug: a jitter, a mistimed frame, a snap that shouldn't happen.
            Fixing it becomes the animation.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Animations