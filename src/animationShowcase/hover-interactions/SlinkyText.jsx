import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

// --- CUSTOMIZATION TOOLS (Manipulate these to tweak the effect) ---
const CONFIG = {
  text: "GSAP",
  layersCount: 15,          // Number of text layers creating the slinky trail
  trailStagger: 0.015,      // Delay between each layer following the leader (seconds)
  trailEase: "power2.out",  // Easing curve for the trail movement
  trailDuration: 0.5,       // How long it takes for layers to catch up
  
  // Parallax / Bending controls
  parallaxIntensity: 0.25,  // How aggressively the top layer pulls toward the mouse
  rotateIntensity: 0.2,     // How much it twists based on cursor position
};

export default function SlinkyText() {
  const containerRef = useRef(null);
  const textRefs = useRef([]);
  
  // Clear refs array on re-renders
  textRefs.current = [];

  const addToRefs = (el) => {
    if (el && !textRefs.current.includes(el)) {
      textRefs.current.push(el);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || textRefs.current.length === 0) return;

    const layers = textRefs.current;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      
      // Calculate cursor position relative to the center of the container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate displacement vector from center (-1 to 1 range)
      const deltaX = (mouseX - centerX) / centerX;
      const deltaY = (mouseY - centerY) / centerY;

      // Base maximum values for the leader (top layer)
      const maxMoveX = deltaX * (rect.width * CONFIG.parallaxIntensity);
      const maxMoveY = deltaY * (rect.height * CONFIG.parallaxIntensity);
      const maxRotation = deltaX * (90 * CONFIG.rotateIntensity);
      const maxSkewX = deltaX * -15;

      // Animate each layer
      layers.forEach((layer, index) => {
        // FIXED FACTOR:
        // Changed from (layers.length - index) / layers.length
        // Now, even when index is at its maximum (the last layer), the factor 
        // will never drop to 0. The last layer will still move at a portion of the intensity.
        const factor = 1 - (index / layers.length) * 0.75; 

        gsap.to(layer, {
          x: maxMoveX * factor,
          y: maxMoveY * factor,
          rotation: maxRotation * factor,
          skewX: maxSkewX * factor,
          duration: CONFIG.trailDuration,
          ease: CONFIG.trailEase,
          delay: index * CONFIG.trailStagger,
          overwrite: "auto",
        });
      });
    };

    // Reset positions gracefully when mouse leaves the viewport
    const handleMouseLeave = () => {
      layers.forEach((layer, index) => {
        gsap.to(layer, {
          x: 0,
          y: 0,
          rotation: 0,
          skewX: 0,
          duration: CONFIG.trailDuration * 1.5,
          ease: "power3.out",
          delay: index * (CONFIG.trailStagger * 0.5),
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-[#1F1F1E] overflow-hidden select-none flex items-center justify-center"
    >
      {/* Background Graphic elements - Scaled Down */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
        <div className="w-[45vw] max-w-400 aspect-square border-4 border-white rounded-full flex items-center justify-center">
          <div className="w-[60%] aspect-square border-2 border-white rounded-full" />
        </div>
      </div>

      {/* Slinky Text Stack Wrapper */}
      <div className="relative grid place-items-center font-black text-[12vw] tracking-tighter leading-none uppercase z-10">
        {Array.from({ length: CONFIG.layersCount }).map((_, index) => {
          const isTopLayer = index === 0;
          
          return (
            <div
              key={index}
              ref={addToRefs}
              className={`grid-in-[1/1] will-change-transform ${
                isTopLayer 
                  ? "text-[#4ADE80]" // Top leader layer: Solid Green
                  : "text-transparent select-none pointer-events-none" // Trailing outline layers
              }`}
              style={{
                gridArea: "1 / 1 / 2 / 2", // Forces all layers onto the exact same grid cell coordinates
                WebkitTextStroke: isTopLayer ? "none" : "2px #4ADE80",
                zIndex: CONFIG.layersCount - index, // Layers stack cleanly underneath the top text
              }}
            >
              {CONFIG.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}