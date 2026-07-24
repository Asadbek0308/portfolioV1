ximport React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase);
  // Sharp, linear-to-ease curve for mechanical precision
  CustomEase.create("minimal", "M0,0 C0.4,0 0.2,1 1,1");
}

export default function MinimalistTransition() {
  const numberOfStripes = 4; // More stripes for a finer shutter effect
  const containerRef = useRef(null);
  const page1BgRef = useRef(null);
  const page2BgRef = useRef(null);
  const stripsRef = useRef([]);
  const page1ContentRef = useRef(null);
  const page2ContentRef = useRef(null);
  const isAnimating = useRef(false);
  const tl = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    return () => { if (tl.current) tl.current.kill(); };
  }, []);

  const menuItems = [
    { num: "01", label: "Work", desc: "Selected projects" },
    { num: "02", label: "Studio", desc: "Philosophy" },
    { num: "03", label: "Journal", desc: "Observations" },
    { num: "04", label: "Contact", desc: "Inquiries" }
  ];

  const togglePage = (toPage) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setCurrentPage(toPage);

    const isForward = toPage === 2;
    const p1Items = page1ContentRef.current?.querySelectorAll('.animate-p1');
    const p2Items = page2ContentRef.current?.querySelectorAll('.animate-p2');

    tl.current = gsap.timeline({ onComplete: () => { isAnimating.current = false; } });

    // Initial Setup
    tl.current
      .set(stripsRef.current, { transformOrigin: isForward ? "left center" : "right center" })
      .to(isForward ? p1Items : p2Items, { opacity: 0, duration: 0.3, ease: "power1.inOut" })
      // Shutter Wipe
      .to(stripsRef.current, {
        scaleX: 1,
        duration: 0.6,
        ease: "minimal",
        stagger: { amount: 0.15, from: isForward ? "start" : "end" }
      })
      // Switch Content
      .set(page1BgRef.current, { autoAlpha: isForward ? 0 : 1 })
      .set(page1ContentRef.current, { autoAlpha: isForward ? 0 : 1 })
      .set(page2BgRef.current, { autoAlpha: isForward ? 1 : 0 })
      .set(page2ContentRef.current, { autoAlpha: isForward ? 1 : 0 })
      // Reveal
      .to(stripsRef.current, { scaleX: 0, duration: 0.6, ease: "minimal", stagger: { amount: 0.15, from: isForward ? "start" : "end" } })
      .fromTo(isForward ? p2Items : p1Items, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }, 
        "-=0.4"
      );
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-white text-black font-sans">
      
      {/* BACKGROUNDS */}
      <div ref={page1BgRef} className="absolute inset-0 bg-black z-10" />
      <div ref={page2BgRef} className="absolute inset-0 bg-white z-20 opacity-0 invisible" />

      {/* STRIPES */}
      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col w-full h-full">
        {[...Array(numberOfStripes)].map((_, i) => (
          <div key={i} ref={(el) => { stripsRef.current[i] = el; }} 
               className="flex-1 w-full bg-white scale-x-0" />
        ))}
      </div>

      {/* CONTENT LAYER */}
      <div className="absolute inset-0 z-40 flex flex-col p-12 w-full h-full">
        
        {/* PAGE 1: VOID */}
        <div ref={page1ContentRef} className="flex flex-col justify-center h-full text-white">
          <h1 className="animate-p1 text-[12vw] font-bold tracking-tighter leading-[0.8] mb-12">VOID</h1>
          <button onClick={() => togglePage(2)} className="animate-p1 w-fit border border-white px-8 py-3 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-colors">
            Enter_Grid
          </button>
        </div>

        {/* PAGE 2: GRID */}
        <div ref={page2ContentRef} className="absolute inset-0 p-12 opacity-0 invisible flex flex-col">
          <div className="flex justify-between border-b border-black pb-8 mb-12 animate-p2">
            <span className="text-[10px] tracking-[0.2em] uppercase">Architecture_Menu</span>
            <button onClick={() => togglePage(1)} className="text-[10px] uppercase tracking-[0.2em] font-bold hover:underline">Close</button>
          </div>
          
          <div className="flex flex-col gap-8">
            {menuItems.map((item, i) => (
              <div key={i} className="animate-p2 flex items-baseline justify-between border-b border-gray-200 pb-4 group cursor-pointer">
                <span className="text-[10px]">{item.num}</span>
                <span className="text-5xl font-light tracking-tight">{item.label}</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity uppercase">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="absolute bottom-12 left-12 z-50 text-[9px] uppercase tracking-[0.3em]">
        {currentPage === 1 ? "State: Silent" : "State: Structured"}
      </div>
    </div>
  );
}