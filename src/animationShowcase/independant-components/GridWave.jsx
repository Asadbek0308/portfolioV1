import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function GridWave() {
  // Configurable grid settings
  const GRID_COLUMNS = 20;
  const GRID_ROWS = 20;
  const TOTAL_ITEMS = GRID_COLUMNS * GRID_ROWS;
  const PULSE_INTERVAL = 2000;
  const MAX_RIPPLE_DISTANCE = 12; // Expanded slightly for a more satisfying sweep

  const containerRef = useRef(null);
  const glowRefs = useRef([]);
  const headingRef = useRef(null);
  const paragraphRef = useRef(null);

  // ---- Heading / paragraph entrance ----
  useEffect(() => {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(
        headingRef.current,
        { opacity: 0, y: -24, letterSpacing: '0.4em', filter: 'blur(6px)' },
        { opacity: 1, y: 0, letterSpacing: '0.08em', filter: 'blur(0px)', duration: 1 }
      )
      .fromTo(
        paragraphRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.4'
      );
  }, []);

  // ---- Core ripple, reused by both click and the automatic pulse ----
  const triggerWaveAt = (index) => {
    const targetRow = Math.floor(index / GRID_COLUMNS);
    const targetCol = index % GRID_COLUMNS;
    const cells = containerRef.current.children;
    const maxDistance = Math.sqrt(GRID_COLUMNS ** 2 + GRID_ROWS ** 2);

    for (let i = 0; i < cells.length; i++) {
      const currentRow = Math.floor(i / GRID_COLUMNS);
      const currentCol = i % GRID_COLUMNS;
      const deltaX = currentCol - targetCol;
      const deltaY = currentRow - targetRow;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > MAX_RIPPLE_DISTANCE) continue;

      const cell = cells[i];
      const glow = glowRefs.current[i];
      const intensity = Math.max(0.1, 1 - distance / (maxDistance * 0.5));
      const color = distance === 0 ? '#f472b6' : '#22d3ee';

      gsap.killTweensOf([cell, glow]);
      glow.style.backgroundColor = color;
      glow.style.boxShadow = `0 0 ${20 * intensity}px ${6 * intensity}px ${color}`;

      // Due to the 54deg grid tilt, local Z points into the screen.
      // Combining a negative Y translation with a positive Z translation
      // forces the tile to physically jump UP vertically out of the perspective plane.
      gsap.timeline({ defaults: { overwrite: 'auto' } })
        .to(cell, {
          y: -120 * intensity, // Pulls the tile physically upward on the screen
          z: 160 * intensity,  // Pushes it forward out of its slot
          rotateX: -25 * intensity, // Exaggerates the forward tilt rock
          scale: 1 + 0.15 * intensity,
          delay: distance * 0.04,
          duration: 0.3,
          ease: 'power2.out',
        }, 0)
        .to(glow, {
          opacity: 0.95 * intensity,
          delay: distance * 0.04,
          duration: 0.25,
          ease: 'power2.out',
        }, 0)
        .to(cell, {
          y: 20 * intensity,   // Deep drop below baseline for liquid surface look
          z: -40 * intensity,
          rotateX: 10 * intensity,
          scale: 0.92,
          duration: 0.25,
          ease: 'power2.in',
        })
        .to(glow, { opacity: 0.4 * intensity, duration: 0.25, ease: 'power2.in' }, '<')
        .to(cell, {
          y: 0,
          z: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.7,
          ease: 'elastic.out(1.1, 0.5)',
        })
        .to(glow, { opacity: 0, duration: 0.6, ease: 'power3.out' }, '<');
    }
  };

  // ---- Automatic wave ----
  useEffect(() => {
    const timer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * TOTAL_ITEMS);
      triggerWaveAt(randomIndex);
    }, PULSE_INTERVAL);
    return () => clearInterval(timer);
  }, [TOTAL_ITEMS]);

  // ---- Click handler ----
  const handleGridClick = (e) => {
    const target = e.target.closest('[data-idx]');
    if (!target || !containerRef.current.contains(target)) return;
    triggerWaveAt(Number(target.dataset.idx));
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#05010d] overflow-hidden relative border-t-2 border-white">
      {/* 1) Heading + paragraph */}
      <div className=" relative z-20 pt-12 pb-6 px-8 text-center shrink-0">
        <h1
          ref={headingRef}
          className="text-4xl md:text-5xl font-bold uppercase text-cyan-300"
          style={{ textShadow: '0 0 10px rgba(34,211,238,0.8), 0 0 30px rgba(34,211,238,0.4)' }}
        >
          Signal Grid
        </h1>
        <p ref={paragraphRef} className="mt-3 text-slate-400 max-w-md mx-auto">
          Tap any node to send a pulse across the network — or watch one fire on its own.
        </p>
      </div>

      {/* 2) Tilted 3D field wrapper */}
      <div className="flex-1 relative" style={{ perspective: '1000px' }}>
        <div
          ref={containerRef}
          onClick={handleGridClick}
          className="grid absolute inset-0 m-auto gap-1"
          style={{
            width: '120%',
            height: '120%',
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(54deg)  translateY(-5%) translateX(-8%)',
          }}
        >
          {Array.from({ length: TOTAL_ITEMS }).map((_, i) => (
            <div
              key={i}
              data-idx={i}
              className="relative cursor-pointer transition-colors duration-200 hover:bg-cyan-500/10"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                background: '#090314',
                border: '1px solid rgba(34,211,238,0.2)',
                boxShadow: 'inset 0 0 4px rgba(34,211,238,0.05)',
              }}
            >
              {/* Internal glow panel */}
              <div
                ref={(el) => (glowRefs.current[i] = el)}
                className="absolute inset-0 pointer-events-none rounded-sm"
                style={{ opacity: 0, willChange: 'opacity' }}
              />
            </div>
          ))}
        </div>

        {/* Horizon fade */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/3 z-10"
          style={{ background: 'linear-gradient(to bottom, #05010d 15%, transparent)' }}
        />
      </div>
    </div>
  );
}