import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

/**
 * GlitchImage
 * ---------------------------------------------------------------
 * Splits the image into thin horizontal lines. Hover near one and
 * that line -- plus a couple of lines above and below it -- tears
 * into an RGB-split, horizontally-jittering glitch. Move the mouse
 * up and down and the glitched band scans with it; everywhere else
 * stays a clean still frame.
 *
 * Usage:
 *   <GlitchImage
 *     src="/photo.jpg"
 *     alt="Guest portrait"
 *     className="h-80 w-64"  // Flexible sizing controls from parent
 *     lineCount={26}
 *     activeSpread={2}
 *   />
 * ---------------------------------------------------------------
 */

const DEFAULT_SRC =
  "https://images.unsplash.com/photo-1524660988542-c440de9c0fde?q=80&w=800&auto=format&fit=crop";

export default function GlitchImage({
  src = DEFAULT_SRC,
  alt = "Portrait",
  className = "aspect-4/5 w-full max-w-xs", // Default size when no className is passed
  grayscale = true,
  lineCount = 26,
  activeSpread = 2,
}) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef(null);
  const shiftRefs = useRef([]); // per-line datamosh (horizontal shift) layer
  const redRefs = useRef([]); // per-line red-channel overlay
  const cyanRefs = useRef([]); // per-line cyan-channel overlay
  const tickerRef = useRef(null);
  const hoverIndexRef = useRef(-1); // -1 = nothing hovered yet

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const resetLine = (i, duration = 0.3) => {
      gsap.to([shiftRefs.current[i], redRefs.current[i], cyanRefs.current[i]], {
        x: 0,
        duration,
        ease: "power3.out",
        overwrite: true,
      });
      gsap.to([redRefs.current[i], cyanRefs.current[i]], {
        opacity: 0,
        duration,
        overwrite: true,
      });
    };

    const glitchTick = () => {
      const hoverIndex = hoverIndexRef.current;

      for (let i = 0; i < lineCount; i++) {
        const dist = Math.abs(i - hoverIndex);
        const isActive = hoverIndex >= 0 && dist <= activeSpread;

        if (!isActive) {
          resetLine(i, 0.25);
          continue;
        }

        const intensity = 2 - dist / (activeSpread + 1);

        gsap.to(redRefs.current[i], {
          x: gsap.utils.random(-10, 10) * intensity,
          opacity: 0.85 * intensity,
          duration: 0.06,
          ease: "steps(1)",
          overwrite: true,
        });
        gsap.to(cyanRefs.current[i], {
          x: gsap.utils.random(-10, 10) * intensity,
          opacity: 0.85 * intensity,
          duration: 0.06,
          ease: "steps(1)",
          overwrite: true,
        });
        gsap.to(shiftRefs.current[i], {
          x: gsap.utils.random(-16, 16) * intensity,
          duration: 0.05,
          ease: "steps(1)",
          overwrite: true,
        });
      }
    };

    const startGlitch = () => {
      glitchTick();
      tickerRef.current = setInterval(glitchTick, 90);
    };

    const stopGlitch = () => {
      clearInterval(tickerRef.current);
      hoverIndexRef.current = -1;
      for (let i = 0; i < lineCount; i++) resetLine(i, 0.35);
    };

    const handlePointerMove = (e) => {
      const rect = root.getBoundingClientRect();
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const relY = clientY - rect.top;
      const idx = Math.floor((relY / rect.height) * lineCount);
      hoverIndexRef.current = Math.min(lineCount - 1, Math.max(0, idx));
    };

    root.addEventListener("mouseenter", startGlitch);
    root.addEventListener("mousemove", handlePointerMove);
    root.addEventListener("mouseleave", stopGlitch);
    root.addEventListener("touchstart", startGlitch, { passive: true });
    root.addEventListener("touchmove", handlePointerMove, { passive: true });
    root.addEventListener("touchend", stopGlitch);

    return () => {
      clearInterval(tickerRef.current);
      root.removeEventListener("mouseenter", startGlitch);
      root.removeEventListener("mousemove", handlePointerMove);
      root.removeEventListener("mouseleave", stopGlitch);
      root.removeEventListener("touchstart", startGlitch);
      root.removeEventListener("touchmove", handlePointerMove);
      root.removeEventListener("touchend", stopGlitch);
    };
  }, [lineCount, activeSpread]);

  const imgStyle = {
    backgroundImage: `url(${src})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      ref={rootRef}
      className={`group relative isolate cursor-pointer select-none overflow-hidden rounded-2xl bg-neutral-200 ${className}`}
    >
      {/* SVG filters that isolate a single color channel */}
      <svg className="absolute h-0 w-0">
        <defs>
          <filter id={`red-${uid}`}>
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
            />
          </filter>
          <filter id={`cyan-${uid}`}>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Base image -- always clean */}
      <div
        className={`absolute inset-0 ${grayscale ? "grayscale" : ""}`}
        style={imgStyle}
        role="img"
        aria-label={alt}
      />

      {/* Sliced lines */}
      {Array.from({ length: lineCount }).map((_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute left-0 w-full overflow-hidden"
          style={{
            top: `${(i * 100) / lineCount}%`,
            height: `${100 / lineCount}%`,
          }}
        >
          <div
            ref={(el) => (shiftRefs.current[i] = el)}
            className={`absolute left-0 w-full ${grayscale ? "grayscale" : ""}`}
            style={{
              ...imgStyle,
              top: `${-i * 100}%`,
              height: `${lineCount * 100}%`,
            }}
          />
          <div
            ref={(el) => (redRefs.current[i] = el)}
            className={`absolute left-0 w-full mix-blend-screen ${grayscale ? "grayscale" : ""}`}
            style={{
              ...imgStyle,
              top: `${-i * 100}%`,
              height: `${lineCount * 100}%`,
              filter: `url(#red-${uid})`,
              opacity: 0,
            }}
          />
          <div
            ref={(el) => (cyanRefs.current[i] = el)}
            className={`absolute left-0 w-full mix-blend-screen ${grayscale ? "grayscale" : ""}`}
            style={{
              ...imgStyle,
              top: `${-i * 100}%`,
              height: `${lineCount * 100}%`,
              filter: `url(#cyan-${uid})`,
              opacity: 0,
            }}
          />
        </div>
      ))}

      {/* Vignette effect */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.25)]" />
    </div>
  );
}