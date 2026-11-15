import { Suspense, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Link } from 'react-router-dom'
import InfiniteText from '../animations/InfiniteText'
import { WORKS } from '../lib/works'
import { workPlaceholders } from '../lib/placeholders'

gsap.registerPlugin(ScrollTrigger, SplitText)

// --- placeholder data ---------------------------------------------------
// The experience entries are placeholders — swap in real roles when ready.
// Projects are NOT listed here: they come from src/works (see its README),
// topped up with placeholders from src/lib/placeholders.js.
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

// Real projects first, then placeholders for the remaining slots
const CARDS = [...WORKS, ...workPlaceholders(WORKS.length)]

const StackTags = ({ stack }) => (
  <div className="flex flex-wrap gap-2 pt-2">
    {stack.map((tech) => (
      <span
        key={tech}
        className="text-[11px] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full bg-base-content/5 text-base-content/60 border border-base-content/10"
      >
        {tech}
      </span>
    ))}
  </div>
)

// One card. Real projects link to their page and can bring their own hover
// effect (src/works/<slug>/Hover.jsx); placeholders are static unless given one.
function ProjectCard({ project, onMove, onLeave }) {
  const [active, setActive] = useState(false)
  const isReal = Boolean(project.slug)
  const Hover = project.Hover

  const content = (
    <>
      <div className="relative w-full aspect-4/3 overflow-hidden">
        <img
          src={project.cover}
          alt={project.coverAlt || project.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute top-4 right-4 z-10 badge badge-neutral badge-sm uppercase tracking-wide font-semibold">
          {isReal ? project.year : 'Case study coming soon'}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-widest text-primary font-semibold">{project.type}</span>
        <h3 className="text-xl font-bold">{project.title}</h3>
        <p className="text-sm text-base-content/60">{project.summary}</p>
        <StackTags stack={project.stack} />
      </div>

      {/* Project-specific hover effect, layered over the whole card */}
      {Hover && (
        <Suspense fallback={null}>
          <Hover active={active} />
        </Suspense>
      )}
    </>
  )

  const shared = {
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    style: { transformStyle: 'preserve-3d' },
    className:
      'work-project-card group relative block rounded-3xl overflow-hidden bg-base-200/50 border border-base-content/10 will-change-transform',
  }

  // Hover state drives the card's effect (placeholders can have one too)
  const hoverHandlers = {
    onPointerEnter: () => setActive(true),
    onPointerLeave: (e) => {
      setActive(false)
      onLeave(e)
    },
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  }

  if (!isReal) {
    return (
      <div {...shared} {...(Hover ? hoverHandlers : {})}>
        {content}
      </div>
    )
  }

  return (
    <Link {...shared} {...hoverHandlers} to={`/work/${project.slug}`}>
      {content}
    </Link>
  )
}

const Work = () => {
  const containerRef = useRef(null)
  const heroTitleRef = useRef(null)
  const timelineRef = useRef(null)
  const timelineFillRef = useRef(null)
  const textSectionRef = useRef(null)
  const revealTextRef = useRef(null)
  const projectsGridRef = useRef(null)
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

    // The pinned text below the cards is positioned from a one-time measurement.
    // Whenever the project grid changes height (projects added or removed, cards
    // reflowing on resize), re-measure so the text never slides up into the cards.
    let timer = null
    let lastHeight = projectsGridRef.current?.offsetHeight ?? 0
    const ro = new ResizeObserver(([entry]) => {
      const height = Math.round(entry.contentRect.height)
      if (height === lastHeight) return
      lastHeight = height
      clearTimeout(timer)
      timer = setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    if (projectsGridRef.current) ro.observe(projectsGridRef.current)

    return () => {
      ro.disconnect()
      clearTimeout(timer)
      ctx.revert()
    }
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
      {/* extra bottom space so the pinned text below never crowds the last row of cards */}
      <section className="px-6 md:px-12 pt-24 pb-40 md:pb-56 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-10 text-center">
          Featured Projects
        </p>

        <div ref={projectsGridRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 [perspective:1200px]">
          {CARDS.map((project) => (
            <ProjectCard
              key={project.slug || project.id}
              project={project}
              onMove={handleCardMove}
              onLeave={handleCardLeave}
            />
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