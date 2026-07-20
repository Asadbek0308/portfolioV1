import { useState, useRef, useEffect, Fragment } from 'react'
import gsap from 'gsap'
import { Link } from 'react-router-dom'

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

const RecentProjects = () => {
  const [modalState, setModalState] = useState({ isActive: false, index: 0 })

  const containerRef = useRef(null)
  const cursorRef = useRef(null)
  const labelRef = useRef(null)

  // Smooth cursor/modal tracking — unchanged from the original, no bugs here.
  useEffect(() => {
    const modalX = gsap.quickTo(containerRef.current, 'x', { duration: 0.8, ease: 'power3.out' })
    const modalY = gsap.quickTo(containerRef.current, 'y', { duration: 0.8, ease: 'power3.out' })

    const cursorX = gsap.quickTo(cursorRef.current, 'x', { duration: 0.5, ease: 'power3.out' })
    const cursorY = gsap.quickTo(cursorRef.current, 'y', { duration: 0.5, ease: 'power3.out' })

    const labelX = gsap.quickTo(labelRef.current, 'x', { duration: 0.45, ease: 'power3.out' })
    const labelY = gsap.quickTo(labelRef.current, 'y', { duration: 0.45, ease: 'power3.out' })

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      modalX(clientX - 150)
      modalY(clientY - 175)
      // Recenter on the smaller 56px (w-14) circle instead of the old 80px one
      cursorX(clientX - 28)
      cursorY(clientY - 28)
      labelX(clientX - 28)
      labelY(clientY - 28)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const targetScale = modalState.isActive ? 1 : 0
    gsap.to([containerRef.current, cursorRef.current, labelRef.current], {
      scale: targetScale,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [modalState.isActive])

  return (
    <section className="relative w-full text-base-content font-sans py-24 md:py-32 px-6 md:px-12 lg:px-20 select-none">
      <div className="w-full max-w-7xl mx-auto">
        {/* Heading row */}
        <div className="flex items-end justify-between mb-16 md:mb-24 gap-6">
          <h2 className="text-6xl sm:text-7xl md:text-7xl font-bold tracking-tight">
            Recent Projects
          </h2>

          <Link
            to="work"
            className="flex items-center gap-3 text-base font-semibold text-base-content hover:opacity-85 transition-opacity group shrink-0"
          >
            <span className="text-lg md:text-xl font-bold uppercase tracking-tight">
              See all projects
            </span>
            <span className="relative flex items-center justify-center w-8 h-8 rounded-full border border-current overflow-hidden group-hover:bg-base-content group-hover:text-base-100 transition-colors duration-300">
              <span className="absolute transition-transform duration-300 ease-in-out group-hover:-translate-y-full group-hover:translate-x-full">↗</span>
              <span className="absolute transition-transform duration-300 ease-in-out translate-y-full -translate-x-full group-hover:translate-y-0 group-hover:translate-x-0">↗</span>
            </span>
          </Link>
        </div>

        {/* Project list */}
        <div className="border-t border-base-content/10">
          {PROJECTS_DATA.map((project, index) => (
            <div
              key={index}
              onMouseEnter={() => setModalState({ isActive: true, index })}
              onMouseLeave={() => setModalState({ isActive: false, index })}
              className="group relative flex justify-between items-center py-10 md:py-14 border-b border-base-content/10 cursor-pointer transition-opacity duration-200 hover:opacity-40"
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight transition-transform duration-300 transform group-hover:translate-x-3">
                {project.title}
              </h3>
              <p className="hidden md:flex items-center gap-2 text-sm font-medium tracking-wide text-base-content/60 transition-transform duration-300 transform group-hover:-translate-x-3">
                {project.tags.map((tag, i) => (
                  <Fragment key={tag}>
                    {i > 0 && <span className="text-base-content/30">•</span>}
                    <span>{tag}</span>
                  </Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating tracking elements */}
      <div
        ref={containerRef}
        className="fixed top-0 left-0 w-[300px] h-[350px] overflow-hidden pointer-events-none z-30 origin-center scale-0 bg-base-100 rounded-2xl shadow-2xl"
      >
        <div
          className="w-full h-full relative transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
          style={{ transform: `translateY(${modalState.index * -100}%)` }}
        >
          {PROJECTS_DATA.map((project, index) => (
            <div
              key={index}
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
        className="fixed top-0 left-0 w-14 h-14 bg-base-content rounded-full pointer-events-none z-40 origin-center scale-0 flex justify-center items-center shadow-lg"
      />

      <div
        ref={labelRef}
        className="fixed top-0 left-0 w-14 h-14 pointer-events-none z-50 origin-center scale-0 flex justify-center items-center text-base-100 text-xs font-light tracking-wider"
      >
        View
      </div>
    </section>
  )
}

export default RecentProjects