import { useRef, useEffect } from "react";
import gsap from "gsap";

// A circular lens follows the cursor and reveals a second image underneath.
export default function ImageScratchReveal({
  img1 = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80", // revealed under the lens
  img2 = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80", // top base image
  brushRadius = 120, // radius of the circular lens in px
  smoothness = 0.18, // lerp factor per frame (0.1 - 0.3 works best)
  className = "",
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // cursor target, smoothed lens position, lens scale, hover + load state
  const posRef = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    scale: 0,
    isHovered: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    const state = posRef.current;

    let width = 0;
    let height = 0;
    let imagesLoaded = false;
    let needsDraw = true; // forces one frame after load/resize even when idle
    let lastScale = -1;

    // object-fit: cover for canvas, so images are never stretched
    const drawCover = (img) => {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const s = Math.max(width / iw, height / ih);
      const dw = iw * s;
      const dh = ih * s;
      ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
    };

    // canvas sizing + hi-DPI. Setting width/height resets the transform,
    // so scale() below never stacks up. Size is cached here instead of being
    // measured every frame.
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!state.isHovered) {
        state.currentX = state.targetX = width / 2;
        state.currentY = state.targetY = height / 2;
      }
      needsDraw = true;
    };

    // load both images
    let loadedCount = 0;
    const baseImg = new Image();
    const revealImg = new Image();
    baseImg.crossOrigin = "anonymous";
    revealImg.crossOrigin = "anonymous";

    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        imagesLoaded = true;
        resizeCanvas();
      }
    };
    baseImg.onload = handleLoad;
    revealImg.onload = handleLoad;
    baseImg.onerror = () => console.error("ImageScratchReveal: img2 failed to load", img2);
    revealImg.onerror = () => console.error("ImageScratchReveal: img1 failed to load", img1);
    baseImg.src = img2;
    revealImg.src = img1;

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    // render loop on the GSAP ticker
    const render = () => {
      if (!imagesLoaded) return;

      // smooth follow (lerp)
      const dx = state.targetX - state.currentX;
      const dy = state.targetY - state.currentY;
      state.currentX += dx * smoothness;
      state.currentY += dy * smoothness;

      // Lens not moving and not resizing: the last frame is still correct, skip it
      const settled = Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1;
      if (!needsDraw && settled && state.scale === lastScale) return;
      needsDraw = false;
      lastScale = state.scale;

      const { currentX, currentY, scale } = state;
      const r = brushRadius * scale;

      ctx.clearRect(0, 0, width, height);

      // 1. base image (img2)
      drawCover(baseImg);

      // 2. reveal image (img1), clipped to the lens
      if (r > 0.5) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(currentX, currentY, r, 0, Math.PI * 2);
        ctx.clip();
        drawCover(revealImg);
        ctx.restore();

        // thin rim around the lens
        ctx.beginPath();
        ctx.arc(currentX, currentY, r, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.stroke();
      }
    };

    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      resizeObserver.disconnect();
      gsap.killTweensOf(state);
      // stop late image loads from touching this (now dead) effect
      baseImg.onload = revealImg.onload = null;
      baseImg.onerror = revealImg.onerror = null;
    };
  }, [img1, img2, brushRadius, smoothness]);

  // pointer events cover mouse, pen and touch
  const updateTarget = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    posRef.current.targetX = e.clientX - rect.left;
    posRef.current.targetY = e.clientY - rect.top;
  };

  const handlePointerEnter = (e) => {
    const state = posRef.current;
    updateTarget(e);
    // snap, so the lens grows under the cursor instead of flying in from the centre
    state.currentX = state.targetX;
    state.currentY = state.targetY;
    state.isHovered = true;
    gsap.to(state, { scale: 1, duration: 0.35, ease: "power2.out", overwrite: true });
  };

  const handlePointerMove = (e) => {
    if (!posRef.current.isHovered) handlePointerEnter(e);
    else updateTarget(e);
  };

  const handlePointerLeave = () => {
    posRef.current.isHovered = false;
    gsap.to(posRef.current, { scale: 0, duration: 0.3, ease: "power2.inOut", overwrite: true });
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      className={`relative aspect-[16/10] w-full cursor-none select-none overflow-hidden rounded-2xl bg-stone-200 ${className}`}
      style={{ touchAction: "pan-y" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
    </div>
  );
}
