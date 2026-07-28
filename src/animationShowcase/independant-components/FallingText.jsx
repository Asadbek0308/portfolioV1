import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, SplitText);

const FallingText = ({
  children = "CREATIVE DIGITAL EXPERIENCE DESIGN",
  color = "#22c55e", // Tailwind green-500 default
  delay = 0,
  className = "",
  boxExtraWidth = 12,
  boxExtraHeight = 4,
}) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    // Create GSAP Context for safe scoping and easy cleanup
    const ctx = gsap.context(() => {
      // 1. Split text into individual words using GSAP SplitText
      const split = new SplitText(textRef.current, {
        type: 'words',
        wordsClass: 'inline-block relative overflow-visible mx-[0.25em]',
      });

      const colorBoxes = [];

      // 2. Loop over each split word to create & position the color cover boxes
      split.words.forEach((wordEl) => {
        const rect = wordEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        // Create the falling color box element
        const box = document.createElement('div');
        box.className = 'falling-color-box absolute pointer-events-none rounded-md z-10';

        const width = rect.width + boxExtraWidth;
        const height = rect.height + boxExtraHeight;

        Object.assign(box.style, {
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: color,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        });

        // Attach box to the word element
        wordEl.appendChild(box);
        colorBoxes.push(box);
      });

      if (colorBoxes.length === 0) return;

      // 3. Create GSAP ScrollTrigger timeline for the falling drop animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
          end: 'bottom 25%',
          toggleActions: 'play none none reverse',
        },
        delay: delay,
        onComplete: () => {
          // Hide color boxes once animation completes to clean up layout
          gsap.set(colorBoxes, { display: 'none' });
        },
        onReverseComplete: () => {
          // Re-enable visibility when scrolling back up
          gsap.set(colorBoxes, { display: 'block' });
        },
      });

      // 4. Animate color boxes falling down with random trajectories & rotations
      tl.to(colorBoxes, {
        y: () => gsap.utils.random(250, 550),       // Drop downward off screen / section
        x: () => gsap.utils.random(-80, 80),         // Random horizontal drift
        rotation: () => gsap.utils.random(-45, 45),  // Dynamic physics rotation
        // opacity: 0,
        duration: 1.1,
        ease: 'power2.in',
        stagger: {
          amount: 0.4,
          from: 'random',
        },
      });

      // Cleanup function specifically for SplitText when re-running context
      return () => {
        split.revert();
      };
    }, containerRef);

    // Revert context and clean up GSAP animations on unmount
    return () => ctx.revert();
  }, [children, color, delay, boxExtraWidth, boxExtraHeight]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-clip py-12 flex justify-center items-center ${className}`}
    >
      <div
        ref={textRef}
        className="text-center font-bold text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight select-none max-w-5xl px-4"
      >
        {children}
      </div>
    </div>
  );
};

export default FallingText;