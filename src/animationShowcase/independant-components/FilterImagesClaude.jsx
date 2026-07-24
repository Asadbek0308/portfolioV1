import React, { useState, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import Flip from 'gsap/Flip'

gsap.registerPlugin(Flip)

const COLLECTIONS = ['All Specimens', 'Botanical', 'Mineral', 'Marine', 'Avian']

// O(1) lookup instead of a per-render conversion loop — plate numbers only
// ever need to cover the grid size, so a static table is both shorter and
// cheaper than computing roman numerals on the fly.
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

const CORNERS = ['top-1.5 left-1.5 border-t border-l', 'top-1.5 right-1.5 border-t border-r', 'bottom-1.5 left-1.5 border-b border-l', 'bottom-1.5 right-1.5 border-b border-r']

const SPECIMENS_SEED = [
  { id: 's1', code: 'SP-014', name: 'Monstera Deliciosa', collection: 'Botanical', image: 'https://picsum.photos/seed/sp1/500/650' },
  { id: 's2', code: 'SP-022', name: 'Rose Quartz Cluster', collection: 'Mineral', image: 'https://picsum.photos/seed/sp2/500/650' },
  { id: 's3', code: 'SP-031', name: 'Giant Pacific Octopus', collection: 'Marine', image: 'https://picsum.photos/seed/sp3/500/650' },
  { id: 's4', code: 'SP-007', name: 'Scarlet Macaw', collection: 'Avian', image: 'https://picsum.photos/seed/sp4/500/650' },
  { id: 's5', code: 'SP-018', name: 'Fiddle Leaf Fig', collection: 'Botanical', image: 'https://picsum.photos/seed/sp5/500/650' },
  { id: 's6', code: 'SP-045', name: 'Amethyst Geode', collection: 'Mineral', image: 'https://picsum.photos/seed/sp6/500/650' },
  { id: 's7', code: 'SP-029', name: 'Chambered Nautilus', collection: 'Marine', image: 'https://picsum.photos/seed/sp7/500/650' },
  { id: 's8', code: 'SP-012', name: 'Great Blue Heron', collection: 'Avian', image: 'https://picsum.photos/seed/sp8/500/650' },
  { id: 's9', code: 'SP-038', name: 'Staghorn Fern', collection: 'Botanical', image: 'https://picsum.photos/seed/sp9/500/650' },
  { id: 's10', code: 'SP-051', name: 'Pyrite Formation', collection: 'Mineral', image: 'https://picsum.photos/seed/sp10/500/650' },
  { id: 's11', code: 'SP-016', name: 'Moon Jellyfish', collection: 'Marine', image: 'https://picsum.photos/seed/sp11/500/650' },
  { id: 's12', code: 'SP-024', name: 'Snowy Owl', collection: 'Avian', image: 'https://picsum.photos/seed/sp12/500/650' }
]

const SpecimenArchiveGrid = () => {
  const [activeCollection, setActiveCollection] = useState('All Specimens')
  const [specimens, setSpecimens] = useState(SPECIMENS_SEED)
  const flipState = useRef(null)
  const tabRefs = useRef([])
  const indicatorRef = useRef(null)
  const gridRef = useRef(null)

  useLayoutEffect(() => {
    const tab = tabRefs.current[COLLECTIONS.indexOf(activeCollection)]
    if (tab && indicatorRef.current) {
      gsap.to(indicatorRef.current, { x: tab.offsetLeft, width: tab.offsetWidth, duration: 0.5, ease: 'power3.out' })
    }
  }, [activeCollection])

  useLayoutEffect(() => {
    if (!flipState.current) return
    Flip.from(flipState.current, {
      targets: '.specimen-card',
      duration: 0.7,
      ease: 'power2.inOut',
      absolute: true,
      scale: true,
      stagger: 0.035,
      onComplete: () => {
        if (gridRef.current) gridRef.current.style.height = 'auto'
        flipState.current = null
      }
    })
  }, [specimens])

  const handleCollectionClick = (collection) => {
    if (collection === activeCollection) return
    setActiveCollection(collection)
    if (collection === 'All Specimens') return

    flipState.current = Flip.getState('.specimen-card')
    if (gridRef.current) gridRef.current.style.height = `${gridRef.current.getBoundingClientRect().height}px`

    setSpecimens((prev) => [...prev].sort((a, b) => (b.collection === collection) - (a.collection === collection)))
  }

  const visibleCount = specimens.filter((s) => activeCollection === 'All Specimens' || s.collection === activeCollection).length

  return (
    <div className="min-h-screen bg-[#12181a] text-[#ede9dc] px-6 md:px-12 py-14 font-serif">
      <div className="max-w-6xl mx-auto mb-12 border-b border-[#2a332f] pb-8">
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-8">
          <h1 className="text-2xl md:text-3xl tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Field Archive <span className="text-[#5b6b62] italic">— specimen catalog</span>
          </h1>
          <p className="font-mono text-[11px] tracking-widest text-[#5b6b62] uppercase">
            {String(visibleCount).padStart(2, '0')} / {String(specimens.length).padStart(2, '0')} on view
          </p>
        </div>

        <div className="relative inline-flex flex-wrap gap-1 font-mono text-xs uppercase tracking-widest">
          <div ref={indicatorRef} className="absolute bottom-0 h-[2px] bg-[#c98a3c]" style={{ left: 0, width: 0 }} />
          {COLLECTIONS.map((collection, i) => (
            <button
              key={collection}
              ref={(el) => (tabRefs.current[i] = el)}
              onClick={() => handleCollectionClick(collection)}
              className={`px-4 py-2 transition-colors duration-300 ${activeCollection === collection ? 'text-[#ede9dc]' : 'text-[#5b6b62] hover:text-[#8a9690]'}`}
            >
              {collection}
            </button>
          ))}
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 items-start gap-x-4 gap-y-10 max-w-6xl mx-auto overflow-hidden">
        {specimens.map((specimen, index) => {
          const isMatched = activeCollection === 'All Specimens' || specimen.collection === activeCollection

          return (
            <div
              key={specimen.id}
              data-flip-id={specimen.id}
              className={`specimen-card [will-change:transform] flex flex-col transition-[opacity,filter] duration-500 ${isMatched ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}
            >
              <div className="relative aspect-[3/4] bg-[#171f1c] overflow-hidden mb-3 group">
                {CORNERS.map((c) => (
                  <span key={c} className={`absolute w-3 h-3 border-[#c98a3c]/70 z-10 ${c}`} />
                ))}
                <img
                  src={specimen.image}
                  alt={specimen.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  style={{ filter: 'grayscale(0.35) sepia(0.15) contrast(1.05)' }}
                />
                <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 bg-[#12181a]/90 border-t border-dashed border-[#5b6b62] px-2.5 py-2">
                  <p className="font-mono text-[10px] tracking-widest text-[#c98a3c]">PLATE {ROMAN[index + 1] ?? index + 1}</p>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 border-t border-[#2a332f] pt-2 h-6 overflow-hidden">
                <span className="text-sm leading-snug truncate min-w-0">{specimen.name}</span>
                <span className="font-mono text-[10px] text-[#5b6b62] whitespace-nowrap shrink-0">{specimen.code}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SpecimenArchiveGrid