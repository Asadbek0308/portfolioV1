import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const ITEMS = [
  { id: "n01", photoId: 1005, heading: "Node_01", text: "Design systems & frontend architecture." },
  { id: "n02", photoId: 1012, heading: "Node_02", text: "Motion, scroll choreography, GSAP timelines." },
  { id: "n03", photoId: 1027, heading: "Node_03", text: "Auth flows, protected routes, session state." },
  { id: "n04", photoId: 1041, heading: "Node_04", text: "Video pipelines, streaming, progress tracking." },
  { id: "n05", photoId: 1074, heading: "Node_05", text: "Course architecture and module sequencing." },
  { id: "n06", photoId: 1084, heading: "Node_06", text: "Ranking systems and gamification logic." },
];

// breakpoints: [maxWidth, { radius, cardW, cardH, perspective }]
// walked in order, first match wins; last entry is the desktop fallback
const SIZE_STEPS = [
  [480, { radius: 210, cardW: 168, cardH: 232, perspective: 700 }],
  [768, { radius: 280, cardW: 210, cardH: 290, perspective: 900 }],
  [1024, { radius: 340, cardW: 240, cardH: 330, perspective: 1050 }],
  [Infinity, { radius: 420, cardW: 280, cardH: 380, perspective: 1200 }],
];

const getSizeForWidth = (width) =>
  SIZE_STEPS.find(([max]) => width <= max)[1];

const DRAG_SENSITIVITY = 0.45; // px dragged -> degrees rotated (higher = snappier)
const VELOCITY_BOOST = 340; // how far a flick projects the coast (higher = more velocity carried over)
const COAST_DURATION = 1.3; // seconds the inertia coast takes to settle
const AUTO_ROTATE_DURATION = 40; // seconds for one full 360 auto-spin
const IDLE_RESUME_DELAY = 900; // ms after release/coast before auto-rotate resumes

const BASE_TILT = 0; // resting rotationX -- no tilt unless the cursor is actively hovering
const TILT_RANGE = 20; // max degrees of rotationX swing from cursor position

const FRONT_THRESHOLD_DEG = 65; // how wide the "facing the viewer" zone is, in degrees

const Carousel3D = ({ items = ITEMS }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const proxyRef = useRef(null);
  const cardRefs = useRef([]);

  const autoTweenRef = useRef(null);
  const coastTweenRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const tiltToRef = useRef(null);
  const isDraggingRef = useRef(false);
  const frontFlagsRef = useRef(items.map(() => false));
  const isTouchRef = useRef(false);
  const updateFrontFlagsRef = useRef(() => {});

  const [size, setSize] = useState(() =>
    getSizeForWidth(typeof window !== "undefined" ? window.innerWidth : 1280)
  );

  const dragState = useRef({
    allowed: false,
    startRotation: 0,
    baseX: 0,
    lastPointerX: 0,
    lastTime: 0,
    velocity: 0, // deg per ms, accumulated while dragging
  });

  const angleStep = 360 / items.length;

  // pre-build image URLs sized for the current breakpoint + pixel density,
  // capped so retina screens don't request unnecessarily huge assets
  const imageSrcs = useMemo(() => {
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const w = Math.round(Math.min(size.cardW * dpr, 640));
    const h = Math.round(Math.min(size.cardH * dpr, 860));
    return items.map((item) => `https://picsum.photos/id/${item.photoId}/${w}/${h}`);
  }, [items, size.cardW, size.cardH]);

  // ── auto-rotate control ──────────────────────────────────────────────
  const stopAutoRotate = () => {
    if (autoTweenRef.current) {
      autoTweenRef.current.kill();
      autoTweenRef.current = null;
    }
  };

  const startAutoRotate = () => {
    stopAutoRotate();
    const current = gsap.getProperty(wrapperRef.current, "rotationY");
    autoTweenRef.current = gsap.to(wrapperRef.current, {
      rotationY: current + 360,
      duration: AUTO_ROTATE_DURATION,
      ease: "none",
      repeat: -1,
      onUpdate: updateFrontFlagsRef.current,
    });
  };

  const scheduleAutoResume = () => {
    clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      startAutoRotate();
    }, IDLE_RESUME_DELAY);
  };

  // ── responsive breakpoint tracking, debounced via rAF ──────────────────
  useEffect(() => {
    let frame = null;
    const handleResize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSize(getSizeForWidth(window.innerWidth));
      });
    };
    isTouchRef.current = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    gsap.set(wrapperRef.current, {
      rotationY: 0,
      rotationX: BASE_TILT,
      transformStyle: "preserve-3d",
      willChange: "transform",
    });

    const container = containerRef.current;

    // ── keep track of which cards currently face the viewer ──
    // called directly whenever rotationY actually changes (drag tick,
    // auto-rotate tween, coast tween) instead of polling on a timer --
    // that guarantees it's never stale, including mid-drag
    const updateFrontFlags = () => {
      const rotation = gsap.getProperty(wrapperRef.current, "rotationY");
      items.forEach((_, i) => {
        let angle = (angleStep * i + rotation) % 360;
        if (angle > 180) angle -= 360;
        if (angle < -180) angle += 360;
        const isFront = Math.abs(angle) < FRONT_THRESHOLD_DEG;
        frontFlagsRef.current[i] = isFront;
        const el = cardRefs.current[i];
        if (el) el.style.pointerEvents = isFront ? "auto" : "none";
      });
    };
    updateFrontFlagsRef.current = updateFrontFlags;
    updateFrontFlags(); // set correct initial state before any rotation happens

    startAutoRotate();

    // smooth interpolator for the cursor-tilt effect, kept separate from
    // the drag/auto-rotate tweens since it only ever touches rotationX
    tiltToRef.current = gsap.quickTo(wrapperRef.current, "rotationX", {
      duration: 0.7,
      ease: "power3.out",
    });

    // ── cursor tilt (skipped entirely on touch devices, mousemove is
    // meaningless there and can conflict with drag) ──
    const handleMouseMove = (e) => {
      if (isDraggingRef.current || isTouchRef.current) return;
      const rect = container.getBoundingClientRect();
      const yFraction = (e.clientY - rect.top) / rect.height;
      const target = BASE_TILT - (yFraction - 0.5) * TILT_RANGE;
      tiltToRef.current(target);
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) return;
      tiltToRef.current(BASE_TILT);
    };

    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);

    // ── drag-to-rotate (via invisible proxy so the container itself never moves) ──
    const [draggable] = Draggable.create(proxyRef.current, {
      type: "x",
      trigger: container,
      inertia: false,
      allowNativeTouchScrolling: false,
      onPress: function () {
        // only allow the gesture to actually rotate the carousel if it
        // started on a card that's currently facing the viewer
        const targetCard = this.pointerEvent.target.closest("[data-card-index]");
        const index = targetCard ? Number(targetCard.dataset.cardIndex) : -1;
        const allowed = index !== -1 && frontFlagsRef.current[index];
        dragState.current.allowed = allowed;

        if (!allowed) return;

        isDraggingRef.current = true;
        stopAutoRotate();
        if (coastTweenRef.current) coastTweenRef.current.kill();
        clearTimeout(idleTimeoutRef.current);

        // capture the proxy's own x at press time instead of forcing it to
        // zero -- forcing it desyncs Draggable's internal start position
        // and causes the rotation to jump the instant you press
        dragState.current.baseX = this.x;
        dragState.current.startRotation = gsap.getProperty(wrapperRef.current, "rotationY");
        dragState.current.lastPointerX = this.pointerX;
        dragState.current.lastTime = performance.now();
        dragState.current.velocity = 0;
      },
      onDrag: function () {
        if (!dragState.current.allowed) return;

        const now = performance.now();
        const dt = now - dragState.current.lastTime || 16.67;
        const dPointer = this.pointerX - dragState.current.lastPointerX;
        const instantVelocity = (dPointer * DRAG_SENSITIVITY) / dt; // deg per ms

        dragState.current.velocity = gsap.utils.interpolate(
          dragState.current.velocity,
          instantVelocity,
          0.35
        );

        const deltaX = this.x - dragState.current.baseX;
        const rotation = dragState.current.startRotation + deltaX * DRAG_SENSITIVITY;
        gsap.set(wrapperRef.current, { rotationY: rotation });
        updateFrontFlags();

        dragState.current.lastPointerX = this.pointerX;
        dragState.current.lastTime = now;
      },
      onRelease: function () {
        if (!dragState.current.allowed) return;
        dragState.current.allowed = false;
        isDraggingRef.current = false;

        const currentRotation = gsap.getProperty(wrapperRef.current, "rotationY");
        const projected = currentRotation + dragState.current.velocity * VELOCITY_BOOST;

        coastTweenRef.current = gsap.to(wrapperRef.current, {
          rotationY: projected,
          duration: COAST_DURATION,
          ease: "power3.out",
          onUpdate: updateFrontFlags,
          onComplete: scheduleAutoResume,
        });

        tiltToRef.current(BASE_TILT);
      },
    });

    return () => {
      draggable.kill();
      stopAutoRotate();
      if (coastTweenRef.current) coastTweenRef.current.kill();
      clearTimeout(idleTimeoutRef.current);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className="relative w-full touch-none select-none overflow-hidden"
      style={{ height: size.cardH + 160, perspective: size.perspective }}
    >
      {/* hidden element that Draggable actually moves */}
      <div ref={proxyRef} className="pointer-events-none absolute h-0 w-0 opacity-0" />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          ref={wrapperRef}
          style={{
            width: size.cardW,
            height: size.cardH,
            position: "absolute",
            left: -size.cardW / 2,
            top: -size.cardH / 2,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => (cardRefs.current[i] = el)}
              data-card-index={i}
              style={{
                position: "absolute",
                inset: 0,
                width: size.cardW,
                height: size.cardH,
                transform: `rotateY(${angleStep * i}deg) translateZ(${size.radius}px)`,
                transformStyle: "preserve-3d",
                backfaceVisibility: "visible",
                cursor: "grab",
              }}
            >
              <div className="group relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                <img
                  src={imageSrcs[i]}
                  alt={item.heading}
                  draggable={false}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover grayscale opacity-60 transition-all duration-500 ease-out group-hover:grayscale-0 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                    {item.heading}
                  </h3>
                  <p className="mt-1 text-[11px] sm:text-xs text-white/70">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* edge fades so cards don't hard-clip at the container bounds */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 sm:w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 sm:w-24 bg-gradient-to-l from-black to-transparent" />
    </div>
  );
};

export default Carousel3D;