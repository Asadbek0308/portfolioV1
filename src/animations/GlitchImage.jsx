import { useEffect, useId, useRef } from "react";
import gsap from "gsap";

const DEFAULT_SRC =
  "https://images.unsplash.com/photo-1524660988542-c440de9c0fde?q=80&w=800&auto=format&fit=crop";

export default function GlitchImage({
  src = DEFAULT_SRC,
  alt = "Portrait",
  className = "aspect-4/5 w-full max-w-xs",
  grayscale = true,
  lineCount = 20, // Reduced slightly from 26 for significant GPU savings
  activeSpread = 2,
}) {
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef(null);
  const shiftRefs = useRef([]);
  const redRefs = useRef([]);
  const cyanRefs = useRef([]);
  const tickerRef = useRef(null);
  const hoverIndexRef = useRef(-1);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Reset line transforms smoothly
    const resetLine = (i, duration = 0.3) => {
      if (!shiftRefs.current[i]) return;
      
      gsap.to([shiftRefs.current[i], redRefs.current[i], cyanRefs.current[i]], {
        x: 0,
        duration,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to([redRefs.current[i], cyanRefs.current[i]], {
        opacity: 0,
        duration,
        overwrite: "auto",
      });
    };

    const glitchTick = () => {
      const hoverIndex = hoverIndexRef.current;

      for (let i = 0; i < lineCount; i++) {
        const dist = Math.abs(i - hoverIndex);
        const isActive = hoverIndex >= 0 && dist <= activeSpread;

        if (!isActive) {
          resetLine(i, 0.2);
          continue;
        }

        const intensity = 2 - dist / (activeSpread + 1);

        if (redRefs.current[i]) {
          gsap.to(redRefs.current[i], {
            x: gsap.utils.random(-8, 8) * intensity,
            opacity: 0.8 * intensity,
            duration: 0.06,
            ease: "none",
            overwrite: "auto",
          });
        }
        if (cyanRefs.current[i]) {
          gsap.to(cyanRefs.current[i], {
            x: gsap.utils.random(-8, 8) * intensity,
            opacity: 0.8 * intensity,
            duration: 0.06,
            ease: "none",
            overwrite: "auto",
          });
        }
        if (shiftRefs.current[i]) {
          gsap.to(shiftRefs.current[i], {
            x: gsap.utils.random(-12, 12) * intensity,
            duration: 0.05,
            ease: "none",
            overwrite: "auto",
          });
        }
      }
    };

    const startGlitch = () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      glitchTick();
      tickerRef.current = setInterval(glitchTick, 80);
    };

    const stopGlitch = () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      hoverIndexRef.current = -1;
      for (let i = 0; i < lineCount; i++) resetLine(i, 0.3);
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
      if (tickerRef.current) clearInterval(tickerRef.current);
      root.removeEventListener("mouseenter", startGlitch);
      root.removeEventListener("mousemove", handlePointerMove);
      root.removeEventListener("mouseleave", stopGlitch);
      root.removeEventListener("touchstart", startGlitch);
      root.removeEventListener("touchmove", handlePointerMove);
      root.removeEventListener("touchend", stopGlitch);
    };
  }, [lineCount, activeSpread]);

  const imgStyle = {
    backgroundImage: `url("${src}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      ref={rootRef}
      className={`group relative isolate cursor-pointer select-none overflow-hidden rounded-2xl bg-neutral-900 ${className}`}
    >
      {/* SVG filters for RGB split */}
      <svg className="absolute h-0 w-0 pointer-events-none">
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

      {/* Base image */}
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
          {/* Main shifted layer */}
          <div
            ref={(el) => (shiftRefs.current[i] = el)}
            className={`absolute left-0 w-full ${grayscale ? "grayscale" : ""}`}
            style={{
              ...imgStyle,
              top: `${-i * 100}%`,
              height: `${lineCount * 100}%`,
              willChange: "transform",
            }}
          />
          {/* Red Channel */}
          <div
            ref={(el) => (redRefs.current[i] = el)}
            className={`absolute left-0 w-full mix-blend-screen opacity-0 ${grayscale ? "grayscale" : ""}`}
            style={{
              ...imgStyle,
              top: `${-i * 100}%`,
              height: `${lineCount * 100}%`,
              filter: `url(#red-${uid})`,
              willChange: "transform, opacity",
            }}
          />
          {/* Cyan Channel */}
          <div
            ref={(el) => (cyanRefs.current[i] = el)}
            className={`absolute left-0 w-full mix-blend-screen opacity-0 ${grayscale ? "grayscale" : ""}`}
            style={{
              ...imgStyle,
              top: `${-i * 100}%`,
              height: `${lineCount * 100}%`,
              filter: `url(#cyan-${uid})`,
              willChange: "transform, opacity",
            }}
          />
        </div>
      ))}

      {/* Vignette effect */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.25)]" />
    </div>
  );
}