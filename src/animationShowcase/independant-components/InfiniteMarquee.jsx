import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function InfiniteMarquee({
  text = 'DEVELOPER',
  speed = 1.3,
  className = '',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray('.marquee-item');
      if (!items.length) return;

      const loop = seamlessHorizontalLoop(items, { speed, repeat: -1 });

      ScrollTrigger.create({
        onUpdate: (self) => {
          gsap.to(loop, {
            timeScale: self.direction === -1 ? -1 : 1,
            overwrite: true,
            duration: 0.3,
          });
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [text, speed]);

  // Generate 10 copies so single short words cover ultra-wide monitors easily
  const items = Array(10).fill(text);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden whitespace-nowrap bg-black py-6 border-y border-neutral-800 text-white ${className}`}
    >
      <div className="flex w-max">
        {items.map((str, idx) => (
          <span
            key={idx}
            className="marquee-item inline-block shrink-0 pr-12 md:pr-20 text-5xl md:text-7xl font-bold uppercase tracking-tighter select-none will-change-transform"
          >
            {str}
          </span>
        ))}
      </div>
    </div>
  );
}

// Compact & precise GSAP horizontal seamless loop
function seamlessHorizontalLoop(items, config = {}) {
  items = gsap.utils.toArray(items);
  let pxPerSec = (config.speed || 1) * 100;
  let widths = items.map((el) => el.offsetWidth);
  let totalWidth = items.reduce((acc, el) => acc + el.offsetWidth, 0);

  let tl = gsap.timeline({
    repeat: config.repeat,
    defaults: { ease: 'none' },
    onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100),
  });

  items.forEach((item, i) => {
    let curX = item.offsetLeft;
    let distanceToLoop = curX + widths[i];

    tl.to(
      item,
      {
        xPercent: -((distanceToLoop / widths[i]) * 100),
        duration: distanceToLoop / pxPerSec,
      },
      0
    ).fromTo(
      item,
      { xPercent: ((totalWidth - distanceToLoop) / widths[i]) * 100 },
      {
        xPercent: 0,
        duration: (totalWidth - distanceToLoop) / pxPerSec,
        immediateRender: false,
      },
      distanceToLoop / pxPerSec
    );
  });

  return tl.progress(1, true).progress(0, true);
}