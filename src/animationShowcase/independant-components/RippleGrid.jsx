import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function RippleGrid() {
  const gridContainerRef = useRef(null);
  const itemsRef = useRef([]);

  // Total grid dimensions
  const ROWS = 10;
  const COLS = 10;
  const totalCells = ROWS * COLS;

  // Cleanup active GSAP animations on unmount
  useEffect(() => {
    const ctx = gsap.context(() => {}, gridContainerRef);
    return () => ctx.revert();
  }, []);

  const handleCellClick = (clickedIndex) => {
    // Filter out null refs in case of unmounting
    const targets = itemsRef.current.filter(Boolean);

    // GSAP Timeline to perform a pop-down and expand ripple
    gsap.timeline()
      .to(targets, {
        scale: 0.3,
        borderRadius: '50%',
        backgroundColor: '#3b82f6', // Tailwind blue-500
        duration: 0.3,
        ease: 'power2.in',
        stagger: {
          amount: 0.2,        // Spread full animation over 0.8 seconds
          grid: [ROWS, COLS], // Tells GSAP to calculate distances in 2D grid space
          from: clickedIndex, // Starts the stagger origin directly at the clicked cell!
        },
      })
      .to(targets, {
        scale: 1,
        borderRadius: '8px',
        backgroundColor: '#e2e8f0', // Back to slate-200
        duration: 0.2,
        ease: 'back.out(1.7)',
        stagger: {
          amount: 0.8,
          grid: [ROWS, COLS],
          from: clickedIndex,
        },
      }, '-=0.1'); // Overlap back-to-normal phase
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
      <h2 className="text-2xl font-bold mb-4">Click Any Cell to Trigger Ripple</h2>
      
      {/* 10x10 CSS Grid */}
      <div 
        ref={gridContainerRef}
        className="grid grid-cols-10 gap-2 p-4 rounded-xl shadow-2xl"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gap: '8px'
        }}
      >
        {Array.from({ length: totalCells }).map((_, index) => (
          <button
            key={index}
            ref={(el) => (itemsRef.current[index] = el)}
            onClick={() => handleCellClick(index)}
            className="w-10 h-10 md:w-12 md:h-12 bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer hover:bg-white focus:outline-none"
          >
            {index}
          </button>
        ))}
      </div>
    </div>
  );
}