import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import gsap from "gsap";

// ─── Config ──────────────────────────────────────────────────────────────
// Change this to control the layout: 1 = full bleed, 2 = halves,
// 4 = quarters, 6 = 3x2, 9 = 3x3 ... any number works. Portrait photos
// below are cycled to match — there is no fixed image list to run out of.
const CELL_COUNT = 4;

// ─── Tunables for the trail effect (matched to reference clip) ─────────
const PIXEL_SIZE = 64; // size (css px) of one pixelation block — chunky mosaic
const DECAY = 0.022; // per-frame fade back to "covered" (~1s trail at 60fps)
const RADIUS = 1.7; // reach of the reveal brush, in blocks — wide + soft

// Evenly-spaced, always-distinct tint per cell, for any CELL_COUNT.
function colorForIndex(i, total) {
  const hue = (i * (360 / Math.max(total, 1)) + 18) % 360;
  return `hsl(${hue}, 55%, 32%)`;
}

// Curated pool of real Unsplash portrait photos (people, high quality).
// Cycled with modulo so ANY CELL_COUNT is covered — bump the constant to
// 10 and you still get 10 real photos, not 4 photos + 6 blanks.
const PORTRAIT_IDS = [
  "photo-1502685104226-ee32379fefbe",
  "photo-1494790108377-be9c29b29330",
  "photo-1552058544-f2b08422138a",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1544005313-94ddf0286df2",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1500648767791-00dcc994a43e",
  "photo-1438761681033-6461ffad8d80",
  "photo-1521119989659-a83eee488004",
  "photo-1524504388940-b1c1722653e1",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1544723795-3fb6469f5b39",
  "photo-1546456073-92b9f0a8d413",
  "photo-1557862921-37829c790f19",
  "photo-1531123897727-8f129e1688ce",
  "photo-1487412720507-e7ab37603c6f",
];

function unsplashUrl(id, size = 1200) {
  return `https://images.unsplash.com/${id}?w=${size}&q=80&fm=jpg&fit=crop&crop=faces&auto=format`;
}

// One safe, always-available fallback per index, used only if the primary
// Unsplash photo fails to load (network hiccup, id retired, etc).
function fallbackUrl(i) {
  return `https://picsum.photos/seed/pixel-reveal-${i}/1200/1200`;
}

function getPeopleImages(count) {
  return Array.from({ length: count }, (_, i) => unsplashUrl(PORTRAIT_IDS[i % PORTRAIT_IDS.length]));
}

function PixelRevealCell({ src, fallbackSrc, color, label }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const revealRef = useRef(null); // Float32Array, 0 = covered, 1 = revealed
  const dimsRef = useRef({ cols: 0, rows: 0, cellW: 0, cellH: 0, dpr: 1 });
  const tickerFnRef = useRef(null);
  const labelRef = useRef(null);
  const imgRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Paint the whole canvas back to a flat cover (used on mount / resize).
  const drawFull = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [color]);

  // Recompute canvas resolution + block grid whenever the cell resizes.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const cols = Math.max(1, Math.ceil(rect.width / PIXEL_SIZE));
    const rows = Math.max(1, Math.ceil(rect.height / PIXEL_SIZE));

    dimsRef.current = {
      cols,
      rows,
      cellW: canvas.width / cols,
      cellH: canvas.height / rows,
      dpr,
    };
    revealRef.current = new Float32Array(cols * rows); // starts fully covered
    drawFull();
  }, [drawFull]);

  // One redraw pass: only touches blocks that aren't fully transparent or
  // fully opaque, so idle frames are practically free. Blocks cross-fade
  // smoothly between covered (tint color) and revealed (transparent).
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const reveal = revealRef.current;
    if (!canvas || !reveal) return false;
    const { cols, rows, cellW, cellH } = dimsRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;

    let stillActive = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const v = reveal[i];
        if (v > 0.995) continue; // fully revealed -> leave transparent
        if (v > 0.0005) stillActive = true;
        ctx.globalAlpha = 1 - v;
        ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
      }
    }
    ctx.globalAlpha = 1;
    return stillActive;
  }, [color]);

  // Per-frame decay of the reveal map, driven by gsap.ticker (shares the
  // browser's rAF loop with GSAP instead of spinning up our own).
  const tick = useCallback(() => {
    const reveal = revealRef.current;
    if (!reveal) return;
    for (let i = 0; i < reveal.length; i++) {
      if (reveal[i] > 0) reveal[i] = Math.max(0, reveal[i] - DECAY);
    }
    const stillActive = render();
    if (!stillActive && tickerFnRef.current) {
      gsap.ticker.remove(tickerFnRef.current);
      tickerFnRef.current = null;
    }
  }, [render]);

  const ensureTicker = useCallback(() => {
    if (!tickerFnRef.current) {
      tickerFnRef.current = tick;
      gsap.ticker.add(tickerFnRef.current);
    }
  }, [tick]);

  // Stamp a soft round brush of "revealed" into the grid at the pointer.
  const handlePointerMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      const reveal = revealRef.current;
      if (!canvas || !reveal) return;
      const rect = canvas.getBoundingClientRect();
      const { cols, rows, cellW, cellH, dpr } = dimsRef.current;

      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      const cc = Math.floor(x / cellW);
      const cr = Math.floor(y / cellH);
      const reach = Math.ceil(RADIUS);

      for (let dr = -reach; dr <= reach; dr++) {
        for (let dc = -reach; dc <= reach; dc++) {
          const r = cr + dr;
          const c = cc + dc;
          if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
          if (Math.hypot(dr, dc) > RADIUS) continue;
          reveal[r * cols + c] = 1;
        }
      }
      render();
      ensureTicker();
    },
    [render, ensureTicker]
  );

  useEffect(() => {
    setupCanvas();
    const ro = new ResizeObserver(() => setupCanvas());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      if (tickerFnRef.current) gsap.ticker.remove(tickerFnRef.current);
    };
  }, [setupCanvas]);

  useEffect(() => {
    if (!labelRef.current) return;
    gsap.to(labelRef.current, {
      opacity: hovered ? 0 : 1,
      duration: 0.35,
      ease: "power2.out",
    });
  }, [hovered]);

  useEffect(() => {
    if (loaded && imgRef.current) {
      gsap.fromTo(imgRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" });
    }
  }, [loaded]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-neutral-900"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={handlePointerMove}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-neutral-800" aria-hidden="true" />
      )}
      {src && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt=""
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
          }}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-0"
        />
      )}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 flex items-end p-4 sm:p-6"
      >
        <span className="text-sm font-bold uppercase tracking-wide text-white sm:text-base">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function PixelRevealGrid() {
  const cols = Math.ceil(Math.sqrt(CELL_COUNT));
  const rows = Math.ceil(CELL_COUNT / cols);

  const images = useMemo(() => getPeopleImages(CELL_COUNT), []);
  const gridRef = useRef(null);

  const colors = useMemo(
    () => Array.from({ length: CELL_COUNT }, (_, i) => colorForIndex(i, CELL_COUNT)),
    []
  );

  useEffect(() => {
    if (!gridRef.current) return;
    gsap.from(gridRef.current.children, {
      opacity: 0,
      y: 16,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out",
    });
  }, []);

  return (
    <div className="h-screen w-full bg-neutral-950 p-3 sm:p-4">
      <div
        ref={gridRef}
        className="grid h-full w-full gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {Array.from({ length: CELL_COUNT }, (_, i) => (
          <PixelRevealCell
            key={i}
            src={images[i]}
            fallbackSrc={fallbackUrl(i)}
            color={colors[i]}
            label="Hover to see"
          />
        ))}
      </div>
    </div>
  );
}