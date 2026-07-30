import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const STRAND_A_IMAGES = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
];

const STRAND_B_IMAGES = [
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1511497584788-876761c119ef?auto=format&fit=crop&w=400&q=80',
];

export default function DnaHelixGallery() {
  const containerRef = useRef(null);

  const CONFIG = {
    cardsPerStrand: 12,
    radius: 380,
    pitch: 700,
    totalTurns: 2,
    ambientSpeed: 0.015,     // Base continuous rotation speed
    scrollSensitivity: 0.0012, // Scroll input intensity
    friction: 0.08,          // Lerp inertia smoothing factor (0.01 - 0.1)
    perspective: 1300,
    strandBOffsetPx: 350,
  };

  const totalHeight = CONFIG.pitch * CONFIG.totalTurns;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cardsStrandA = container.querySelectorAll('.dna-strand-a');
    const cardsStrandB = container.querySelectorAll('.dna-strand-b');

    let progress = 0;
    let currentVelocity = CONFIG.ambientSpeed;
    let targetVelocity = CONFIG.ambientSpeed;

    const updateStrand = (cards, pixelOffsetDown) => {
      cards.forEach((card, index) => {
        const baseOffset = index / CONFIG.cardsPerStrand;

        const rawProgress = (progress + baseOffset) % 1;
        const cardProgress = rawProgress < 0 ? rawProgress + 1 : rawProgress;

        const currentTurns = cardProgress * CONFIG.totalTurns;
        const angleRad = currentTurns * Math.PI * 2;
        const angleDeg = currentTurns * 360;

        let yPos = cardProgress * totalHeight - totalHeight / 2;
        yPos = ((yPos + pixelOffsetDown + totalHeight / 2) % totalHeight) - totalHeight / 2;

        const zCos = Math.cos(angleRad);
        const opacity = gsap.utils.mapRange(-1, 1, 0.15, 1, zCos);
        const blur = gsap.utils.mapRange(-1, 1, 6, 0, zCos);

        gsap.set(card, {
          transform: `translateY(${yPos}px) rotateY(${angleDeg}deg) translateZ(${CONFIG.radius}px)`,
          opacity: opacity,
          filter: `blur(${blur}px)`,
          zIndex: Math.round((zCos + 1) * 100),
        });
      });
    };

    const updatePositions = (delta) => {
      // 1. Decay target velocity back toward ambient speed when no scroll input occurs
      targetVelocity += (CONFIG.ambientSpeed - targetVelocity) * 0.05;

      // 2. Smoothly lerp current velocity toward target velocity for inertia
      currentVelocity += (targetVelocity - currentVelocity) * CONFIG.friction;

      // 3. Advance progress using smoothed inertia velocity
      progress += currentVelocity * delta;

      updateStrand(cardsStrandA, 0);
      updateStrand(cardsStrandB, CONFIG.strandBOffsetPx);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      // Add scroll delta to target velocity rather than jumping progress directly
      targetVelocity += e.deltaY * CONFIG.scrollSensitivity;
    };

    const tickerCallback = (time, deltaTime) => {
      updatePositions(deltaTime / 1000);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    gsap.ticker.add(tickerCallback);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      gsap.ticker.remove(tickerCallback);
    };
  }, []);

  const renderStrand = (strandClass, images, strandLabel, accentColorClass) => {
    const cards = [];
    for (let i = 0; i < CONFIG.cardsPerStrand; i++) {
      const imgUrl = images[i % images.length];

      cards.push(
        <div
          key={`${strandLabel}-${i}`}
          className={`${strandClass} absolute top-1/2 left-1/2 -ml-24 -mt-16 w-48 h-32 rounded-xl overflow-hidden border border-white/20 shadow-2xl select-none bg-neutral-900 pointer-events-none`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img
            src={imgUrl}
            alt={`${strandLabel} item ${i + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
          <span className={`absolute bottom-2 left-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${accentColorClass}`}>
            {strandLabel} · #{i + 1}
          </span>
        </div>
      );
    }
    return cards;
  };

  return (
    <div className="relative w-full h-screen text-white overflow-hidden flex flex-col items-center justify-center">
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{
          perspective: `${CONFIG.perspective}px`,
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div
          className="relative w-0 h-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {renderStrand('dna-strand-a', STRAND_A_IMAGES, 'Strand A', 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40')}
          {renderStrand('dna-strand-b', STRAND_B_IMAGES, 'Strand B', 'bg-rose-500/30 text-rose-300 border border-rose-400/40')}
        </div>
      </div>
    </div>
  );
}