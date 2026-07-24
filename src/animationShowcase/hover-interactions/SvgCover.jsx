import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

// List of 4 distinct, rich default artwork combinations embedded inside the file
const DEFAULT_CARDS = [
  { title: 'Abstract Geometry', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600', color: '#3b82f6' },
  { title: 'Neon Paradigm', image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600', color: '#a855f7' },
  { title: 'Organic Flows', image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=600', color: '#10b981' },
  { title: 'Vaporwave Sunset', image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600', color: '#f43f5e' }
];

export const RogueHoverCard = ({ 
  index = 0, // Fallback index picker to pull different presets automatically (0 to 3)
  image = DEFAULT_CARDS[index % 4].image,
  title = DEFAULT_CARDS[index % 4].title, 
  strokeColor = DEFAULT_CARDS[index % 4].color, 
  baseStrokeColor = '#0f172a'
}) => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);
  const timelineRef = useRef(null);

  // Safe split calculation rule to avoid undefined method crashes
  const words = (title || '').split(' ');

  useEffect(() => {
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;
    
    if (!p1 || !p2) return;

    const length1 = p1.getTotalLength();
    const length2 = p2.getTotalLength();

    // Start with clean, thin, hidden lines
    gsap.set(p1, {
      strokeDasharray: length1 + 20,
      strokeDashoffset: length1 + 20,
      strokeWidth: 8,
    });

    gsap.set(p2, {
      strokeDasharray: length2 + 20,
      strokeDashoffset: length2 + 20,
      strokeWidth: 6,
    });

    const wordElements = titleRef.current.querySelectorAll('.word-inner');
    gsap.set(wordElements, { y: '105%' });

    return () => {
      if (timelineRef.current) timelineRef.current.kill();
    };
  }, [title]);

  const handleMouseEnter = () => {
    if (timelineRef.current) timelineRef.current.kill();

    const wordElements = titleRef.current.querySelectorAll('.word-inner');
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;

    timelineRef.current = gsap.timeline();

    // Trace path phase
    timelineRef.current
      .to([p1, p2], {
        strokeDashoffset: 0,
        duration: 1.8,
        ease: 'power1.inOut',
        stagger: 0.15,
      }, 0)
      
      // Expansion blockout phase
      .to([p1, p2], {
        strokeWidth: 420,
        duration: 1.2,
        ease: 'power2.inOut', 
        stagger: 0.15,
      }, 0.6)
      
      // Typography presentation drop
      .to(wordElements, {
        y: '0%',
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.05,
      }, 1.2);
  };

  const handleMouseLeave = () => {
    if (timelineRef.current) timelineRef.current.kill();

    const wordElements = titleRef.current.querySelectorAll('.word-inner');
    const p1 = path1Ref.current;
    const p2 = path2Ref.current;

    const length1 = p1.getTotalLength();
    const length2 = p2.getTotalLength();

    timelineRef.current = gsap.timeline({ defaults: { ease: 'power3.inOut' } });

    timelineRef.current
      .to(wordElements, {
        y: '105%',
        duration: 0.4,
        stagger: -0.03,
      }, 0)
      .to([p1, p2], {
        strokeWidth: 8,
        duration: 0.6,
      }, 0)
      .to(p1, { strokeDashoffset: length1 + 20, duration: 0.8 }, 0.1)
      .to(p2, { strokeDashoffset: length2 + 20, duration: 0.8 }, 0.2);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden cursor-pointer group select-none shadow-xl"
    >
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
      />

      {/* SVG Stroke Layer 1 (Accent Color) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none scale-110 z-10"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
      >
        <path
          ref={path1Ref}
          d="M -40,40 C 150,-60 50,220 200,200 C 350,180 250,460 440,360 C 420,100 200,50 -40,120 C -40,300 200,350 440,440"
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* SVG Stroke Layer 2 (Base Color Cover) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none scale-110 z-20"
        viewBox="0 0 400 400"
        preserveAspectRatio="none"
      >
        <path
          ref={path2Ref}
          d="M 440,40 C 250,-60 350,220 200,200 C 50,180 150,460 -40,360 C -20,100 200,50 440,120 C 440,300 200,350 -40,440"
          fill="none"
          stroke={baseStrokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Masked Card Title Reveal */}
      <div className="absolute bottom-8 left-8 right-8 z-30 pointer-events-none">
        <h3 ref={titleRef} className="flex flex-wrap gap-x-2 text-3xl font-black uppercase tracking-wide text-white drop-shadow-md">
          {words.map((word, index) => (
            <span key={index} className="inline-block overflow-hidden h-[1.3em] leading-[1.3em]">
              <span className="word-inner inline-block will-change-transform">
                {word}
              </span>
            </span>
          ))}
        </h3>
      </div>
    </div>
  );
};

// Clean showcase demonstration arrangement layout
export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-8 font-sans">
      <header className="py-12 text-center border-b border-slate-900">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider">Experimental Gallery</h1>
      </header>

      {/* Render 4 distinct cards automatically pulling the inner file asset defaults */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 my-16">
        <RogueHoverCard index={0} />
        <RogueHoverCard index={1} />
        <RogueHoverCard index={2} />
        <RogueHoverCard index={3} />
      </main>

      <footer className="py-8 text-center text-sm text-slate-600 border-t border-slate-900">
        Inspired by Codegrid
      </footer>
    </div>
  );
}