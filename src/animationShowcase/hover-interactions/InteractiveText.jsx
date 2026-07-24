import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";

// Mixed vertical (portrait) and horizontal (landscape) images
const IMAGES_SET_1 = [
  { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=800&q=80", ratio: "portrait" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=500&q=80", ratio: "landscape" },
  { url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&h=800&q=80", ratio: "portrait" },
  { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&h=500&q=80", ratio: "landscape" }
];

const IMAGES_SET_2 = [
  { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&h=800&q=80", ratio: "portrait" },
  { url: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&h=500&q=80", ratio: "landscape" },
  { url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&h=800&q=80", ratio: "portrait" },
  { url: "https://images.unsplash.com/photo-1782346056252-c3699920bf19?auto=format&fit=crop&w=800&h=500&q=80", ratio: "landscape" }
];

export default function InteractiveText() {
  const [hoveredWord, setHoveredWord] = useState(null); 
  const [visibleImages, setVisibleImages] = useState([]); 
  
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const imageCounter = useRef(0);
  const isLeavingRef = useRef(false);

  const handleMouseEnter = (wordType) => {
    isLeavingRef.current = false;
    setHoveredWord(wordType);
    const imagesToUse = wordType === "details" ? IMAGES_SET_1 : IMAGES_SET_2;
    let index = 0;

    const spawnImage = () => {
      const uniqueId = imageCounter.current++;
      const imageObj = imagesToUse[index % imagesToUse.length];
      const rotation = Math.random() * 20 - 10; 

      setVisibleImages((prev) => {
        const updated = [...prev];
        // Standard max 2 images stacked rules
        if (updated.length >= 2) {
          updated.shift(); 
        }
        return [...updated, { id: uniqueId, ...imageObj, rotation }];
      });

      index++;
    };

    spawnImage();
    intervalRef.current = setInterval(spawnImage, 300); 
  };

  const handleMouseLeave = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    isLeavingRef.current = true;

    // Keep only the last (topmost) active image, discarding the rest immediately
    setVisibleImages((prev) => (prev.length > 0 ? [prev[prev.length - 1]] : []));
  };

  const handleFinalImageComplete = (id) => {
    // Once the lingering image finishes its exit animation, clear it from state
    if (isLeavingRef.current) {
      setVisibleImages((prev) => prev.filter((img) => img.id !== id));
      setHoveredWord(null);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative flex flex-col items-center justify-center min-h-screen bg-[#e5e5e5] text-[#111] font-sans px-12 py-20 select-none overflow-hidden"
    >
      <span className="text-xs tracking-[0.2em] font-mono mb-6 opacity-70">
        CREATIVE STUDIO BUILDING PREMIUM BRANDS
      </span>

      <h1 className="max-w-6xl text-3xl md:text-5xl lg:text-[4.2rem] font-extrabold uppercase tracking-tight leading-[1.15] text-center">
        It's never "Just a website." Every{" "}
        <span
          onMouseEnter={() => handleMouseEnter("details")}
          onMouseLeave={handleMouseLeave}
          className="relative inline-block cursor-pointer underline decoration-4 underline-offset-4"
        >
          detail
          {hoveredWord === "details" && (
            <ImageStackImages 
              images={visibleImages} 
              isLeaving={isLeavingRef.current}
              onFinalComplete={handleFinalImageComplete}
            />
          )}
        </span>{" "}
        matters. We craft digital experiences. <br className="hidden md:inline" />
        Your design, our obsession. Your brand, our{" "}
        <span
          onMouseEnter={() => handleMouseEnter("playground")}
          onMouseLeave={handleMouseLeave}
          className="relative inline-block cursor-pointer underline decoration-4 underline-offset-4"
        >
          playground
          {hoveredWord === "playground" && (
            <ImageStackImages 
              images={visibleImages} 
              isLeaving={isLeavingRef.current}
              onFinalComplete={handleFinalImageComplete}
            />
          )}
        </span>
        .
      </h1>
    </div>
  );
}

function ImageStackImages({ images, isLeaving, onFinalComplete }) {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-56 h-76 z-50 flex items-center justify-center">
      {images.map((img, index) => (
        <ImageItem 
          key={img.id} 
          img={img} 
          index={index} 
          isLeaving={isLeaving}
          onFinalComplete={onFinalComplete}
        />
      ))}
    </div>
  );
}

function ImageItem({ img, index, isLeaving, onFinalComplete }) {
  const imgRef = useRef(null);

  useEffect(() => {
    // Pop up animation: Starts from lower down, scaled down, then snaps up
    gsap.fromTo(
      imgRef.current,
      {
        scale: 0.6,
        y: 60,
        opacity: 0,
        rotation: img.rotation * 1.5,
      },
      {
        scale: 1,
        y: 0,
        opacity: 1,
        rotation: img.rotation,
        duration: 0.45,
        ease: "back.out(1.4)", // Gives it that physical spring "pop"
      }
    );
  }, [img.id, img.rotation]);

  useEffect(() => {
    // If user moused out, fade/scale out the lingering final image with a small delay
    if (isLeaving) {
      gsap.to(imgRef.current, {
        opacity: 0,
        scale: 0.8,
        y: -20,
        duration: 0.4,
        delay: 0.25, // Let it hang on screen for a moment
        ease: "power2.in",
        onComplete: () => {
          onFinalComplete(img.id);
        }
      });
    }
  }, [isLeaving, img.id, onFinalComplete]);

  // Adjust container proportions depending on the current image aspect ratio
  const ratioClasses = img.ratio === "portrait" 
    ? "w-44 h-60 md:w-52 md:h-72" 
    : "w-60 h-40 md:w-72 md:h-48";

  return (
    <div
      ref={imgRef}
      className={`absolute rounded-lg overflow-hidden border-2 border-white shadow-2xl transition-all ${ratioClasses}`}
      style={{
        zIndex: index, 
      }}
    >
      <img
        src={img.url}
        alt="Creative preview"
        className="w-full h-full object-cover"
      />
    </div>
  );
}