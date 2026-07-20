import React, { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import InfiniteText from '../animations/InfiniteText'
import GlitchImage from '../animations/GlitchImage'
import demo_portfolio from '../assets/demo_portfolio.JPG'
import { Link } from 'react-router-dom'
import RecentProjects from '../animations/RecentProjects'

gsap.registerPlugin(ScrollTrigger, SplitText)

const Home = () => {
  const containerRef = useRef(null)
  const heroSpotRef = useRef(null)
  const targetSpotRef = useRef(null)
  const imageWrapperRef = useRef(null)

  const textSectionRef = useRef(null)
  const revealTextRef = useRef(null)

  const [isGrayscale, setIsGrayscale] = useState(true)

  useLayoutEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const ctx = gsap.context(() => {
      // --- 1. HERO TO ABOUT CARD FLIP ANIMATION ---
      const heroSpot = heroSpotRef.current
      const targetSpot = targetSpotRef.current
      const imgWrapper = imageWrapperRef.current
      let flipTween

      if (heroSpot && targetSpot && imgWrapper) {
        const setStartState = () => {
          const heroBox = heroSpot.getBoundingClientRect()
          const targetBox = targetSpot.getBoundingClientRect()

          gsap.set(imgWrapper, {
            x: heroBox.left + heroBox.width / 2 - (targetBox.left + targetBox.width / 2),
            y: heroBox.top + heroBox.height / 2 - (targetBox.top + targetBox.height / 2),
            scaleX: heroBox.width / targetBox.width,
            scaleY: heroBox.height / targetBox.height,
            rotateY: -180,
            transformOrigin: '50% 50%',
            force3D: true,
          })
        }

        setStartState()

        flipTween = gsap.to(imgWrapper, {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotateY: 0,
          rotation: 0,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            endTrigger: targetSpot,
            end: 'center center',
            scrub: 1,
            invalidateOnRefresh: true,
            onRefreshInit: setStartState,
            onUpdate: (self) => setIsGrayscale(self.progress < 0.3),
          },
        })
      }

      // --- 2. PINNED SPLITTEXT WORD REVEAL ---
      let split
      if (revealTextRef.current && textSectionRef.current) {
        split = new SplitText(revealTextRef.current, {
          type: 'words',
          wordsClass: 'will-change-transform inline-block',
        })

        gsap.fromTo(
          split.words,
          { opacity: 0.15 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: 'none',
            scrollTrigger: {
              trigger: textSectionRef.current,
              start: 'top top',
              end: '+=150%',
              pin: true,
              pinSpacing: true,
              scrub: 0.5,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          }
        )
      }

      const refresh = () => requestAnimationFrame(() => ScrollTrigger.refresh())
      document.fonts?.ready?.then(refresh)
      const img = imageWrapperRef.current?.querySelector('img')
      if (img && !img.complete) img.addEventListener('load', refresh, { once: true })

      return () => {
        split?.revert()
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="relative text-7xl mt-30">
      {/* HERO SECTION */}
      <div className="flex flex-col justify-center items-center overflow-x-hidden">
        <InfiniteText text="FRONTEND DEVELOPER" />
        <div className="w-full h-fit flex justify-center items-center gap-3 sm:gap-6 py-5 box-content">
          <h1 className="text-5xl md:text-9xl uppercase font-bold">asadbek</h1>
          <div
            ref={heroSpotRef}
            className="aspect-4/5 w-12 sm:w-16 md:w-24 lg:w-28 opacity-0 pointer-events-none shrink-0"
          />
        </div>
        <InfiniteText text="UI/UX DESIGNER" />
      </div>

      {/* ABOUT SECTION */}
      <section className="min-h-screen w-full text-base-content font-sans flex items-center justify-center p-6 md:p-12 lg:p-20">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="md:col-span-4 h-full flex flex-col justify-between space-y-12 lg:space-y-24">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight">Hey!</h1>
            <p className="text-lg lg:text-xl font-medium leading-relaxed text-base-content/90">
              I'm Asadbek, a front-end developer skilled in building responsive, high-performance web applications with React, JavaScript, and Tailwind CSS.
            </p>
          </div>

          <div className="md:col-span-4 flex justify-center items-center [perspective:1200px]">
            <div ref={targetSpotRef} className="w-full aspect-4/5 rounded-3xl relative [transform-style:preserve-3d]">
              <div
                ref={imageWrapperRef}
                className="w-full h-full rounded-3xl overflow-hidden shadow-2xl will-change-transform [transform-style:preserve-3d]"
              >
                <GlitchImage
                  grayscale={isGrayscale}
                  className="w-full h-full object-cover"
                  // src={demo_portfolio}
                  alt="Asadbek portfolio preview"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-4 h-full flex flex-col justify-end space-y-6 lg:space-y-8">
            <p className="text-base lg:text-lg font-normal leading-relaxed text-base-content/80">
              I specialize in creative UI design, modern web engineering, and fluid GSAP animations to craft engaging digital experiences.
            </p>
            <p className="text-base lg:text-lg font-normal leading-relaxed text-base-content/80">
              Over the years, I've delivered custom web platforms, dynamic portfolio experiences, and scalable design systems built for modern performance.
            </p>
            <div>
              <Link
                to="work"
                className="inline-flex items-center gap-3 text-base font-semibold text-base-content hover:opacity-85 transition-opacity group"
              >
                <span className="text-xl font-bold uppercase tracking-tight">Get Started</span>
                <span className="relative flex items-center justify-center w-8 h-8 rounded-full border border-current overflow-hidden group-hover:bg-base-content group-hover:text-base-100 transition-colors duration-300">
                  <span className="absolute transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:translate-x-full">↗</span>
                  <span className="absolute transition-transform duration-300 ease-in-out translate-y-full -translate-x-full group-hover:translate-y-0 group-hover:translate-x-0">↗</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <RecentProjects/>


      {/* PINNED TEXT REVEAL SECTION */}
      <section
        ref={textSectionRef}
        className="h-screen w-full flex justify-center items-center p-6 md:p-12 text-base-content font-sans"
      >
        <div className="max-w-5xl text-center">
          <p
            ref={revealTextRef}
            className="text-3xl sm:text-5xl md:text-6xl font-medium leading-tight tracking-tight"
          >
            From idea to launch. Clean, scalable digital products built to move fast, stay simple, and perform in real-world use, driven by clarity, structured systems, and intentional design.
          </p>
        </div>
      </section>

    </div>
  )
}

export default Home