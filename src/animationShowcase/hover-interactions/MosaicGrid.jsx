import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

/* ===========================================================
   Configuration
=========================================================== */

const CONFIG = {
  grid: {
    cols: 12,
    rows: 9,
    size: 60,
  },

  perspective: 1000,

  hoverDelay: 50,

  reveal: {
    duration: 1.2,
    stagger: 0.007,
    ease: "power2.inOut",
  },

  ambient: {
    y: [-10, -4],
    z: [-40, 40],
    rotation: [-2, 2],
    duration: [1.5, 4.5],
  },
};

const GRID_WIDTH = CONFIG.grid.cols * CONFIG.grid.size;
const GRID_HEIGHT = CONFIG.grid.rows * CONFIG.grid.size;
const HALF = CONFIG.grid.size / 2;

const PRESERVE_3D = {
  transformStyle: "preserve-3d",
};

const BACKFACE_HIDDEN = {
  backfaceVisibility: "hidden",
};

const FACE_TRANSFORMS = {
  front: `translateZ(${HALF}px)`,

  rear: `rotateY(180deg) translateZ(${HALF}px)`,

  left: `rotateY(-90deg) translateZ(${HALF}px)`,

  right: `rotateY(90deg) translateZ(${HALF}px)`,
};

const FACE_BRIGHTNESS = {
  front: "",
  rear: "",
  left: "brightness(.5)",
  right: "brightness(.65)",
};

const FACES = ["front", "rear", "left", "right"];

const IMAGES = [
  "https://picsum.photos/id/10/720/540",
  "https://picsum.photos/id/20/720/540",
  "https://picsum.photos/id/30/720/540",
  "https://picsum.photos/id/40/720/540",
  "https://picsum.photos/id/50/720/540",
  "https://picsum.photos/id/60/720/540",
  "https://picsum.photos/id/70/720/540",
];

const PROJECTS = [
  { name: "Chronos Capsule" },
  { name: "Neon Mirage" },
  { name: "Aether Void" },
  { name: "Quantum Shift" },
  { name: "Solaris Prime" },
  { name: "Echo Chamber" },
  { name: "7th Project" }
];

/* ===========================================================
   Utilities
=========================================================== */

const getHiddenFace = (rotationCount) =>
  rotationCount % 2 === 0 ? "rear" : "front";

function random(min, max) {
  return gsap.utils.random(min, max);
}
function createFace(name) {
  const face = document.createElement("div");

  face.className = "absolute w-full h-full bg-cover";

  Object.assign(face.style, BACKFACE_HIDDEN);

  face.style.transform = FACE_TRANSFORMS[name];

  if (FACE_BRIGHTNESS[name]) {
    face.style.filter = FACE_BRIGHTNESS[name];
  }

  return face;
}
function createTile(row, col) {
  const tile = document.createElement("div");

  tile.className =
    "absolute will-change-transform";

  tile.style.width = `${CONFIG.grid.size}px`;
  tile.style.height = `${CONFIG.grid.size}px`;

  tile.style.left = `${col * CONFIG.grid.size}px`;
  tile.style.top = `${row * CONFIG.grid.size}px`;

  Object.assign(tile.style, PRESERVE_3D);

  const faces = {};

  FACES.forEach((name) => {
    const face = createFace(name);

    tile.appendChild(face);

    faces[name] = face;
  });

  return {
    el: tile,
    faces,
    row,
    col,
  };
}function buildGrid(container) {
  const fragment = document.createDocumentFragment();

  const tiles = [];

  container.replaceChildren();

  for (let row = 0; row < CONFIG.grid.rows; row++) {
    for (let col = 0; col < CONFIG.grid.cols; col++) {
      const tile = createTile(row, col);

      fragment.appendChild(tile.el);

      tiles.push(tile);
    }
  }

  container.appendChild(fragment);

  return tiles;
}
function paintFace(tile, faceName, image) {
  const face = tile.faces[faceName];

  if (!face) return;

  face.style.backgroundImage = `url(${image})`;

  face.style.backgroundSize =
    `${GRID_WIDTH}px ${GRID_HEIGHT}px`;

  face.style.backgroundPosition =
    `${-tile.col * CONFIG.grid.size}px ${-tile.row * CONFIG.grid.size}px`;
}
function paintProject(tiles, image) {
  tiles.forEach((tile) => {
    paintFace(tile, "front", image);
    paintFace(tile, "rear", image);
    paintFace(tile, "left", image);
    paintFace(tile, "right", image);
  });
}
function paintIncomingProject(tiles, image, hiddenFace) {
  tiles.forEach((tile) => {
    paintFace(tile, hiddenFace, image);

    // Side faces become visible while rotating.
    // Keeping them synchronized prevents flashes.
    paintFace(tile, "left", image);
    paintFace(tile, "right", image);
  });
}
function startAmbientAnimation(tiles) {
  tiles.forEach(({ el }) => {
    gsap.to(el, {
      y: random(...CONFIG.ambient.y),
      z: random(...CONFIG.ambient.z),
      rotationZ: random(...CONFIG.ambient.rotation),
      duration: random(...CONFIG.ambient.duration),
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      force3D: true,
    });
  });
} // <-- missing


function animateReveal(tiles, rotationCount, onComplete) {
  gsap.to(
    tiles.map((tile) => tile.el),
    {
      rotationY: rotationCount * 180,

      duration: CONFIG.reveal.duration,

      ease: CONFIG.reveal.ease,

      stagger: {
        each: CONFIG.reveal.stagger,
        from: "center",
      },

      force3D: true,

      onComplete,
    }
  );
}
function preloadImages(images) {
  return Promise.all(
    images.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();

          img.src = src;

          img.onload = resolve;

          img.onerror = resolve;
        })
    )
  );
}
function createState() {
  return {
    activeProject: 0,

    rotationCount: 0,

    isAnimating: false,

    pendingProject: null,

    hoverTimer: null,
  };
}

export default function MosaicGrid() {
  const containerRef = useRef(null);
  const tilesRef = useRef([]);
  const stateRef = useRef(createState());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let mounted = true;

    async function initialize() {
      await preloadImages(IMAGES);

      if (!mounted) return;

      const tiles = buildGrid(container);

      tilesRef.current = tiles;

      paintProject(tiles, IMAGES[0]);

      const ctx = gsap.context(() => {
        startAmbientAnimation(tiles);
      });

      container.__ctx = ctx;
    }

    initialize();

    return () => {
      mounted = false;

      clearTimeout(stateRef.current.hoverTimer);

      container.__ctx?.revert();
    };
  }, [])
    const revealProject = (projectIndex) => {
    const state = stateRef.current;

    if (
      projectIndex === state.activeProject &&
      !state.isAnimating
    ) {
      return;
    }

    if (state.isAnimating) {
      state.pendingProject = projectIndex;
      return;
    }

    state.isAnimating = true;

    state.pendingProject = null;

    const hiddenFace = getHiddenFace(
      state.rotationCount
    );

    paintIncomingProject(
      tilesRef.current,
      IMAGES[projectIndex],
      hiddenFace
    );

    state.rotationCount++;

    state.activeProject = projectIndex;

    animateReveal(
      tilesRef.current,
      state.rotationCount,
      () => {
        state.isAnimating = false;

        if (state.pendingProject !== null) {
          revealProject(state.pendingProject);
        }
      }
    );
  };
    const handleMouseEnter = (index) => {
    const state = stateRef.current;

    clearTimeout(state.hoverTimer);

    state.hoverTimer = setTimeout(() => {
      revealProject(index);
    }, CONFIG.hoverDelay);
  };

  const handleMouseLeave = () => {
    const state = stateRef.current;

    clearTimeout(state.hoverTimer);

    revealProject(0);
  };
    return (
    <div className="relative flex items-center justify-center w-screen h-screen overflow-hidden bg-[#0a0a0a] font-mono select-none">

      <div
        className="relative"
        style={{
          width: GRID_WIDTH,
          height: GRID_HEIGHT,
          perspective: CONFIG.perspective,
          ...PRESERVE_3D,
        }}
      >

        <div
          ref={containerRef}
          style={{
            width: GRID_WIDTH,
            height: GRID_HEIGHT,
            ...PRESERVE_3D,
          }}
        />

      </div>

      <nav
        className="absolute right-10 bottom-10 z-20 flex flex-col items-end"
        onMouseLeave={handleMouseLeave}
      >
        {PROJECTS.map((project, index) => (
          <button
            key={project.name}
            onMouseEnter={() => handleMouseEnter(index)}
            className="
              py-1
              text-base
              uppercase
              tracking-wider
              text-white
              opacity-40
              transition-opacity
              duration-300
              hover:opacity-100
            "
          >
            {project.name}
          </button>
        ))}
      </nav>

    </div>
  );
}