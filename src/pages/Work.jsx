import React, { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import InfiniteText from '../animations/InfiniteText'

gsap.registerPlugin(ScrollTrigger, SplitText)

// --- placeholder data ---------------------------------------------------
// Nothing here is a real employer or a shipped case study yet — swap in
// real roles/projects (NavbatUZ, freelance work, etc.) whenever they're
// ready to show publicly.
const EXPERIENCE = [
  {
    role: 'Frontend Developer',
    org: '[Company / Studio Name]',
    period: '[Start] — Present',
    points: [
      'Building responsive interfaces with React, Tailwind CSS, and GSAP',
      'Owning animation and micro-interaction work end to end',
    ],
  },
  {
    role: 'Freelance Web Developer',
    org: 'Independent',
    period: '[Start] — [End]',
    points: [
      'Delivered client sites and landing pages from design to deployment',
      'Prototyped interactive components ahead of handoff',
    ],
  },
  {
    role: 'Started Frontend Development',
    org: 'Self-taught',
    period: '[Year]',
    points: [
      'Learned HTML, CSS, and JavaScript fundamentals',
      'Built first React projects and animation experiments',
    ],
  },
]

const PROJECTS = [
  {
    id: 'proj-1',
    title: '[Project Name]',
    type: 'Web App',
    stack: ['React', 'Tailwind', 'GSAP'],
    desc: 'A line or two on the problem this solved and what you owned.',
    image: 'https://picsum.photos/seed/w1/700/500',
  },
  {
    id: 'proj-2',
    title: '[Project Name]',
    type: 'Landing Page',
    stack: ['React', 'GSAP', 'ScrollTrigger'],
    desc: 'A line or two on the problem this solved and what you owned.',
    image: 'https://picsum.photos/seed/w2/700/500',
  },
  {
    id: 'proj-3',
    title: '[Project Name]',
    type: 'Dashboard',
    stack: ['React', 'Tailwind', 'Vite'],
    desc: 'A line or two on the problem this solved and what you owned.',
    image: 'https://picsum.photos/seed/w3/700/500',
  },
  {
    id: 'proj-4',
    title: '[Project Name]',
    type: 'E-commerce',
    stack: ['React', 'Tailwind'],
    desc: 'A line or two on the problem this solved and what you owned.',
    image: 'https://picsum.photos/seed/w4/700/500',
  },
]

const Work = () => {
  const containerRef = useRef(null)
  const heroTitleRef = useRef(null)
  const timelineRef = useRef(null)
  const timelineFillRef = useRef(null)
  const textSectionRef = useRef(null)
  const revealTextRef = useRef(null)
  const reduceMotion = useRef(false)
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

  const handleCardMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    card.style.setProperty('--mx', `${px * 100}%`)
    card.style.setProperty('--my', `${py * 100}%`)
    if (reduceMotion.current) return
    const setter = getTiltSetter(card)
    setter.rotX((0.5 - py) * 12)
    setter.rotY((px - 0.5) * 12)
    setter.scale(1.03)
  }
  const handleCardLeave = (e) => {
    const card = e.currentTarget
    if (reduceMotion.current) return
    const setter = getTiltSetter(card)
    setter.rotX(0)
    setter.rotY(0)
    setter.scale(1)
  }

  useLayoutEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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

      // --- timeline line draws in as you scroll through it ---
      if (timelineFillRef.current && timelineRef.current) {
        if (reduceMotion.current) {
          gsap.set(timelineFillRef.current, { scaleY: 1 })
        } else {
          gsap.to(timelineFillRef.current, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: timelineRef.current,
              start: 'top 75%',
              end: 'bottom 60%',
              scrub: 0.6,
            },
          })
        }
      }

      // --- project cards fade/rise in as they enter the viewport ---
      gsap.set('.work-project-card', { opacity: 0, y: 40 })
      ScrollTrigger.batch('.work-project-card', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out', overwrite: true }),
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
        <InfiniteText text="EXPERIENCE" />
        <h1
          ref={heroTitleRef}
          className="text-5xl md:text-8xl uppercase font-bold py-6 text-center px-6 tracking-tight"
        >
          Work
        </h1>
        <InfiniteText text="PROJECTS · CASE STUDIES" />
      </div>

      {/* INTRO */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pb-20 text-center">
        <p className="text-lg md:text-xl font-medium leading-relaxed text-base-content/80">
          Still early in the journey — this is the shape the page will hold as real roles and
          shipped projects come in. For now, a preview of how it'll read.
        </p>
      </section>

      {/* EXPERIENCE TIMELINE */}
      <section className="px-6 md:px-12 pb-24 max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-8">Experience</p>
        <div ref={timelineRef} className="relative pl-10">
          <div className="absolute left-[7px] top-0 bottom-0 w-0.5 rounded-full bg-base-content/15" />
          <div
            ref={timelineFillRef}
            className="absolute left-[7px] top-0 w-0.5 h-full rounded-full bg-primary origin-top"
            style={{ transform: 'scaleY(0)' }}
          />
          {EXPERIENCE.map((item, i) => (
            <div key={i} className="relative pb-14 last:pb-0">
              <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-base-100 z-10" />
              <div className="pl-6">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                  <h3 className="text-xl font-bold">{item.role}</h3>
                  <span className="text-sm text-base-content/50">{item.org}</span>
                </div>
                <p className="text-xs uppercase tracking-widest text-base-content/40 font-semibold mb-3">
                  {item.period}
                </p>
                <ul className="space-y-1.5">
                  {item.points.map((point, pi) => (
                    <li key={pi} className="text-base text-base-content/70 leading-relaxed">
                      — {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE DIVIDER */}
      <div className="py-6 border-y border-base-content/10">
        <InfiniteText text="SELECTED WORK" />
      </div>

      {/* PROJECTS */}
      <section className="px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-10 text-center">
          Featured Projects
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 [perspective:1200px]">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              onPointerMove={handleCardMove}
              onPointerLeave={handleCardLeave}
              style={{ transformStyle: 'preserve-3d' }}
              className="work-project-card group relative rounded-3xl overflow-hidden bg-base-200/50 border border-base-content/10 will-change-transform"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 bg-primary/25"
                style={{
                  maskImage: 'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), black, transparent 60%)',
                  WebkitMaskImage: 'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), black, transparent 60%)',
                }}
              />

              <div className="relative w-full aspect-4/3 overflow-hidden">
                <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                <span className="absolute top-4 right-4 z-10 badge badge-neutral badge-sm uppercase tracking-wide font-semibold">
                  Case study coming soon
                </span>
              </div>

              <div className="p-5 flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">
                  {project.type}
                </span>
                <h3 className="text-xl font-bold">{project.title}</h3>
                <p className="text-sm text-base-content/60">{project.desc}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full bg-base-content/5 text-base-content/60 border border-base-content/10"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
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
            The portfolio is a work in progress, same as everything worth building.
            The projects will fill in — the habit of shipping already has.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Work