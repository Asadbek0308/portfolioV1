import React, { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import InfiniteText from '../animations/InfiniteText'

gsap.registerPlugin(ScrollTrigger, SplitText)

// --- data -------------------------------------------------------------
const IELTS_OVERALL = 7.5
const IELTS_SKILLS = [
  { label: 'Listening', score: 9 },
  { label: 'Reading', score: 8.5 },
  { label: 'Writing', score: 6.5 },
  { label: 'Speaking', score: 6 },
]

const NATIONAL_CERTS = [
  { subject: 'Mathematics', local: 'Matematika', grade: 'A', percent: 100 },
  { subject: 'Mother Tongue', local: 'Ona tili', grade: 'A', percent: 100 },
  { subject: 'History', local: 'Tarix', grade: 'B+', percent: 99.7 },
]

// --- ring geometry ------------------------------------------------------
const SKILL_R = 42
const SKILL_CIRC = 2 * Math.PI * SKILL_R
const OVERALL_R = 80
const OVERALL_CIRC = 2 * Math.PI * OVERALL_R
const CERT_R = 54
const CERT_CIRC = 2 * Math.PI * CERT_R

const Academics = () => {
  const containerRef = useRef(null)
  const heroTitleRef = useRef(null)
  const textSectionRef = useRef(null)
  const revealTextRef = useRef(null)
  const reduceMotion = useRef(false)

  const overallCircleRef = useRef(null)
  const overallCountRef = useRef(null)
  const skillCircleRefs = useRef([])
  const skillCountRefs = useRef([])
  const certCircleRefs = useRef([])
  const certCountRefs = useRef([])

  const tiltSetters = useRef(new Map())

  const getTiltSetter = (el) => {
    if (!tiltSetters.current.has(el)) {
      tiltSetters.current.set(el, {
        rotX: gsap.quickTo(el, 'rotateX', { duration: 0.6, ease: 'power3.out' }),
        rotY: gsap.quickTo(el, 'rotateY', { duration: 0.6, ease: 'power3.out' }),
        scale: gsap.quickTo(el, 'scale', { duration: 0.6, ease: 'power3.out' }),
      })
    }
    return tiltSetters.current.get(el)
  }

  const handleTiltMove = (e) => {
    if (reduceMotion.current) return
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    const setter = getTiltSetter(card)
    setter.rotX((0.5 - py) * 12)
    setter.rotY((px - 0.5) * 12)
    setter.scale(1.04)
  }
  const handleTiltLeave = (e) => {
    if (reduceMotion.current) return
    const setter = getTiltSetter(e.currentTarget)
    setter.rotX(0)
    setter.rotY(0)
    setter.scale(1)
  }

  useLayoutEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // fills a ring from empty and counts its label up from 0 the first
    // time it scrolls into view
    const animateRing = (circleEl, countEl, value, max, decimals, suffix = '') => {
      if (!circleEl) return
      const circumference = Number(circleEl.dataset.circumference)
      const targetOffset = circumference * (1 - value / max)
      gsap.fromTo(
        circleEl,
        { strokeDashoffset: circumference },
        { strokeDashoffset: targetOffset, duration: 1.4, ease: 'power3.out' }
      )
      if (countEl) {
        const proxy = { val: 0 }
        gsap.to(proxy, {
          val: value,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate: () => {
            countEl.textContent = proxy.val.toFixed(decimals) + suffix
          },
        })
      }
    }

    const ctx = gsap.context(() => {
      // --- hero title reveal ---
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

      // --- overall IELTS band ring ---
      if (overallCircleRef.current) {
        ScrollTrigger.create({
          trigger: overallCircleRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => animateRing(overallCircleRef.current, overallCountRef.current, IELTS_OVERALL, 9, 1),
        })
      }

      // --- skill rings ---
      IELTS_SKILLS.forEach((skill, i) => {
        const circle = skillCircleRefs.current[i]
        const count = skillCountRefs.current[i]
        if (!circle) return
        ScrollTrigger.create({
          trigger: circle,
          start: 'top 92%',
          once: true,
          onEnter: () => animateRing(circle, count, skill.score, 9, 1),
        })
      })

      // --- national certificate rings ---
      NATIONAL_CERTS.forEach((cert, i) => {
        const circle = certCircleRefs.current[i]
        const count = certCountRefs.current[i]
        if (!circle) return
        ScrollTrigger.create({
          trigger: circle,
          start: 'top 90%',
          once: true,
          onEnter: () => animateRing(circle, count, cert.percent, 100, 1, '%'),
        })
      })

      // --- pinned scrub text reveal ---
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
        <InfiniteText text="STUDENT" />
        <h1
          ref={heroTitleRef}
          className="text-5xl md:text-8xl uppercase font-bold py-6 text-center px-6 tracking-tight"
        >
          Academics
        </h1>
        <InfiniteText text="IELTS · MILLIY SERTIFIKAT" />
      </div>

      {/* INTRO */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pb-20 text-center">
        <p className="text-lg md:text-xl font-medium leading-relaxed text-base-content/80">
          Outside of the code editor, I hold myself to the same standard: an IELTS Academic result
          that reflects strong command of English, and a national certificate in mathematics, my
          mother tongue, and the history of Uzbekistan — each scored through the state testing
          agency's standardized exams.
        </p>
      </section>

      {/* IELTS */}
      <section className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">IELTS Academic</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Overall Band 7.5</h2>
        </div>

        <div className="flex flex-col items-center gap-16 [perspective:1200px]">
          {/* overall ring */}
          <div
            onPointerMove={handleTiltMove}
            onPointerLeave={handleTiltLeave}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative w-56 h-56 md:w-64 md:h-64 will-change-transform"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r={OVERALL_R} fill="none" strokeWidth="10" className="stroke-base-content/10" />
              <circle
                ref={overallCircleRef}
                cx="100"
                cy="100"
                r={OVERALL_R}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={OVERALL_CIRC}
                strokeDashoffset={OVERALL_CIRC}
                data-circumference={OVERALL_CIRC}
                className="stroke-primary"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span ref={overallCountRef} className="text-4xl md:text-5xl font-bold tabular-nums">
                {IELTS_OVERALL.toFixed(1)}
              </span>
              <span className="text-xs uppercase tracking-widest text-base-content/50 mt-1">Overall</span>
            </div>
          </div>

          {/* skill rings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            {IELTS_SKILLS.map((skill, i) => (
              <div
                key={skill.label}
                onPointerMove={handleTiltMove}
                onPointerLeave={handleTiltLeave}
                style={{ transformStyle: 'preserve-3d' }}
                className="flex flex-col items-center gap-3 will-change-transform"
              >
                <div className="relative w-28 h-28 md:w-32 md:h-32">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r={SKILL_R} fill="none" strokeWidth="7" className="stroke-base-content/10" />
                    <circle
                      ref={(el) => {
                        skillCircleRefs.current[i] = el
                      }}
                      cx="50"
                      cy="50"
                      r={SKILL_R}
                      fill="none"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={SKILL_CIRC}
                      strokeDashoffset={SKILL_CIRC}
                      data-circumference={SKILL_CIRC}
                      className="stroke-primary transition-colors duration-300 group-hover:stroke-secondary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      ref={(el) => {
                        skillCountRefs.current[i] = el
                      }}
                      className="text-xl md:text-2xl font-bold tabular-nums"
                    >
                      {skill.score.toFixed(1)}
                    </span>
                  </div>
                </div>
                <span className="text-xs md:text-sm uppercase tracking-widest text-base-content/60 font-semibold">
                  {skill.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE DIVIDER */}
      <div className="py-6 border-y border-base-content/10">
        <InfiniteText text="MATEMATIKA · ONA TILI · TARIX" />
      </div>

      {/* NATIONAL CERTIFICATE */}
      <section className="px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">
            Milliy Sertifikat — Uzbekistan
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">National Certificate Results</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 [perspective:1200px]">
          {NATIONAL_CERTS.map((cert, i) => (
            <div
              key={cert.subject}
              onPointerMove={handleTiltMove}
              onPointerLeave={handleTiltLeave}
              style={{ transformStyle: 'preserve-3d' }}
              className="group relative flex flex-col items-center gap-5 p-8 rounded-3xl bg-base-200/50 border border-base-content/10 will-change-transform"
            >
              <div className="relative w-32 h-32 md:w-36 md:h-36">
                <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                  <circle cx="70" cy="70" r={CERT_R} fill="none" strokeWidth="9" className="stroke-base-content/10" />
                  <circle
                    ref={(el) => {
                      certCircleRefs.current[i] = el
                    }}
                    cx="70"
                    cy="70"
                    r={CERT_R}
                    fill="none"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={CERT_CIRC}
                    strokeDashoffset={CERT_CIRC}
                    data-circumference={CERT_CIRC}
                    className="stroke-primary transition-colors duration-300 group-hover:stroke-secondary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    ref={(el) => {
                      certCountRefs.current[i] = el
                    }}
                    className="text-lg md:text-xl font-bold tabular-nums"
                  >
                    {cert.percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="badge badge-primary badge-lg font-bold text-base px-4 py-3">
                {cert.grade}
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold">{cert.subject}</h3>
                <p className="text-sm text-base-content/50 uppercase tracking-wide">{cert.local}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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
            Scores are a snapshot, not the whole picture — but they're proof that the same discipline
            behind every animation shows up in the classroom too. 
          </p>
        </div>
      </section>
    </div>
  )
}

export default Academics