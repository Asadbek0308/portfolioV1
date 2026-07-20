import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useTheme } from '../context/ThemeContext'; // Ensure this path matches your context file

export default function NotFound() {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const spotlightRef = useRef(null);
  const numberRefs = useRef([]);
  const textRef = useRef(null);

  // Clear previous element assignments on render
  numberRefs.current = [];

  useEffect(() => {
    const container = containerRef.current;
    const spotlight = spotlightRef.current;
    if (!container || !spotlight) return;

    // Set initial custom mouse coordinates
    gsap.set(spotlight, { xPercent: -50, yPercent: -50 });

    // 1. Mouse Move Spotlight tracking
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(spotlight, {
        x,
        y,
        duration: 0.4,
        ease: 'power2.out',
      });
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 2. Floating floating animations for individual 404 numbers
    numberRefs.current.forEach((num, index) => {
      if (!num) return;
      gsap.to(num, {
        y: 'random(-15, 15)',
        x: 'random(-10, 10)',
        rotation: 'random(-8, 8)',
        duration: `random(2, 3.5)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.2,
      });
    });

    // 3. Reveal content animation on mount
    const tl = gsap.timeline();
    tl.fromTo(
      numberRefs.current,
      { y: 100, opacity: 0, scale: 0.5 },
      { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.7)', stagger: 0.15 }
    ).fromTo(
      textRef.current?.children || [],
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1 },
      '-=0.4'
    );

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      numberRefs.current.forEach((num) => num && gsap.killTweensOf(num));
      if (textRef.current) gsap.killTweensOf(textRef.current.children);
    };
  }, []);

  // Magnetic hover effect when cursor directly touches the 404 numbers
  const handleNumberEnter = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1.25,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleNumberLeave = (e) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      color: '', // Fallback to CSS default
      duration: 0.4,
      ease: 'power2.out',
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden bg-base-100 text-base-content select-none"
    >
      {/* Dynamic spotlight background layer */}
      <div
        ref={spotlightRef}
        className="absolute pointer-events-none w-150 h-150 rounded-full blur-[140px] opacity-15 dark:opacity-10 transition-colors duration-500"
        style={{
          background: theme === 'dark' 
            ? 'radial-gradient(circle, rgba(56,189,248,1) 0%, rgba(0,0,0,0) 70%)' 
            : 'radial-gradient(circle, rgba(14,165,233,1) 0%, rgba(0,0,0,0) 70%)',
          left: 0,
          top: 0,
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-xl">
        
        {/* Floating 404 digits */}
        <div className="flex gap-4 md:gap-8 mb-6 cursor-default">
          {['4', '0', '4'].map((digit, idx) => (
            <span
              key={idx}
              ref={(el) => (numberRefs.current[idx] = el)}
              onMouseEnter={handleNumberEnter}
              onMouseLeave={handleNumberLeave}
              className="text-[9rem] md:text-[14rem] font-black tracking-tight leading-none inline-block transition-colors duration-300"
            >
              {digit}
            </span>
          ))}
        </div>

        {/* Text descriptions */}
        <div ref={textRef} className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
            Lost in Space
          </h1>
          <p className="text-sm md:text-base opacity-70 max-w-md mx-auto">
            The page you are looking for does not exist or has been moved. Use the button below to navigate safely back home.
          </p>
          
          <div className="pt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-base-content/10 bg-base-200 hover:bg-base-300 active:scale-95 transition-all duration-200 font-medium tracking-wide focus:outline-none"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>

      {/* Subtle ambient grid lines in background */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-size-[40px_40px] mask-[image:]radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  );
}