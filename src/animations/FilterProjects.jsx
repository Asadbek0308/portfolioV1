import React, { useState, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import Flip from 'gsap/Flip'

gsap.registerPlugin(Flip)

// Helper: Format string to Title Case (e.g., "brand-identity" or "brandIdentity" -> "Brand Identity")
const formatTitle = (str) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
}

// Helper: Format string to Kebab-Case slug
const formatSlug = (str) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

// Helper to create an inline SVG fallback for missing screenshots
const createPlaceholder = (title) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#18181b"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#71717a" font-family="monospace" font-size="16">${title}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

// 1. Scan subfolder showcase components dynamically (e.g., '../animationShowcase/hover/ButtonGlow.jsx')
const animationModules = import.meta.glob('../animationShowcase/**/*.jsx')

// 2. Scan all local screenshots
const screenshotModules = import.meta.glob(
  '../assets/screenshots/*.{png,jpg,jpeg,webp,avif}',
  { eager: true, import: 'default' }
)

// Map screenshots by slug for exact matching
const SCREENSHOT_MAP = {}
Object.keys(screenshotModules).forEach((path) => {
  const fileName = path.split('/').pop().split('.')[0]
  const slug = formatSlug(fileName)
  SCREENSHOT_MAP[slug] = screenshotModules[path]
})

// 3. Process items & categories dynamically based on folder structure
const DYNAMIC_PROJECTS = []
const categorySet = new Set()

Object.keys(animationModules).forEach((path, index) => {
  const pathSegments = path.split('/')
  
  // Extract file name and folder category
  const fileName = pathSegments.pop().replace(/\.jsx$/, '')
  // If placed directly in animationShowcase root, fallback to 'General'
  const rawCategory = pathSegments.length > 2 ? pathSegments.pop() : 'General'
  
  const category = formatTitle(rawCategory)
  const title = formatTitle(fileName)
  const slug = formatSlug(fileName)
  
  categorySet.add(category)

  const image = SCREENSHOT_MAP[slug] || createPlaceholder(title)

  DYNAMIC_PROJECTS.push({
    id: String(index + 1).padStart(2, '0'),
    title,
    slug,
    category,
    image
  })
})

// Dynamically construct CATEGORIES header list
const CATEGORIES = ['All Work', ...Array.from(categorySet)]

const ProjectCard = React.memo(({ project, displayIndex, isSelected }) => {
  const badgeRef = useRef(null)
  const xTo = useRef(null)
  const yTo = useRef(null)

  useLayoutEffect(() => {
    if (!badgeRef.current) return

    gsap.set(badgeRef.current, { xPercent: -50, yPercent: -50 })

    xTo.current = gsap.quickTo(badgeRef.current, 'x', { duration: 0.35, ease: 'power3.out' })
    yTo.current = gsap.quickTo(badgeRef.current, 'y', { duration: 0.35, ease: 'power3.out' })
  }, [])

  const handleMouseEnter = useCallback((e) => {
    if (!isSelected || !badgeRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    gsap.set(badgeRef.current, { x, y })

    gsap.to(badgeRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: 'back.out(1.7)',
      overwrite: 'auto'
    })
  }, [isSelected])

  const handleMouseMove = useCallback((e) => {
    if (!isSelected) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (xTo.current && yTo.current) {
      xTo.current(x)
      yTo.current(y)
    }
  }, [isSelected])

  const handleMouseLeave = useCallback(() => {
    if (!badgeRef.current) return

    gsap.to(badgeRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      overwrite: 'auto'
    })
  }, [])

  return (
    <Link
      to={`/animations/${project.slug}`}
      data-flip-id={project.id}
      className={`project-card group relative flex flex-col transition-opacity duration-500 cursor-pointer block ${
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
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
        />

        {isSelected && (
          <div
            ref={badgeRef}
            className="pointer-events-none absolute top-0 left-0 z-20 opacity-0 scale-0 origin-center"
          >
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-base-content text-base-100 text-xs font-mono font-medium shadow-2xl backdrop-blur-md whitespace-nowrap">
              view project
            </span>
          </div>
        )}
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

const FilterProjects = () => {
  const [activeFilter, setActiveFilter] = useState('All Work')
  const [projects, setProjects] = useState(DYNAMIC_PROJECTS)
  const flipStateRef = useRef(null)

  useLayoutEffect(() => {
    if (!flipStateRef.current) return

    Flip.from(flipStateRef.current, {
      targets: '.project-card',
      duration: 0.8,
      ease: 'power3.inOut',
      absolute: true,
      scale: true,
      onComplete: () => {
        flipStateRef.current = null
      }
    })
  }, [projects])

  const handleFilterClick = useCallback((category) => {
    if (category === activeFilter) return

    setActiveFilter(category)

    if (category === 'All Work') {
      return
    }

    flipStateRef.current = Flip.getState('.project-card')

    const sorted = [...projects].sort((a, b) => {
      const aMatches = a.category === category
      const bMatches = b.category === category
      if (aMatches && !bMatches) return -1
      if (!aMatches && bMatches) return 1
      return 0
    })

    setProjects(sorted)
  }, [activeFilter, projects])

  return (
    <div className="min-h-screen bg-base-100 text-base-content px-8 py-16 font-sans">
      {/* Header Filters */}
      <div className="text-center max-w-5xl mx-auto mb-16">
        <p className="text-xs uppercase tracking-widest text-base-content font-bold mb-2">Filter By</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-snug">
          {CATEGORIES.map((cat, index) => {
            const isActive = activeFilter === cat
            return (
              <React.Fragment key={cat}>
                <span
                  onClick={() => handleFilterClick(cat)}
                  className={`cursor-pointer transition-colors duration-300 inline-block ${
                    isActive
                      ? 'text-base-content'
                      : 'text-base-content/40 hover:text-base-content/70'
                  }`}
                >
                  {cat}
                </span>
                {index < CATEGORIES.length - 1 && <span className="text-base-content/40">, </span>}
              </React.Fragment>
            )
          })}
        </h1>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-1 max-w-9xl mx-auto min-h-300">
        {projects.map((project, index) => {
          const isSelected = activeFilter === 'All Work' || project.category === activeFilter
          const displayIndex = String(index + 1).padStart(2, '0')

          return (
            <ProjectCard
              key={project.id}
              project={project}
              displayIndex={displayIndex}
              isSelected={isSelected}
            />
          )
        })}
      </div>
    </div>
  )
}

export default FilterProjects