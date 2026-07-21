// 1. Imports
import { useState, useRef, useEffect, Fragment } from 'react'
import gsap from 'gsap'
import { Link } from 'react-router-dom'

// 2. Constants & Data
const PROJECTS_DATA = [
  {
    title: 'C2 Montreal',
    src: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop',
    color: '#000000',
    tags: ['Brand', 'Web Design', 'Motion'],
  },
  {
    title: 'Office Spaces',
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop',
    color: '#8C8C8C',
    tags: ['UI Dev', 'Interior', 'Framer'],
  },
  {
    title: 'Locomotive',
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
    color: '#EFEFEF',
    tags: ['Frontend', 'Scroll FX', 'Case Study'],
  },
  {
    title: 'Silencio',
    src: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop',
    color: '#706D57',
    tags: ['Product', 'Web App', 'Branding'],
  },
]

const MODAL_OFFSET = { x: 150, y: 175 }
const CURSOR_OFFSET = { x: 28, y: 28 }

// 3. Helper Components
const ProjectTags = ({ tags }) => (
  <>
    {tags.map((tag, i) => (
      <Fragment key={tag}>
        {i > 0 && <span className="text-base-content/30">•</span>}
        <span>{tag}</span>
      </Fragment>
    ))}
  </>
)

// 4. Main Component
const RecentProjects = () => {
  const [modalState, setModalState] = useState({ isActive: false, index: 0 })

  const containerRef = useRef(null)
  const cursorRef = useRef(null)
  const labelRef = useRef(null)
  const sliderRef = useRef(null)

  // 5. Hooks / Effects

  // Effect 1: Initialization & Pointer/Mouse Tracker Setup (Runs ONCE on mount)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return

    const ctx = gsap.context(() => {
      const modalX = gsap.quickTo(containerRef.current, 'x', { duration: 0.8, ease: 'power3.out' })
      const modalY = gsap.quickTo(containerRef.current, 'y', { duration: 0.8, ease: 'power3.out' })

      const cursorX = gsap.quickTo(cursorRef.current, 'x', { duration: 0.5, ease: 'power3.out' })
      const cursorY = gsap.quickTo(cursorRef.current, 'y', { duration: 0.5, ease: 'power3.out' })

      const labelX = gsap.quickTo(labelRef.current, 'x', { duration: 0.45, ease: 'power3.out' })
      const labelY = gsap.quickTo(labelRef.current, 'y', { duration: 0.45, ease: 'power3.out' })

      const handleMouseMove = ({ clientX, clientY }) => {
        modalX(clientX - MODAL_OFFSET.x)
        modalY(clientY - MODAL_OFFSET.y)
        cursorX(clientX - CURSOR_OFFSET.x)
        cursorY(clientY - CURSOR_OFFSET.y)
        labelX(clientX - CURSOR_OFFSET.x)
        labelY(clientY - CURSOR_OFFSET.y)
      }

      window.addEventListener('mousemove', handleMouseMove)

      return () => window.removeEventListener('mousemove', handleMouseMove)
    })

    return () => ctx.revert()
  }, [])

  // Effect 2: Hover State Driven Scale Animation (Show / Hide)
  useEffect(() => {
    if (!containerRef.current) return

    gsap.to([containerRef.current, cursorRef.current, labelRef.current], {
      scale: modalState.isActive ? 1 : 0,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [modalState.isActive])

  // Effect 3: GSAP Slider Offset Driven Animation
  useEffect(() => {
    if (!sliderRef.current) return

    gsap.to(sliderRef.current, {
      yPercent: -modalState.index * 100,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [modalState.index])

  // 6. JSX Rendering
  return (
    <section className="relative w-full text-base-content font-sans py-16 sm:py-24 md:py-32 px-6 md:px-12 lg:px-20 select-none">
      <div className="w-full max-w-7xl mx-auto">
        
        {/* Heading Row */}
        <div className="flex items-end justify-between mb-12 sm:mb-16 md:mb-24 gap-6">
          <h2 className="text-3xl sm:text-6xl md:text-7xl font-bold tracking-tight">
            Recent Projects
          </h2>

          <Link
            to="/work"
            className="flex items-center gap-3 text-base font-semibold text-base-content hover:opacity-85 transition-opacity group shrink-0"
          >
            <span className="text-xs md:text-xl font-bold uppercase tracking-tight">
              See all projects
            </span>
            <span className="relative flex items-center justify-center w-8 h-8 rounded-full border border-current overflow-hidden group-hover:bg-base-content group-hover:text-base-100 transition-colors duration-300">
              <span className="absolute transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:translate-x-full">↗</span>
              <span className="absolute transition-transform duration-300 ease-in-out translate-y-full -translate-x-full group-hover:translate-y-0 group-hover:translate-x-0">↗</span>
            </span>
          </Link>
        </div>

        {/* Project List */}
        <div className="border-t border-base-content/10">
          {PROJECTS_DATA.map((project, index) => (
            <div
              key={project.title}
              onMouseEnter={() => setModalState({ isActive: true, index })}
              onMouseLeave={() => setModalState({ isActive: false, index })}
              className="group relative border-b border-base-content/10 py-8 md:py-14 cursor-pointer"
            >
              {/* MOBILE VIEW */}
              <div className="flex flex-col md:hidden space-y-4">
                <div
                  className="w-full aspect-[4/3] rounded-xl flex items-center justify-center overflow-hidden p-6"
                  style={{ backgroundColor: project.color }}
                >
                  <img
                    src={project.src}
                    alt={project.title}
                    className="w-full h-full object-cover rounded-lg shadow-md grayscale opacity-90"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-base-content/60">
                    <ProjectTags tags={project.tags} />
                  </div>
                </div>
              </div>

              {/* DESKTOP VIEW */}
              <div className="hidden md:flex justify-between items-center transition-opacity duration-200 group-hover:opacity-40">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight transition-transform duration-300 transform group-hover:translate-x-3">
                  {project.title}
                </h3>
                <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-base-content/60 transition-transform duration-300 transform group-hover:-translate-x-3">
                  <ProjectTags tags={project.tags} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP FLOATING PREVIEW ELEMENTS */}
      <div
        ref={containerRef}
        className="hidden md:block fixed top-0 left-0 w-[300px] h-[350px] overflow-hidden pointer-events-none z-30 origin-center scale-0 bg-base-100 rounded-2xl shadow-2xl"
      >
        <div ref={sliderRef} className="w-full h-full relative">
          {PROJECTS_DATA.map((project) => (
            <div
              key={project.title}
              className="w-full h-full flex justify-center items-center"
              style={{ backgroundColor: project.color }}
            >
              <img
                src={project.src}
                alt={project.title}
                className="w-[80%] h-[75%] object-cover grayscale opacity-90"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        ref={cursorRef}
        className="hidden md:flex fixed top-0 left-0 w-14 h-14 bg-base-content rounded-full pointer-events-none z-40 origin-center scale-0 justify-center items-center shadow-lg"
      />

      <div
        ref={labelRef}
        className="hidden md:flex fixed top-0 left-0 w-14 h-14 pointer-events-none z-50 origin-center scale-0 justify-center items-center text-base-100 text-xs font-light tracking-wider"
      >
        View
      </div>
    </section>
  )
}

// 7. Export
export default RecentProjects