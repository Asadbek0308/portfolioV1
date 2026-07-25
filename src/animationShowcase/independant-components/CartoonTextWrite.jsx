import React, { useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : React.useEffect;

const FONT_FAMILY = 'Pacifico';
const FONT_URL = `https://fonts.googleapis.com/css2?family=${FONT_FAMILY}&display=swap`;

export default function CartoonTextWrite({
  text = "WELCOME",
  color = "#f97316", // Tailwind orange-500
  className = "",
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const textElRef = useRef(null);

  // Inject the fancy font once
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_URL}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);
  }, []);

  useIsomorphicLayoutEffect(() => {
    let cancelled = false;

    const waitForFont = document.fonts?.load
      ? document.fonts
          .load(`64px "${FONT_FAMILY}"`)
          .then(() => document.fonts.ready)
      : Promise.resolve();

    waitForFont.then(() => {
      if (cancelled || !textElRef.current || !svgRef.current) return;

      const textEl = textElRef.current;
      const svgEl = svgRef.current;

      // Measure the real glyph outline length so the stroke draw is exact
      const length = textEl.getComputedTextLength();

      // Snugly fit the viewBox to the rendered text's bounding box
      const bbox = textEl.getBBox();
      const pad = 24;
      svgEl.setAttribute(
        'viewBox',
        `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
      );

      gsap.set(textEl, {
        strokeDasharray: length,
        strokeDashoffset: length,
        fillOpacity: 0,
        strokeOpacity: 1,
        opacity: 1,
      });

      const tl = gsap.timeline({ delay: 0.1 });

      // 1. Draw the letterforms stroke-first, like a pen tracing the word
      tl.to(textEl, {
        strokeDashoffset: 0,
        duration: Math.max(1.4, length / 380),
        ease: 'power2.inOut',
      })
        // 2. Fill washes in as the ink "settles"
        .to(
          textEl,
          {
            fillOpacity: 1,
            duration: 0.6,
            ease: 'power1.out',
          },
          '-=0.35'
        )
        // 3. Soften the outline once filled, so it doesn't look outlined forever
        .to(
          textEl,
          {
            strokeOpacity: 0.35,
            strokeWidth: 1,
            duration: 0.4,
            ease: 'power1.out',
          },
          '-=0.15'
        );
    });

    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center p-6 md:p-10 select-none ${className}`}
    >
      <svg
        ref={svgRef}
        className="w-full max-w-3xl h-auto overflow-visible"
        viewBox="0 0 600 200"
      >
        <text
          ref={textElRef}
          x="300"
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: `"${FONT_FAMILY}", cursive`,
            fontSize: '110px',
          }}
          fill={color}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}