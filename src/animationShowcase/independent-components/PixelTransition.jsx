import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function PixelTransition() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const overlayRef = useRef(null);

  const COLUMN_COUNT = 20;

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const columns = overlay.querySelectorAll('.pixel-column');
    // One timeline per toggle; the previous one is killed in cleanup so rapid clicks never fight
    let tl;

    if (isMenuOpen) {
      tl = gsap.timeline();
      columns.forEach((col, colIdx) => {
        const blocks = col.querySelectorAll('.pixel-block');
        const shuffledBlocks = shuffleArray(Array.from(blocks));
        
        // Increased from 0.02 to 0.05 to slow down the left-to-right sweep speed
        const columnBaseDelay = colIdx * 0.05;

        shuffledBlocks.forEach((block, blockIdx) => {
          // Increased from 0.008 to 0.02 to slow down individual pixel popping
          const randomInnerDelay = blockIdx * 0.02;
          
          tl.to(block, {
            opacity: 1,
            duration: 0,
          }, columnBaseDelay + randomInnerDelay);
        });
      });
    } else {
      tl = gsap.timeline();
      columns.forEach((col, colIdx) => {
        const blocks = col.querySelectorAll('.pixel-block');
        const shuffledBlocks = shuffleArray(Array.from(blocks));
        
        // Adjusted for matching exit speeds when moving rightward
        const columnBaseDelay = (COLUMN_COUNT - colIdx) * 0.05;

        shuffledBlocks.forEach((block, blockIdx) => {
          const randomInnerDelay = blockIdx * 0.02;
          
          tl.to(block, {
            opacity: 0,
            duration: 0,
          }, columnBaseDelay + randomInnerDelay);
        });
      });
    }

    return () => tl?.kill();
  }, [isMenuOpen]);

  const renderGridColumns = () => {
    return Array.from({ length: COLUMN_COUNT }).map((_, colIdx) => {
      const blockCount = 10;
      return (
        <div key={colIdx} className="pixel-column flex flex-col flex-1 h-full w-full">
          {Array.from({ length: blockCount }).map((_, blockIdx) => (
            <div
              key={blockIdx}
              className="pixel-block w-full opacity-0 bg-neutral-950 border-[0.5px] border-neutral-950 will-change-opacity select-none pointer-events-none flex-1"
            />
          ))}
        </div>
      );
    });
  };

  return (
    <div 
      className="relative w-full h-[60vh] min-h-100 bg-neutral-900 border border-b-2 mx-auto my-10 overflow-hidden text-white flex items-center justify-center"
    >
      {/* 1. Base Content Card (z-10) */}
      <div className="text-center z-10 px-6">
        <h2 className="text-3xl font-light tracking-tight mb-4">Pixel Transition Area</h2>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="font-mono text-xs tracking-widest uppercase bg-amber-400 text-neutral-900 px-4 py-2 font-bold rounded-sm shadow-sm hover:bg-amber-300 transition-colors cursor-pointer"
        >
          Trigger Pixels
        </button>
      </div>

      {/* 2. Localized Pixel Curtain Overlay (z-20) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-20 flex w-full h-full pointer-events-none overflow-hidden"
      >
        {renderGridColumns()}
      </div>

      {/* 3. Local Hidden Menu Panel (z-30) */}
      {/* Increased CSS transition delay to 500ms to gracefully balance the slower curtain animation build */}
      <div 
        className={`absolute inset-0 z-35 flex flex-col items-center justify-center p-6 bg-transparent transition-all duration-500 ${
          isMenuOpen ? 'pointer-events-auto opacity-100 delay-300' : 'pointer-events-none opacity-0'
        }`}
      >
        <p className="text-amber-400 font-mono text-xs tracking-widest uppercase mb-4">
          // Sub-Panel Unlocked
        </p>
        <h3 className="text-xl font-light tracking-wide max-w-sm text-center text-neutral-300 mb-6">
          This content container behaves completely locally to the block element.
        </h3>
        <button
          onClick={() => setIsMenuOpen(false)}
          className="font-mono text-xs tracking-widest uppercase border border-neutral-700 hover:border-neutral-500 bg-neutral-900 px-4 py-2 rounded-sm cursor-pointer"
        >
          [ Close ]
        </button>
      </div>
    </div>
  );
}
