import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Register SplitText plugin
gsap.registerPlugin(SplitText);

const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : React.useEffect;

export default function CartoonTextCircle({ 
  text = "WELCOME!", 
  color = "#f97316", // Tailwind orange-500
  className = "" 
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const pathRef = useRef(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!textRef.current || !pathRef.current) return;

      // 1. Initial SVG path setup: set offset and hide starting cap
      gsap.set(pathRef.current, {
        strokeDasharray: 1,
        strokeDashoffset: 1,
        opacity: 0,
      });

      // 2. Split target text into chars & words
      const split = SplitText.create(textRef.current, { 
        type: "chars,words", 
        charsClass: "inline-block transform-gpu" 
      });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Flying direction trajectories
      const directions = [
        { x: -350, y: -350, rot: -120 }, // Top-Left
        { x: 350, y: -350, rot: 120 },   // Top-Right
        { x: -350, y: 350, rot: -180 },  // Bottom-Left
        { x: 350, y: 350, rot: 180 },    // Bottom-Right
      ];

      // 3. Animate characters flying in and assembling
      split.chars.forEach((char) => {
        const dir = directions[Math.floor(Math.random() * directions.length)];

        tl.fromTo(
          char,
          {
            x: dir.x,
            y: dir.y,
            rotation: dir.rot,
            scale: 0.1,
            opacity: 0,
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            duration: 0.65,
            ease: 'back.out(2.2)', // Cartoonish overshoot bounce
          },
          Math.random() * 0.15 // Random stagger
        );
      });

      // 4. Smoothly draw fat marker circle (fading in opacity to prevent dot artifact)
      tl.to(
        pathRef.current,
        {
          strokeDashoffset: 0,
          opacity: 1,
          duration: 1.1,
          ease: 'power2.inOut',
        },
        '-=0.15'
      );

      return () => split.revert();
    }, containerRef);

    return () => ctx.revert();
  }, [text]);

  return (
    <div ref={containerRef} className={`relative inline-block p-6 md:p-8 select-none ${className}`}>
      {/* Big & Bold Text Target */}
      <h1 
        ref={textRef} 
        className="relative z-10 text-5xl md:text-9xl font-black tracking-wider uppercase text-slate-900"
      >
        {text}
      </h1>

      {/* Tighter SVG Canvas */}
      <svg
        className="absolute -inset-4 md:-inset-6 w-[calc(100%+32px)] md:w-[calc(100%+48px)] h-[calc(100%+32px)] md:h-[calc(100%+48px)] overflow-visible pointer-events-none"
        viewBox="0 0 240 120"
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          pathLength="1"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            opacity: 0,
          }}
          // Fitted loop sitting closely around the text bounding box
          d="M 16 60 
             C 10 15, 115 5, 222 18 
             C 248 35, 242 102, 148 114 
             C 54 124, -8 98, 10 50 
             C 16 25, 78 8, 138 8"
          fill="none"
          stroke={color}
          strokeWidth="9" // Fat marker stroke
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}