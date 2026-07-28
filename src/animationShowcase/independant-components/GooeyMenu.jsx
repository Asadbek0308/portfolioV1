import React, { useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { Plus, Edit3, Image, FileText, Camera } from 'lucide-react';

const MENU_ITEMS = [
  { id: 1, color: 'bg-amber-400 text-amber-950', icon: Edit3, label: 'Note', translateY: 80 },
  { id: 2, color: 'bg-emerald-400 text-emerald-950', icon: FileText, label: 'Document', translateY: 140 },
  { id: 3, color: 'bg-sky-400 text-sky-950', icon: Image, label: 'Image', translateY: 200 },
  { id: 4, color: 'bg-rose-400 text-rose-950', icon: Camera, label: 'Camera', translateY: 260 },
];

export default function GooeyMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const itemsRef = useRef([]);
  const timelineRef = useRef(null);
  const isAnimatingRef = useRef(false);

  // Initialize GSAP Timeline & Animations
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        paused: true,
        onStart: () => {
          isAnimatingRef.current = true;
        },
        onComplete: () => {
          isAnimatingRef.current = false;
        },
        onReverseComplete: () => {
          isAnimatingRef.current = false;
        },
      });

      // 1. Plus Button Wobble & Rotate to 'X'
      tl.to(buttonRef.current, {
        rotate: 135,
        scale: 0.9,
        duration: 0.3,
        ease: 'power2.inOut',
      }).to(buttonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: 'back.out(1.7)',
      }, '-=0.1');

      // 2. Liquid Blobs Emerge & Stagger Down
      const firstItem = itemsRef.current[0];
      const otherItems = itemsRef.current.slice(1);

      // First item liquid pop-out
      if (firstItem) {
        tl.to(
          firstItem,
          {
            y: MENU_ITEMS[0].translateY,
            scaleY: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'back.out(1.5)',
          },
          '-=0.4'
        );
      }

      // Remaining items liquid stagger chain
      if (otherItems.length > 0) {
        tl.to(
          otherItems,
          {
            y: (index) => MENU_ITEMS[index + 1].translateY,
            scaleY: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'back.out(1.4)',
            stagger: 0.08,
          },
          '-=0.3'
        );
      }

      timelineRef.current = tl;
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Handle Menu Toggle Action
  const toggleMenu = () => {
    if (isAnimatingRef.current || !timelineRef.current) return;

    if (!isOpen) {
      timelineRef.current.play();
      setIsOpen(true);
    } else {
      timelineRef.current.reverse();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[450px] p-8 select-none">
      {/* 
        SVG Gooey Filter Matrix Definition 
        This applies Gaussian Blur and adjusts the Alpha channel to create 
        the sticky "liquid blob" fusion effect when elements get close.
      */}
      <svg className="hidden absolute" aria-hidden="true">
        <defs>
          <filter id="gooey-liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0  
                0 1 0 0 0  
                0 0 1 0 0  
                0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Main Container Wrapper applying the liquid SVG filter */}
      <div
        ref={containerRef}
        style={{ filter: 'url(#gooey-liquid-filter)' }}
        className="relative flex flex-col items-center justify-start w-16 h-80"
      >
        {/* Expandable Action Items (Positioned initially behind trigger button) */}
        {MENU_ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              ref={(el) => (itemsRef.current[index] = el)}
              onClick={() => alert(`Clicked ${item.label}`)}
              title={item.label}
              className={`absolute top-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-colors duration-200 opacity-0 scale-y-0 ${item.color}`}
              style={{ transform: 'translateY(0px)' }}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        {/* Main Trigger Floating Plus Button */}
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          aria-label="Toggle menu"
          className="relative z-20 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 active:scale-95 transition-colors cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}