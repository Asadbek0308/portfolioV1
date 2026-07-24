import React, { useEffect, useRef } from "react";

export default function SpiderEffect({
  layers = 10,             // Number of concentric ring layers
  ringSpacing = 50,        // Distance between each concentric layer of dots
  dotsPerRingStep = 8,     // How many more dots to add with each expanding ring layer
  maxDistance = 140,       // Max length of the orange spider legs
  spiderColor = "red",     // The spider theme color
  dotColor = "rgba(255, 255, 255, 0.9)",
  className = "w-full h-full min-h-225",
  backgroundColor = "bg-black",
  children,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Position trackers
  const targetMouse = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);

  // Autonomous movement / Ease chasing variables
  const isIdle = useRef(true);
  const idleTimer = useRef(null);
  const patrolTarget = useRef({ x: 0, y: 0 });
  const interpolationSpeed = 0.05; // Speed chasing mouse/wandering

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId = null;
    let isLoopActive = false;
    let dots = [];

    // Pre-calculate squared limits to avoid Math.sqrt during loops
    const maxDistanceSq = maxDistance * maxDistance;
    const pushRadius = 60;
    const pushRadiusSq = pushRadius * pushRadius;

    // Generate dot field in concentric layers from center
    const initDots = () => {
      dots = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const addDot = (x, y) => {
        dots.push({
          x,
          y,
          homeX: x,
          homeY: y,
          vx: 0,
          vy: 0,
          radius: 1,
        });
      };

      addDot(centerX, centerY);

      for (let ringIndex = 1; ringIndex <= layers; ringIndex++) {
        const currentRadius = ringIndex * ringSpacing;
        const dotsInThisRing = ringIndex * dotsPerRingStep;

        for (let i = 0; i < dotsInThisRing; i++) {
          const angle = (i / dotsInThisRing) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * currentRadius;
          const y = centerY + Math.sin(angle) * currentRadius;
          addDot(x, y);
        }
      }

      smoothMouse.current.x = centerX;
      smoothMouse.current.y = centerY;
      patrolTarget.current = { x: centerX, y: centerY };
    };

    // Safely starts the requestAnimationFrame loop if not already running
    const wakeUpLoop = () => {
      if (!isLoopActive) {
        isLoopActive = true;
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      initDots();
      wakeUpLoop();
    };

    const pickNewPatrolTarget = () => {
      if (dots.length === 0) return;
      const randomDot = dots[Math.floor(Math.random() * dots.length)];
      patrolTarget.current = { x: randomDot.homeX, y: randomDot.homeY };
      wakeUpLoop();
    };

    const resetIdleTimer = () => {
      isIdle.current = false;
      if (idleTimer.current) clearTimeout(idleTimer.current);

      idleTimer.current = setTimeout(() => {
        isIdle.current = true;
        pickNewPatrolTarget();
      }, 1200);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse.current.x = e.clientX - rect.left;
      targetMouse.current.y = e.clientY - rect.top;

      isHovering.current = true;
      resetIdleTimer();
      wakeUpLoop();
    };

    const handleMouseLeave = () => {
      isHovering.current = false;
      isIdle.current = true;
      if (idleTimer.current) clearTimeout(idleTimer.current);
      pickNewPatrolTarget();
    };

    // Pre-allocate variables out of the loop scope to minimize Garbage Collection stutters
    let dx = 0;
    let dy = 0;
    let distSq = 0;
    let dist = 0;
    let force = 0;
    let angle = 0;
    let dxHome = 0;
    let dyHome = 0;
    let totalMovement = 0;

    // Render and Physics loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      totalMovement = 0;

      // 1. Move Spider Body
      if (isHovering.current && !isIdle.current) {
        dx = targetMouse.current.x - smoothMouse.current.x;
        dy = targetMouse.current.y - smoothMouse.current.y;
        smoothMouse.current.x += dx * interpolationSpeed;
        smoothMouse.current.y += dy * interpolationSpeed;
        totalMovement += Math.abs(dx) + Math.abs(dy);
      } else {
        dx = patrolTarget.current.x - smoothMouse.current.x;
        dy = patrolTarget.current.y - smoothMouse.current.y;
        distSq = dx * dx + dy * dy;

        smoothMouse.current.x += dx * (interpolationSpeed * 0.4);
        smoothMouse.current.y += dy * (interpolationSpeed * 0.4);
        totalMovement += Math.abs(dx) + Math.abs(dy);

        if (distSq < 225) { // 15px squared
          pickNewPatrolTarget();
        }
      }

      const spiderX = smoothMouse.current.x;
      const spiderY = smoothMouse.current.y;

      // Draw active connections first (underneath dots)
      ctx.lineWidth = 0.85;

      // 2. Main Physics Update
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Delta from dot to spider
        dx = dot.x - spiderX;
        dy = dot.y - spiderY;
        distSq = dx * dx + dy * dy;

        // Repulsion physics (only calculated if dot is inside the push radius)
        if (distSq < pushRadiusSq && distSq > 0.01) {
          dist = Math.sqrt(distSq);
          force = (pushRadius - dist) / pushRadius;
          angle = Math.atan2(dy, dx);
          
          dot.vx += Math.cos(angle) * force * 1.2;
          dot.vy += Math.sin(angle) * force * 1.2;
        }

        // Return-to-home spring physics
        dxHome = dot.homeX - dot.x;
        dyHome = dot.homeY - dot.y;
        
        dot.vx += dxHome * 0.08;
        dot.vy += dyHome * 0.08;

        // Friction dampening
        dot.vx *= 0.82;
        dot.vy *= 0.82;

        // Move the dot coordinates
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Keep track of how fast the dot is currently bouncing
        totalMovement += Math.abs(dot.vx) + Math.abs(dot.vy) + Math.abs(dxHome) + Math.abs(dyHome);

        // Draw Web Connecting Line (Legs)
        if (distSq < maxDistanceSq) {
          dist = distSq > 0 ? Math.sqrt(distSq) : 0;
          const opacity = 1 - dist / maxDistance;
          ctx.beginPath();
          ctx.moveTo(spiderX, spiderY);
          ctx.lineTo(dot.x, dot.y);
          ctx.strokeStyle = `rgba(226, 92, 61, ${opacity * 0.75})`;
          ctx.stroke();
        }

        // Draw Dot
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      // 3. Draw central spider marker
      ctx.fillStyle = spiderColor;
      ctx.fillRect(spiderX - 4, spiderY - 4, 8, 8);

      // Sleep Mode Guard: If everything has slowed down to near-zero motion, 
      // halt the animation loop entirely to save device battery.
      if (totalMovement < 0.05 && isIdle.current) {
        isLoopActive = false;
        cancelAnimationFrame(animationFrameId);
        return;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resizeCanvas);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    resizeCanvas();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener("resize", resizeCanvas);
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [layers, ringSpacing, dotsPerRingStep, maxDistance, spiderColor, dotColor]);

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${backgroundColor} ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-none"
      />
      {children && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}