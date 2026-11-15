import { Fragment, memo, useState, useLayoutEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import Flip from 'gsap/Flip'
import { ANIMATIONS, CATEGORIES as SHOWCASE_CATEGORIES } from '../lib/showcase'

gsap.registerPlugin(Flip)

const ALL = 'All Work'
const CATEGORIES = [ALL, ...SHOWCASE_CATEGORIES]

const ProjectCard = memo(function ProjectCard({ project, displayIndex, isSelected }) {
  const badgeRef = useRef(null)

  // The badge is always rendered, so its centring offset is set once and never lost
  useLayoutEffect(() => {
    gsap.set(badgeRef.current, { xPercent: -50, yPercent: -50 })
  }, [])

  const moveBadge = (e, animate) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (animate) {
      gsap.to(badgeRef.current, { x, y, duration: 0.35, ease: 'power3.out', overwrite: 'auto' })
    } else {
      gsap.set(badgeRef.current, { x, y })
    }
  }

  const handleMouseEnter = (e) => {
    if (!isSelected) return
    moveBadge(e, false)
    gsap.to(badgeRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: 'back.out(1.7)',
      overwrite: 'auto',
    })
  }

  const handleMouseMove = (e) => {
    if (isSelected) moveBadge(e, true)
  }

  const handleMouseLeave = () => {
    gsap.to(badgeRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      overwrite: 'auto',
    })
  }

  return (
    <Link
      to={`/animations/${project.slug}`}
      data-flip-id={project.id}
      tabIndex={isSelected ? 0 : -1}
      aria-hidden={!isSelected}
      className={`project-card group relative flex flex-col transition-opacity duration-500 cursor-pointer ${
        isSelected
          ? 'opacity-100 grayscale-0 pointer-events-auto'
          : 'opacity-30 grayscale pointer-events-none'
      }`}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-72 bg-base-200 overflow-hidden mb-3"
      >
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
        />

        <div
          ref={badgeRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 z-20 opacity-0 scale-0 origin-center"
        >
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-base-content text-base-100 text-xs font-mono font-medium shadow-2xl backdrop-blur-md whitespace-nowrap">
            view project
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs font-mono tracking-wider border-t border-base-content/10 pt-3">
        <div className="flex gap-3 items-center">
          <span className="font-bold text-base-content">{displayIndex}</span>
          <span className="text-base-content/80 font-sans font-medium group-hover:text-base-content transition-colors">
            {project.title}
          </span>
        </div>
        <span className="text-base-content/40 uppercase font-sans text-[10px]">
          {project.category}
        </span>
      </div>
    </Link>
  )
})

const sortByCategory = (category) =>
  category === ALL
    ? ANIMATIONS
    : [...ANIMATIONS].sort(
        (a, b) => Number(b.category === category) - Number(a.category === category)
      )

const FilterProjects = () => {
  const [activeFilter, setActiveFilter] = useState(ALL)
  const [projects, setProjects] = useState(ANIMATIONS)
  const flipStateRef = useRef(null)

  useLayoutEffect(() => {
    if (!flipStateRef.current) return

    // Kill any active Flip tweens before running a new animation during rapid clicks
    gsap.killTweensOf('.project-card')

    const flip = Flip.from(flipStateRef.current, {
      targets: '.project-card',
      duration: 0.8,
      ease: 'power3.inOut',
      scale: true,
      prune: true,
      onComplete: () => {
        flipStateRef.current = null
      },
    })
    return () => flip.kill()
  }, [projects])

  const handleFilterClick = useCallback(
    (category) => {
      if (category === activeFilter) return
      flipStateRef.current = Flip.getState('.project-card')
      setActiveFilter(category)
      setProjects(sortByCategory(category))
    },
    [activeFilter]
  )

  return (
    <div className="min-h-screen bg-base-100 text-base-content px-8 py-16 font-sans">
      {/* Header Filters */}
      <div className="text-center max-w-5xl mx-auto mb-16">
        <p id="filter-label" className="text-xs uppercase tracking-widest text-base-content font-bold mb-2">
          Filter By
        </p>
        <div
          role="group"
          aria-labelledby="filter-label"
          className="text-3xl md:text-4xl font-bold tracking-tight leading-snug"
        >
          {CATEGORIES.map((cat, index) => {
            const isActive = activeFilter === cat
            return (
              <Fragment key={cat}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleFilterClick(cat)}
                  className={`cursor-pointer transition-colors duration-300 inline-block rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-base-content ${
                    isActive
                      ? 'text-base-content'
                      : 'text-base-content/40 hover:text-base-content/70'
                  }`}
                >
                  {cat}
                </button>
                {index < CATEGORIES.length - 1 && (
                  <span aria-hidden="true" className="text-base-content/40">, </span>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-1 max-w-[96rem] mx-auto min-h-300">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            displayIndex={String(index + 1).padStart(2, '0')}
            isSelected={activeFilter === ALL || project.category === activeFilter}
          />
        ))}
      </div>
    </div>
  )
}

export default FilterProjects
