import React, { useState, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import Flip from 'gsap/Flip'

gsap.registerPlugin(Flip)

const CATEGORIES = [
  'All Work',
  'Brand & Identity',
  'Content & Marketing',
  'Film & Documentary',
  'Web & Digital'
]

const INITIAL_PROJECTS = [
  { id: '01', title: 'OpenAI: Business, Reimagined', category: 'Brand & Identity', subtitle: 'COMING SOON', image: 'https://picsum.photos/seed/p1/600/400' },
  { id: '02', title: 'Greenboard', category: 'Web & Digital', subtitle: 'FULL PROJECT ↗', image: 'https://picsum.photos/seed/p2/600/400' },
  { id: '03', title: 'Greenboard Arcade', category: 'Film & Documentary', subtitle: 'FULL PROJECT ↗', image: 'https://picsum.photos/seed/p3/600/400' },
  { id: '04', title: 'Polaroid Stories', category: 'Brand & Identity', subtitle: 'FULL PROJECT ↗', image: 'https://picsum.photos/seed/p4/600/400' },
  { id: '05', title: 'Craft & Machine', category: 'Content & Marketing', subtitle: 'EXPLORE ↗', image: 'https://picsum.photos/seed/p5/600/400' },
  { id: '06', title: 'Interior Space', category: 'Film & Documentary', subtitle: 'VIEW FILM ↗', image: 'https://picsum.photos/seed/p6/600/400' },
  { id: '07', title: 'Typography & Form', category: 'Brand & Identity', subtitle: 'FULL PROJECT ↗', image: 'https://picsum.photos/seed/p7/600/400' },
  { id: '08', title: 'Yellow Studio', category: 'Web & Digital', subtitle: 'CASE STUDY ↗', image: 'https://picsum.photos/seed/p8/600/400' },
  { id: '09', title: 'Night Motion', category: 'Content & Marketing', subtitle: 'EXPLORE ↗', image: 'https://picsum.photos/seed/p9/600/400' },
  { id: '10', title: 'Monochrome Echoes', category: 'Film & Documentary', subtitle: 'VIEW FILM ↗', image: 'https://picsum.photos/seed/p10/600/400' },
  { id: '11', title: 'Vanguard Systems', category: 'Web & Digital', subtitle: 'FULL PROJECT ↗', image: 'https://picsum.photos/seed/p11/600/400' },
  { id: '12', title: 'Kinetica Identity', category: 'Brand & Identity', subtitle: 'CASE STUDY ↗', image: 'https://picsum.photos/seed/p12/600/400' },
  { id: '13', title: 'Urban Chronicles', category: 'Content & Marketing', subtitle: 'EXPLORE ↗', image: 'https://picsum.photos/seed/p13/600/400' },
  { id: '14', title: 'Aether OS Interface', category: 'Web & Digital', subtitle: 'COMING SOON', image: 'https://picsum.photos/seed/p14/600/400' },
  { id: '15', title: 'Sound & Silence', category: 'Film & Documentary', subtitle: 'VIEW FILM ↗', image: 'https://picsum.photos/seed/p15/600/400' },
  { id: '16', title: 'Aura Skincare', category: 'Brand & Identity', subtitle: 'FULL PROJECT ↗', image: 'https://picsum.photos/seed/p16/600/400' },
  { id: '17', title: 'Horizon Campaign', category: 'Content & Marketing', subtitle: 'CASE STUDY ↗', image: 'https://picsum.photos/seed/p17/600/400' },
  { id: '18', title: 'Hyperion Interactive', category: 'Web & Digital', subtitle: 'EXPLORE ↗', image: 'https://picsum.photos/seed/p18/600/400' }
]

const FilterProjects = () => {
  const [activeFilter, setActiveFilter] = useState('All Work')
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
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

  const handleFilterClick = (category) => {
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
  }

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
            <div
              key={project.id}
              data-flip-id={project.id}
              className={`project-card flex flex-col transition-opacity duration-500 ${
                isSelected
                  ? 'opacity-100 grayscale-0 pointer-events-auto'
                  : 'opacity-30 grayscale pointer-events-none'
              }`}
            >
              <div className="relative w-full h-72 bg-base-200 overflow-hidden mb-3">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono tracking-wider border-t border-base-content/10 pt-3">
                <div className="flex gap-3 items-center">
                  <span className="font-bold text-base-content">{displayIndex}</span>
                  <span className="text-base-content/80 font-sans font-medium">{project.title}</span>
                </div>
                <span className="text-base-content/50 uppercase">{project.subtitle}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FilterProjects