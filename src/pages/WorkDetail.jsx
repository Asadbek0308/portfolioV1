// src/pages/WorkDetail.jsx — one page for every project in src/works
import { useLayoutEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { WORKS, WORKS_BY_SLUG } from '../lib/works'

gsap.registerPlugin(ScrollTrigger)

const ArrowIcon = () => (
  <span aria-hidden="true" className="relative flex items-center justify-center w-7 h-7 rounded-full border border-current overflow-hidden group-hover:bg-base-content group-hover:text-base-100 transition-colors duration-300">
    <span className="absolute transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:translate-x-full">↗</span>
    <span className="absolute transition-transform duration-300 ease-in-out translate-y-full -translate-x-full group-hover:translate-y-0 group-hover:translate-x-0">↗</span>
  </span>
)

export default function WorkDetail() {
  const { slug } = useParams()
  // key: each project gets a fresh page, so animations restart cleanly
  return <WorkDetailView key={slug} slug={slug} />
}

function WorkDetailView({ slug }) {
  const containerRef = useRef(null)
  const work = WORKS_BY_SLUG[slug]

  useLayoutEffect(() => {
    if (!work) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduceMotion) return

      gsap.from('.wd-hero > *', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        delay: 0.1,
      })

      // Cover slowly scales down as it scrolls through the viewport
      gsap.fromTo(
        '.wd-cover img',
        { scale: 1.15 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.wd-cover', start: 'top bottom', end: 'bottom top', scrub: true },
        }
      )

      gsap.set('.wd-reveal', { opacity: 0, y: 30 })
      ScrollTrigger.batch('.wd-reveal', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out', overwrite: true }),
      })
    }, containerRef)

    const img = containerRef.current?.querySelector('.wd-cover img')
    const refresh = () => ScrollTrigger.refresh()
    if (img && !img.complete) img.addEventListener('load', refresh, { once: true })

    return () => {
      img?.removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [work])

  if (!work) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-center bg-base-100 text-base-content font-sans px-6">
        <h1 className="text-3xl font-bold mb-4 tracking-tight">Project Not Found</h1>
        <p className="text-base-content/60 mb-8 max-w-sm">
          No project matching <code className="font-mono bg-base-200 px-2 py-1 rounded text-xs">{slug}</code> was found.
        </p>
        <Link to="/work" className="px-5 py-2.5 rounded-full bg-base-content text-base-100 text-xs font-mono font-medium hover:opacity-90 transition-opacity">
          ← Back to Work
        </Link>
      </div>
    )
  }

  const index = WORKS.indexOf(work)
  const total = WORKS.length
  const prev = total > 1 ? WORKS[(index - 1 + total) % total] : null
  const next = total > 1 ? WORKS[(index + 1) % total] : null

  const meta = [
    ['Type', work.type],
    ['Year', work.year],
    ['Role', work.role],
  ].filter(([, value]) => value)

  return (
    <article ref={containerRef} className="bg-base-100 text-base-content font-sans">
      {/* HERO */}
      <header className="wd-hero max-w-6xl mx-auto px-6 md:px-12 pt-36 pb-12">
        <Link
          to="/work"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-base-content/50 hover:text-base-content transition-colors mb-8"
        >
          ← Back to Work
        </Link>
        {/* clamp: long names (e.g. PHILOSOPHIFY) still fit on a phone */}
        <h1 className="text-[clamp(2.5rem,11vw,8rem)] font-bold uppercase tracking-tighter leading-[0.9] break-words">
          {work.title}
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-base-content/70 max-w-2xl">{work.tagline}</p>

        <div className="mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-base-content/10 pt-6">
          <dl className="flex flex-wrap gap-x-12 gap-y-4">
            {meta.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] uppercase tracking-widest text-base-content/40 font-semibold">{label}</dt>
                <dd className="text-base font-medium mt-1">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap gap-6">
            {work.links.live && (
              <a href={work.links.live} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 font-bold uppercase tracking-tight">
                Visit site <ArrowIcon />
              </a>
            )}
            {work.links.repo && (
              <a href={work.links.repo} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 font-bold uppercase tracking-tight">
                Source code <ArrowIcon />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* COVER */}
      <div className="wd-cover max-w-6xl mx-auto px-6 md:px-12">
        <div className="relative w-full aspect-4/3 md:aspect-16/9 overflow-hidden rounded-3xl bg-base-200">
          <img
            src={work.cover}
            alt={work.coverAlt || work.title}
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
          />
        </div>
      </div>

      {/* OVERVIEW */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid grid-cols-1 md:grid-cols-12 gap-10">
        <h2 className="wd-reveal md:col-span-4 text-xs uppercase tracking-widest text-primary font-bold">Overview</h2>
        <div className="md:col-span-8 space-y-6">
          <p className="wd-reveal text-2xl md:text-3xl font-medium leading-snug">{work.summary}</p>
          {work.overview.map((paragraph, i) => (
            <p key={i} className="wd-reveal text-lg leading-relaxed text-base-content/70">
              {paragraph}
            </p>
          ))}
          {work.stack.length > 0 && (
            <ul className="wd-reveal flex flex-wrap gap-2 pt-4" aria-label="Tech stack">
              {work.stack.map((tech) => (
                <li
                  key={tech}
                  className="text-[11px] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full bg-base-content/5 text-base-content/60 border border-base-content/10"
                >
                  {tech}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FEATURES */}
      {work.features.length > 0 && (
        <section className="border-t border-base-content/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-24">
            <h2 className="wd-reveal text-xs uppercase tracking-widest text-primary font-bold mb-12">Features</h2>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              {work.features.map((feature, i) => (
                <li key={feature.title} className="wd-reveal border-t border-base-content/10 py-8 flex gap-6">
                  <span className="font-mono text-sm text-base-content/40 pt-1">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight mb-3">{feature.title}</h3>
                    <p className="text-base leading-relaxed text-base-content/70">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ENGINEERING NOTES */}
      {work.engineering.length > 0 && (
        <section className="bg-base-200/50 border-y border-base-content/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-24 grid grid-cols-1 md:grid-cols-12 gap-10">
            <h2 className="wd-reveal md:col-span-4 text-xs uppercase tracking-widest text-primary font-bold">
              Under the hood
            </h2>
            <ul className="md:col-span-8 space-y-5">
              {work.engineering.map((note) => (
                <li key={note} className="wd-reveal text-lg leading-relaxed text-base-content/80">
                  — {note}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* PREV / NEXT */}
      {prev && next && (
        <nav aria-label="More projects" className="max-w-6xl mx-auto px-6 md:px-12 py-16 flex items-center justify-between gap-4">
          <Link to={`/work/${prev.slug}`} className="group flex flex-col items-start gap-1 max-w-[45%]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-base-content/40">← Previous</span>
            <span className="text-lg md:text-2xl font-bold truncate w-full group-hover:opacity-70 transition-opacity">{prev.title}</span>
          </Link>
          <Link to={`/work/${next.slug}`} className="group flex flex-col items-end text-right gap-1 max-w-[45%]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-base-content/40">Next →</span>
            <span className="text-lg md:text-2xl font-bold truncate w-full group-hover:opacity-70 transition-opacity">{next.title}</span>
          </Link>
        </nav>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 text-center">
        <Link to="/work" className="group inline-flex items-center gap-3 text-xl font-bold uppercase tracking-tight">
          All projects <ArrowIcon />
        </Link>
      </div>
    </article>
  )
}
