import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

// Updated curated imagery from Unsplash — verified, real photos matched to each theme
const SECTIONS = [
  {
    title: "Monolithic Geometry",
    subtitle: "STARK, BRUTALIST CONCRETE STRUCTURES",
    // The Barbican Centre, London — symmetrical brutalist concrete, by Mike Hindle
    src: "https://images.unsplash.com/photo-1760340769739-653d00200baf?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "Biophilic Design",
    subtitle: "WHERE NATURE AND STRUCTURE COLLIDE",
    // Tehran building facade overgrown with vines, by mdreza jalali
    src: "https://images.unsplash.com/photo-1759342642630-4885a0661383?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "Light & Mass",
    subtitle: "THE TENSION OF SOLIDITY AND VOID",
    // High-contrast facade split by hard shadow, by Shakib Uzzaman
    src: "https://images.unsplash.com/photo-1748106347454-f7e312a8b1fd?auto=format&fit=crop&q=80&w=1200",
  },
  {
    title: "Coastal Elements",
    subtitle: "RUGGED ROCK AGAINST THE RESTLESS SEA",
    // Malin Head, Ireland — rugged coastal rock formations, by Benjamin Hibbert-Hingston
    src: "https://images.unsplash.com/photo-1755467020939-4c3e196545bd?auto=format&fit=crop&q=80&w=1200",
  }
];

export default function GeometricSplitGallery() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vignettes = container.querySelectorAll('.vignette-follower');

    // High-performance GSAP quickTo setters.
    // Increased duration slightly for a more deliberate, smoother motion on the new shape.
    const xTo = gsap.quickTo(vignettes, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(vignettes, "y", { duration: 0.6, ease: "power3.out" });

    const handleMouseMove = (e) => {
      // Offset calculation for centered movement:
      // The square size is 35vh (defined in Tailwind below). We calculate half of this for true center tracking.
      const sizeOffset = window.innerHeight * 0.35 * 0.5;

      const targetX = e.clientX - sizeOffset;
      const targetY = e.clientY - sizeOffset;

      xTo(targetX);
      yTo(targetY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    // Base layer
    <div ref={containerRef} className="bg-[#121212] text-white w-full overflow-hidden">
      {SECTIONS.map((section, index) => (
        <section
          key={index}
          className="relative h-[120vh] w-full flex items-center justify-center border-b border-[#2a2a2a] group"
          style={{
            // Keeps the fixed vignette contained within the section bounds
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
          }}
        >
          {/* 1. Background Content Layer (z-0) */}
          <div className="absolute inset-0 opacity-15 grayscale transition-all duration-1000 ease-in-out group-hover:opacity-20 group-hover:grayscale-0 pointer-events-none">
            <img 
              src={section.src} 
              alt={`${section.title} context`}
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000" 
            />
          </div>

          {/* 2. Fixed Masked Image Layer (Moving Square) (z-10) */}
          {/*
              Tailwind Sizing for the Square:
              Using `h-[35vh]` and `aspect-square` makes the follower exactly 35% of the viewport's height and a perfect square.
              Min-size: `min-h-[250px]` (which makes it min-w-[250px]) ensures usability on smaller screens.
          */}
          <div 
            className="vignette-follower fixed top-0 left-0 aspect-square h-[35vh] min-h-62.5 z-10 pointer-events-none will-change-transform rounded-2xl overflow-hidden shadow-[0_25px_100px_rgba(0,0,0,0.85)] border-2 border-white/5"
          >
            <div className="absolute w-screen h-screen top-0 left-0">
              <img
                src={section.src}
                alt={section.title}
                className="w-full h-full object-cover scale-110"
                style={{
                  // The underlying image must remain full-screen and fixed for the masking effect.
                  width: '100vw',
                  height: '100vh',
                  position: 'fixed',
                  top: 0,
                  left: 0
                }}
              />
            </div>
          </div>

          {/* 3. High-Stacking Text Layer (z-30) */}
          {/*
              z-30 is significantly higher than z-10, ensuring no overlap or obscuring by the moving image mask.
          */}
          <div className="relative z-30 text-center pointer-events-none select-none mix-blend-difference px-12">
            <span className="text-[10px] md:text-xs tracking-[0.4em] text-neutral-400 uppercase font-mono block mb-4 opacity-70">
              STRUCTURAL STUDIES // 0{index + 1}
            </span>
            <h2 className="text-5xl md:text-8xl font-thin tracking-tighter leading-[0.95] mb-2">
              {section.title}
            </h2>
            <p className="text-xs md:text-sm text-neutral-300 tracking-wider uppercase font-light mt-1 max-w-xl mx-auto leading-relaxed">
              {section.subtitle}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}