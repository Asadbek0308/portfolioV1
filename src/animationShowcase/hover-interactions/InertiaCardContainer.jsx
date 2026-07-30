import React, { useRef, useEffect } from "react";
import gsap from "gsap";

export function InertiaCardItem({
  children,
  className = "",
  initialRotation = 0,
  displacementFactor = 1.8,
  tiltFactor = 0.05,
}) {
  const cardRef = useRef(null);

  // Physics & Animation State
  const stateRef = useRef({
    // Mouse tracking
    lastX: 0,
    lastY: 0,
    mouseX: 0,
    mouseY: 0,
    isHovered: false,

    // Target displacement driven by cursor velocity
    targetX: 0,
    targetY: 0,
    targetRot: initialRotation,

    // Current physics values (Position)
    currentX: 0,
    currentY: 0,
    currentRot: initialRotation,
    currentScale: 1,

    // Velocity vectors for spring physics
    vx: 0,
    vy: 0,
    vRot: 0,
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Set origin and initial baseline transform
    gsap.set(card, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: initialRotation,
      transformOrigin: "center center",
      force3D: true, // Force GPU hardware acceleration layer
    });

    const ctx = gsap.context(() => {
      const state = stateRef.current;

      // Spring physics constants (Tuned for Inertia-style rubber elasticity)
      const stiffness = 0.12;
      const damping = 0.72;

      // Single continuous physics solver step run via GSAP Ticker
      const updatePhysics = () => {
        // --- 1. Compute Targets ---
        if (state.isHovered) {
          // Calculate mouse velocity
          const deltaX = state.mouseX - state.lastX;
          const deltaY = state.mouseY - state.lastY;

          // Clamped velocity target
          const clampedX = Math.max(-40, Math.min(40, deltaX));
          const clampedY = Math.max(-40, Math.min(40, deltaY));

          state.targetX = clampedX * displacementFactor;
          state.targetY = clampedY * displacementFactor;
          state.targetRot = initialRotation + clampedX * tiltFactor;

          // Update last positions with smooth decay when cursor stops moving inside card
          state.lastX += (state.mouseX - state.lastX) * 0.2;
          state.lastY += (state.mouseY - state.lastY) * 0.2;
        } else {
          // Rest position (return to origin)
          state.targetX = 0;
          state.targetY = 0;
          state.targetRot = initialRotation;
        }

        // --- 2. Spring Integration Loop (Hooke's Law) ---
        // X-Axis Spring
        const forceX = (state.targetX - state.currentX) * stiffness;
        state.vx = (state.vx + forceX) * damping;
        state.currentX += state.vx;

        // Y-Axis Spring
        const forceY = (state.targetY - state.currentY) * stiffness;
        state.vy = (state.vy + forceY) * damping;
        state.currentY += state.vy;

        // Rotation Spring
        const forceRot = (state.targetRot - state.currentRot) * stiffness;
        state.vRot = (state.vRot + forceRot) * damping;
        state.currentRot += state.vRot;

        // --- 3. Hardware Accelerated Direct Render ---
        gsap.set(card, {
          x: state.currentX,
          y: state.currentY,
          rotation: state.currentRot,
        });
      };

      // Add physics solver to GSAP global ticker (runs at native monitor refresh rate - 60/120/144Hz)
      gsap.ticker.add(updatePhysics);

      const handleMouseEnter = (e) => {
        state.isHovered = true;
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
        state.lastX = e.clientX;
        state.lastY = e.clientY;

        // Smooth elevation pop on hover
        gsap.to(state, {
          currentScale: 1.08,
          duration: 0.3,
          ease: "power2.out",
          onUpdate: () => gsap.set(card, { scale: state.currentScale }),
        });
      };

      const handleMouseMove = (e) => {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
      };

      const handleMouseLeave = () => {
        state.isHovered = false;

        // Smooth scale restoration
        gsap.to(state, {
          currentScale: 1,
          duration: 0.4,
          ease: "power2.out",
          onUpdate: () => gsap.set(card, { scale: state.currentScale }),
        });
      };

      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        gsap.ticker.remove(updatePhysics);
        card.removeEventListener("mouseenter", handleMouseEnter);
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, cardRef);

    return () => ctx.revert();
  }, [initialRotation, displacementFactor, tiltFactor]);

  return (
    <div
      ref={cardRef}
      className={`will-change-transform cursor-pointer shadow-xl transition-shadow hover:shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}

// Main Demo Container
export default function InertiaCardsContainer({ children }) {
  const defaultChildren = (
    <div className="relative flex items-center justify-center space-x-[-3vw]">
      {/* Card 1 */}
      <InertiaCardItem
        initialRotation={-12}
        className="w-[18vw] min-w-[210px] h-[25vw] min-h-[290px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900"
      >
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
          alt="Inertia Showcase 1"
          className="w-full h-full object-cover pointer-events-none select-none"
        />
      </InertiaCardItem>

      {/* Card 2 */}
      <InertiaCardItem
        initialRotation={-4}
        className="w-[18vw] min-w-[210px] h-[25vw] min-h-[290px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 z-10"
      >
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
          alt="Inertia Showcase 2"
          className="w-full h-full object-cover pointer-events-none select-none"
        />
      </InertiaCardItem>

      {/* Floating Tag 1 */}
      <InertiaCardItem
        initialRotation={7}
        displacementFactor={2.8}
        className="absolute top-[22%] left-[26%] z-30 px-6 py-3 rounded-full bg-amber-400 text-zinc-950 font-bold shadow-2xl backdrop-blur-md"
      >
        <p className="pointer-events-none select-none text-xs md:text-sm tracking-wider uppercase">
          ✦ Digital Experience
        </p>
      </InertiaCardItem>

      {/* Card 3 */}
      <InertiaCardItem
        initialRotation={4}
        className="w-[18vw] min-w-[210px] h-[25vw] min-h-[290px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 z-20"
      >
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
          alt="Inertia Showcase 3"
          className="w-full h-full object-cover pointer-events-none select-none"
        />
      </InertiaCardItem>

      {/* Floating Tag 2 */}
      <InertiaCardItem
        initialRotation={-9}
        displacementFactor={2.8}
        className="absolute bottom-[22%] right-[24%] z-30 px-6 py-3 rounded-full bg-emerald-400 text-zinc-950 font-bold shadow-2xl backdrop-blur-md"
      >
        <p className="pointer-events-none select-none text-xs md:text-sm tracking-wider uppercase">
          ★ Creative Motion
        </p>
      </InertiaCardItem>

      {/* Card 4 */}
      <InertiaCardItem
        initialRotation={12}
        className="w-[18vw] min-w-[210px] h-[25vw] min-h-[290px] rounded-3xl overflow-hidden border border-white/10 bg-zinc-900"
      >
        <img
          src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
          alt="Inertia Showcase 4"
          className="w-full h-full object-cover pointer-events-none select-none"
        />
      </InertiaCardItem>
    </div>
  );

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden p-6 text-white">
      {children || defaultChildren}
    </section>
  );
}