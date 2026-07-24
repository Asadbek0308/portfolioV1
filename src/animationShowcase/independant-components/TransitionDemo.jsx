  import React, { useRef, useState, useEffect } from 'react';
  import { gsap } from 'gsap';
  import { CustomEase } from 'gsap/CustomEase';

  if (typeof window !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    CustomEase.create("cinematic", "M0,0 C0.1,0 0.05,1 1,1");
  }

  export default function PremiumPageTransition() {
    const numberOfStripes = 4;
    const containerRef = useRef(null);
    const page1BgRef = useRef(null);
    const page2BgRef = useRef(null);
    const page1ContentRef = useRef(null);
    const page2ContentRef = useRef(null);
    
    // Use a ref for the timeline to kill it on unmount
    const tl = useRef(null);
    const stripsRef = useRef([]);
    const isAnimating = useRef(false);

    const [currentPage, setCurrentPage] = useState(1);

    // CLEANUP: Kill the timeline when the component unmounts
    useEffect(() => {
      return () => {
        if (tl.current) tl.current.kill();
      };
    }, []);

    const menuItems = [
      { num: "01", label: "Genesis Studio", desc: "Digital craftsmanship" },
      { num: "02", label: "Our Sanctum", desc: "Selected case studies" },
      { num: "03", label: "The Threshold", desc: "Who we are" },
      { num: "04", label: "Get in Touch", desc: "Start a project" }
    ];

    const playForwardTransition = () => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      setCurrentPage(2);

      const p1Items = page1ContentRef.current?.querySelectorAll('.animate-p1');
      const p2Items = page2ContentRef.current?.querySelectorAll('.animate-p2');

      tl.current = gsap.timeline({
        onComplete: () => { isAnimating.current = false; }
      });

      tl.current.set(stripsRef.current, { transformOrigin: "left center", scaleX: 0 })
        .to(p1Items, { y: 30, opacity: 0, duration: 0.2, ease: "power2.out", stagger: 0.02 })
        .to(stripsRef.current, { scaleX: 1, duration: 0.85, ease: "cinematic", stagger: { amount: 0.22, from: "start" } }, "-=0.1")
        .set(page1BgRef.current, { autoAlpha: 0 })
        .set(page1ContentRef.current, { autoAlpha: 0, pointerEvents: "none" })
        .set(page2BgRef.current, { autoAlpha: 1 })
        .set(page2ContentRef.current, { autoAlpha: 1, pointerEvents: "auto" })
        .fromTo(p2Items, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: "power4.out", stagger: 0.06 }, "-=0.15");
    };

    const playReverseTransition = () => {
      if (isAnimating.current) return;
      isAnimating.current = true;
      setCurrentPage(1);

      const p1Items = page1ContentRef.current?.querySelectorAll('.animate-p1');
      const p2Items = page2ContentRef.current?.querySelectorAll('.animate-p2');

      tl.current = gsap.timeline({
        onComplete: () => { isAnimating.current = false; }
      });

      tl.current.to(p2Items, { y: 20, opacity: 0, duration: 0.22, ease: "power2.out", stagger: 0.02 }, 0)
        .set(stripsRef.current, { scaleX: 1, transformOrigin: "right center" }, 0)
        .to(stripsRef.current, { scaleX: 0, duration: 0.85, ease: "cinematic", stagger: { amount: 0.2, from: "start" } }, 0.02)
        .set(page2BgRef.current, { autoAlpha: 0 }, 0.2)
        .set(page2ContentRef.current, { autoAlpha: 0, pointerEvents: "none" }, 0.2)
        .set(page1BgRef.current, { autoAlpha: 1 }, 0.2)
        .set(page1ContentRef.current, { autoAlpha: 1, pointerEvents: "auto" }, 0.2)
        .fromTo(p1Items, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease: "power3.out", stagger: 0.05 }, 0.35);
    };

    return (
      <div ref={containerRef} className="relative w-full h-screen overflow-hidden select-none font-sans">
        <div ref={page1BgRef} className="absolute inset-0 bg-[#0d0d0d] z-10" />
        <div ref={page2BgRef} className="absolute inset-0 bg-[#ece9df] z-20 opacity-0 invisible" />
        
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col w-full h-full">
          {[...Array(numberOfStripes)].map((_, i) => (
            <div
              key={i}
              ref={(el) => { stripsRef.current[i] = el; }}
              className="flex-1 w-full bg-[#ece9df] scale-x-0"
              style={{ willChange: 'transform' }}
            />
          ))}
        </div>

        <div className="absolute inset-0 z-40 flex justify-center items-center w-full h-full pointer-events-none">
          <div ref={page1ContentRef} className="absolute flex flex-col items-center justify-center text-center px-6 pointer-events-auto w-full max-w-4xl">
            <h1 className="animate-p1 text-5xl sm:text-7xl md:text-9xl font-light tracking-tight text-white mb-8 uppercase leading-none">
              The Dark <br /> <span className="italic font-serif text-zinc-400 normal-case">Assembly</span>
            </h1>
            <button onClick={playForwardTransition} className="animate-p1 px-8 py-4 rounded-full border border-zinc-700 bg-transparent text-white text-xs font-semibold uppercase tracking-widest hover:bg-white hover:text-[#0d0d0d] hover:border-white transition-all duration-300">
              Explore Navigation
            </button>
          </div>

          <div ref={page2ContentRef} className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 opacity-0 invisible pointer-events-none w-full h-full text-[#0d0d0d]">
            {/* Header/Close */}
            <div className="flex justify-between items-center w-full">
              <span className="animate-p2 text-[10px] uppercase font-bold tracking-widest text-zinc-500">Menu Navigation</span>
              <button onClick={playReverseTransition} className="animate-p2 group flex items-center gap-3 py-1 text-xs font-bold uppercase tracking-widest text-[#0d0d0d] hover:opacity-75 transition-opacity pointer-events-auto">
                <span>Close</span>
                <div className="relative w-6 h-6 flex items-center justify-center border border-zinc-400 rounded-full group-hover:rotate-90 transition-transform duration-300">
                  <span className="absolute w-3 h-px bg-black rotate-45" /><span className="absolute w-3 h-px bg-black -rotate-45" />
                </div>
              </button>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-6 sm:gap-8 my-auto self-start w-full max-w-4xl pointer-events-auto">
              {menuItems.map((item, index) => (
                <div key={index} className="animate-p2 group flex items-baseline gap-6 border-b border-zinc-300/60 pb-3 sm:pb-4 cursor-pointer">
                  <span className="text-xs sm:text-sm font-bold text-zinc-400 italic font-serif">{item.num}</span>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-8 w-full">
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight uppercase leading-none transition-all duration-300 group-hover:translate-x-3 group-hover:text-zinc-600">{item.label}</h2>
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:ml-auto">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="animate-p2 flex flex-col sm:flex-row justify-between w-full text-[10px] uppercase tracking-widest text-zinc-500 gap-2 border-t border-zinc-300/40 pt-4">
              <span>© 2026 Assembly Agency</span><span>Tashkent // Global Studio</span>
            </div>
          </div>
        </div>
      </div>
    );
  }