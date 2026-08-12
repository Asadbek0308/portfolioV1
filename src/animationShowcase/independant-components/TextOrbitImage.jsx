import React, { useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(InertiaPlugin, Draggable);

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1786130995704-30b4863426a2?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const OrbitalTextHero = ({
  imageSrc = DEFAULT_IMAGE,
  text = "TASTE FRESH NEW",
  textColor = "#ffb703",
  maxTilt = 80
}) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const ringTiltRef = useRef(null);
  const ringSpinRef = useRef(null);

  const chars = useMemo(() => {
    const cleanText = text.trim();
    const fullString = `${cleanText}   •   ${cleanText}   •   ${cleanText}   •   `;
    return Array.from(fullString);
  }, [text]);

  const radius = 230;
  const angleStep = 360 / chars.length;

  useEffect(() => {
    if (!containerRef.current || !stageRef.current || !ringTiltRef.current || !ringSpinRef.current) return;

    gsap.set(containerRef.current, { perspective: 1200 });

    gsap.set(stageRef.current, {
      transformStyle: "preserve-3d",
      transformOrigin: "50% 50%"
    });

    gsap.set(ringTiltRef.current, {
      transformStyle: "preserve-3d",
      transformOrigin: "50% 50%",
      rotationX: -30,
      rotationZ: 0
    });

    gsap.set(ringSpinRef.current, {
      transformStyle: "preserve-3d",
      transformOrigin: "50% 50%"
    });

    InertiaPlugin.track(stageRef.current, "rotationX,rotationY");

    // Spin around Y (the ring's own vertical axis), since characters are
    // arranged around a cylinder (rotateY + translateZ) rather than a flat
    // disc. This sweeps them around while keeping every character facing
    // outward at its own position.
    const orbitAnimation = gsap.to(ringSpinRef.current, {
      rotationY: "+=360",
      ease: "none",
      duration: 16,
      repeat: -1,
    });

    let currentRotationX = 0;
    let currentRotationY = 0;

    const dragInstance = Draggable.create(document.createElement('div'), {
      trigger: containerRef.current,
      type: "x,y",
      onDrag() {
        const dragSensitivity = 0.25;

        currentRotationY += this.deltaX * dragSensitivity;
        currentRotationX -= this.deltaY * dragSensitivity;

        currentRotationX = gsap.utils.clamp(-maxTilt, maxTilt, currentRotationX);
        currentRotationY = gsap.utils.clamp(-maxTilt, maxTilt, currentRotationY);

        gsap.to(stageRef.current, {
          rotationY: currentRotationY,
          rotationX: currentRotationX,
          duration: 0.1,
          ease: "power1.out",
          overwrite: "auto"
        });
      },
      onRelease() {
        gsap.to(stageRef.current, {
          inertia: {
            rotationX: { end: currentRotationX, velocity: 'auto' },
            rotationY: { end: currentRotationY, velocity: 'auto' }
          },
          duration: 0.8,
          ease: "power2.out"
        });
      },
    });

    return () => {
      orbitAnimation.kill();
      if (dragInstance[0]) dragInstance[0].kill();
      InertiaPlugin.unTrack(stageRef.current);
    };
  }, [maxTilt]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full select-none items-center justify-center overflow-hidden bg-[#e6e7eb] cursor-grab"
    >
      <div
        ref={stageRef}
        className="relative flex h-[500px] w-[500px] items-center justify-center"
      >
        <img
          src={imageSrc}
          alt="Can Product"
          className="pointer-events-none absolute z-10 h-auto max-h-[440px] w-[260px] object-contain [filter:drop-shadow(0px_20px_30px_rgba(0,0,0,0.18))]"
        />

        <div
          ref={ringTiltRef}
          className="pointer-events-none absolute z-20 flex h-[560px] w-[560px] items-center justify-center"
        >
          <div ref={ringSpinRef} className="relative h-full w-full">
            {chars.map((char, index) => {
              const angle = index * angleStep;
              return (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 whitespace-pre font-['Courier_New',monospace,sans-serif] text-[32px] font-black [transform-style:preserve-3d]"
                  style={{
                    // Cylinder arrangement: rotateY spins each char to its
                    // position around the vertical axis, translateZ pushes it
                    // out to the radius. Because rotateY rotates the char's
                    // own facing direction along with its position, it always
                    // faces directly outward — no permanently edge-on
                    // characters like the old rotate/translateY/rotateX(-90)
                    // scheme had at the left/right of the ring.
                    transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`,
                    color: textColor
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrbitalTextHero;