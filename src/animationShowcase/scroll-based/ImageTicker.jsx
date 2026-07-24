import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const itemsData = [
  { id: 1, title: "Prism & Light", category: "Abstract", imgUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80&auto=format&fit=crop" },
  { id: 2, title: "Monochrome Vault", category: "Architecture", imgUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80&auto=format&fit=crop" },
  { id: 3, title: "Tokyo After Dark", category: "Street", imgUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80&auto=format&fit=crop" },
  { id: 4, title: "Kinetic Geometry", category: "3D Art", imgUrl: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=600&q=80&auto=format&fit=crop" },
  { id: 5, title: "Dune Topography", category: "Landscape", imgUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80&auto=format&fit=crop" },
  { id: 6, title: "Nordic Minimal", category: "Interior", imgUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80&auto=format&fit=crop" },
];

export default function ImageTicker() {
  const containerRef = useRef(null);
  const col1Ref = useRef(null);
  const col2Ref = useRef(null);
  const col3Ref = useRef(null);
  const col4Ref = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Fully unique configs: distinct directions, completely staggered scrub catch-up speeds
    const configs = [
      { ref: col1Ref, dir: 'up', speed: 0.5 },   // Fast, direct snapping response
      { ref: col2Ref, dir: 'down', speed: 2.5 }, // Ultra smooth, heavy lag catch-up
      { ref: col3Ref, dir: 'up', speed: 1.4 },   // Moderate lag response
      { ref: col4Ref, dir: 'down', speed: 0.9 }, // Crisp, light lag response
    ];

    const ctx = gsap.context(() => {
      configs.forEach(({ ref, dir, speed }) => {
        const el = ref.current;
        if (!el) return;

        const totalMovement = el.offsetHeight * 0.5;
        const yStart = dir === 'up' ? 0 : -totalMovement;
        const yEnd = dir === 'up' ? -totalMovement : 0;

        gsap.fromTo(el,
          { y: yStart },
          {
            y: yEnd,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top bottom',
              end: 'bottom top',
              scrub: speed,
            }
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  const TickerCard = ({ item }) => (
    <div className="group relative w-full aspect-3/4 mb-4 overflow-hidden rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
      <img
        src={item.imgUrl}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
      />
      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
      <div className="absolute inset-0 p-5 flex flex-col justify-end text-left">
        <p className="text-xs font-semibold tracking-wider text-teal-400 uppercase transform translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          {item.category}
        </p>
        <h3 className="text-base font-bold text-white mt-1 transform translate-y-3 opacity-0 transition-all duration-300 delay-75 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          {item.title}
        </h3>
      </div>
    </div>
  );

  const TickerColumn = ({ colRef }) => (
    <div className="relative h-full overflow-hidden">
      <div ref={colRef} className="will-change-transform">
        {itemsData.map((item) => <TickerCard key={item.id} item={item} />)}
        {itemsData.map((item) => <TickerCard key={`dup-${item.id}`} item={item} />)}
      </div>
    </div>
  );

  return (
    <div className="w-full bg-slate-950 py-24 min-h-screen grid place-items-center">
      <div 
        ref={containerRef} 
        className="w-full max-w-6xl h-175 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden px-4"
      >
        <TickerColumn colRef={col1Ref} />
        <TickerColumn colRef={col2Ref} />
        <TickerColumn colRef={col3Ref} />
        <TickerColumn colRef={col4Ref} />
      </div>
    </div>
  );
}