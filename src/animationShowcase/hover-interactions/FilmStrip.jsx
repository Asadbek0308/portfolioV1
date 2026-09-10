import React, { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';

const PHOTO_SERIES = [
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1000&q=80',
];

// Bigger ceiling + wider spread so the active cluster reads as a pile of photos
const LAYOUTS = [
  { y: -190, scale: 5.6, rotation: -14 },
  { y: 160, scale: 5.0, rotation: 10 },
  { y: -230, scale: 6.2, rotation: -7 },
  { y: 200, scale: 5.2, rotation: 16 },
  { y: -130, scale: 4.6, rotation: 6 },
  { y: 140, scale: 5.6, rotation: -18 },
  { y: -260, scale: 6.0, rotation: 4 },
  { y: 190, scale: 4.8, rotation: -9 },
];

// Logical spacing unit (drives the row-positioning math) vs. the actual
// rendered box size. Rendering natively at CARD_NATIVE and only ever scaling
// *down* from it means the browser rasterizes once at high res and every
// state — resting or fully expanded — samples down from that, so nothing
// ever looks soft from being stretched past its native resolution.
const CARD_LOGICAL = 28;
const CARD_NATIVE = 160;
const CARD_OFFSET = (CARD_NATIVE - CARD_LOGICAL) / 2;
const SCALE_RATIO = CARD_LOGICAL / CARD_NATIVE;

// Simple deterministic pseudo-random so jitter is stable across re-renders
function seededRandom(seed) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

export default function FilmStrip() {
  const containerRef = useRef(null);
  const rowRef = useRef(null);
  const cardsRef = useRef([]);
  const lineRef = useRef(null);
  const lineXTo = useRef(null);
  const rowXTo = useRef(null);
  const rowYTo = useRef(null);

  const mousePos = useRef({ x: 0, y: 0 });
  const containerRect = useRef({ left: 0, top: 0, width: 0, height: 0 });

  // Per-card jitter for an organic, scattered "pile" feel instead of a clean fan
  const jitter = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        rot: (seededRandom(i) - 0.5) * 14,
        xOff: (seededRandom(i + 50) - 0.5) * 18,
        yOff: (seededRandom(i + 130) - 0.5) * 24,
      })),
    []
  );

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    if (!cards.length) return;

    const updateRect = () => {
      if (!containerRef.current) return;
      containerRect.current = containerRef.current.getBoundingClientRect();
    };
    updateRect();

    // Initialize cursor to the center of the container so the first frame
    // (before any mousemove) is already correct.
    mousePos.current = {
      x: containerRect.current.width / 2,
      y: containerRect.current.height / 2,
    };

    // quickTo gives the stripe a short eased delay instead of snapping instantly
    if (lineRef.current) {
      lineXTo.current = gsap.quickTo(lineRef.current, 'x', {
        duration: 0.45,
        ease: 'power3.out',
      });
    }
    // Whole-row nudge, opposite the cursor's offset from center, so edge
    // cursor positions still pull the clipped end of the strip into view
    if (rowRef.current) {
      rowXTo.current = gsap.quickTo(rowRef.current, 'x', {
        duration: 0.6,
        ease: 'power2.out',
      });
      rowYTo.current = gsap.quickTo(rowRef.current, 'y', {
        duration: 0.6,
        ease: 'power2.out',
      });
    }

    const handleMouseMove = (e) => {
      // Convert viewport coordinates into container-relative coordinates so
      // the strip locks to the cursor regardless of the section's page offset
      mousePos.current.x = e.clientX - containerRect.current.left;
      mousePos.current.y = e.clientY - containerRect.current.top;
    };

    // Force the OS cursor to hide the moment the pointer enters, restore on exit
    const handleEnter = () => {
      document.body.style.cursor = 'none';
    };
    const handleLeave = () => {
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    const el = containerRef.current;
    el?.addEventListener('mouseenter', handleEnter);
    el?.addEventListener('mouseleave', handleLeave);

    const updateAnimation = () => {
      const mouseX = mousePos.current.x;
      const mouseY = mousePos.current.y;
      const { width: containerWidth, height: containerHeight } = containerRect.current;

      if (lineXTo.current) {
        // xPercent stays instant (pure offset correction), only x is eased
        gsap.set(lineRef.current, { xPercent: -50 });
        lineXTo.current(mouseX);
      }

      // Offset from center, as a fraction (-0.5..0.5), drives the row nudge —
      // negated so the row shifts opposite the cursor's offset direction
      if (rowXTo.current && containerWidth && containerHeight) {
        const xFrac = mouseX / containerWidth - 0.5;
        const yFrac = mouseY / containerHeight - 0.5;
        rowXTo.current(-xFrac * 140);
        rowYTo.current(-yFrac * 90);
      }

      const cursorYOffset = (mouseY - containerHeight / 2) * -0.1;

      const spacing = CARD_LOGICAL + 10;
      const totalWidth = cards.length * spacing;

      cards.forEach((card, index) => {
        const baseX = index * spacing;

        // Wrap card positions symmetrically relative to the cursor X
        let relativeX = (baseX - mouseX) % totalWidth;
        if (relativeX < -totalWidth / 2) relativeX += totalWidth;
        if (relativeX > totalWidth / 2) relativeX -= totalWidth;

        const currentCardX = mouseX + relativeX;
        const cardCenterX = currentCardX + CARD_LOGICAL / 2;

        const distance = Math.abs(cardCenterX - mouseX);
        const activeRange = 340;

        let progress = 0;
        if (distance < activeRange) {
          const normDist = 1 - distance / activeRange;
          progress = 1 - Math.pow(1 - normDist, 3);
        }

        const layout = LAYOUTS[index % LAYOUTS.length];
        const j = jitter[index];

        // Raised floors so resting frames stay clearly visible instead of
        // washing out against the background
        const minScale = 1; // "1" = the original 28px logical footprint
        const minOpacity = 0.7;

        // Computed in logical units, then converted down into the native
        // box's own scale space so the visual footprint matches before/after
        const logicalScale = minScale + (layout.scale - minScale) * progress;
        const targetScale = logicalScale * SCALE_RATIO;

        const targetY = layout.y * progress + cursorYOffset + j.yOff * progress;
        const targetX = currentCardX + j.xOff * progress;
        const targetRotation = (layout.rotation + j.rot) * progress;
        const targetOpacity = minOpacity + (1 - minOpacity) * progress;

        gsap.set(card, {
          x: targetX,
          y: targetY,
          scale: targetScale,
          rotation: targetRotation,
          opacity: targetOpacity,
          // Stable DOM-order baseline (never negative) plus a progress boost,
          // so active frames reliably pop to front and resting frames never
          // get swallowed by an unrelated neighbor's jitter
          zIndex: index + Math.round(progress * 200),
          force3D: true,
        });
      });
    };

    gsap.ticker.add(updateAnimation);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
      el?.removeEventListener('mouseenter', handleEnter);
      el?.removeEventListener('mouseleave', handleLeave);
      document.body.style.cursor = '';
      gsap.ticker.remove(updateAnimation);
    };
  }, [jitter]);

  return (
    <section
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden flex items-center justify-start select-none cursor-none bg-base-100 text-base-content"
    >
      {/* Grid drawn with currentColor via CSS gradients (not an SVG data-URI)
          so it actually inherits base-content and flips with light/dark theme.
          Its own layer keeps the opacity dimming from affecting the cards/stripe. */}
      <div
        className="absolute inset-0 pointer-events-none text-base-content opacity-[0.08]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, currentColor 0, currentColor 1px, transparent 1px, transparent 48px),
            repeating-linear-gradient(to bottom, currentColor 0, currentColor 1px, transparent 1px, transparent 48px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Continuous Vertical Strip line with Top and Bottom Triangles */}
      <div
        ref={lineRef}
        className="absolute top-0 bottom-0 left-0 w-0.5 bg-base-content opacity-80 z-40 pointer-events-none flex flex-col justify-between items-center"
      >
        {/* Top Marker */}
        <svg className="w-3.5 h-3.5 fill-base-content -mt-1 flex-shrink-0" viewBox="0 0 10 10">
          <polygon points="0,0 10,0 5,7" />
        </svg>

        {/* Bottom Marker */}
        <svg className="w-3.5 h-3.5 fill-base-content -mb-1 flex-shrink-0" viewBox="0 0 10 10">
          <polygon points="5,3 10,10 0,10" />
        </svg>
      </div>

      {/* Row of Image Cards */}
      <div
        ref={rowRef}
        className="relative w-full h-full flex items-center justify-start pointer-events-none"
      >
        {Array.from({ length: 80 }).map((_, index) => {
          const imgSrc = PHOTO_SERIES[index % PHOTO_SERIES.length];
          return (
            <div
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="absolute top-1/2 left-0 overflow-hidden shadow-xl will-change-transform"
              style={{
                width: CARD_NATIVE,
                height: CARD_NATIVE,
                marginTop: -CARD_NATIVE / 2,
                marginLeft: -CARD_OFFSET,
              }}
            >
              <img
                src={imgSrc}
                alt={`Frame ${index}`}
                className="w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}