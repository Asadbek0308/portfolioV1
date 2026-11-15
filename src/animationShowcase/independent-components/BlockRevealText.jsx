import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BlockRevealText({
  children = [
    <h1 key="1" className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">Creative Studio</h1>,
    <h2 key="2" className="text-4xl md:text-7xl font-bold uppercase tracking-tight text-zinc-500">Design & Motion</h2>,
    <p key="3" className="text-lg md:text-xl font-medium tracking-normal text-zinc-400 normal-case mt-4">Crafting digital interfaces that capture global attention through code.</p>
  ],
  onScroll = true,
  delay = 0,
  blockColor = "bg-red-500",
  stagger = 0.15,
  duration = 0.5,
  alignment = "center", // Can be "left", "center", or "right"
  className = "",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const wrappers = container.querySelectorAll(".block-reveal-wrapper");

      wrappers.forEach((wrapper, index) => {
        const block = wrapper.querySelector(".reveal-block");
        const content = wrapper.querySelector(".reveal-content");

        if (!block || !content) return;

        const tl = gsap.timeline({ paused: true });

        tl.to(block, {
          scaleX: 1,
          duration: duration,
          ease: "power2.inOut",
        })
          .set(content, { opacity: 1 })
          .set(block, { transformOrigin: "right" })
          .to(block, {
            scaleX: 0,
            duration: duration,
            ease: "power2.inOut",
          });

        if (onScroll) {
          ScrollTrigger.create({
            trigger: wrapper,
            start: "top 70%",
            toggleActions: "play none none none",
            onEnter: () => {
              gsap.delayedCall(delay + index * stagger, () => tl.play());
            },
          });
        } else {
          gsap.delayedCall(delay + index * stagger, () => tl.play());
        }
      });
    }, container);

    return () => ctx.revert();
  }, [children, onScroll, delay, duration, stagger]);

  // Map alignment prop to text classes
  const alignmentClass = 
    alignment === "center" ? "text-center" : 
    alignment === "right" ? "text-right" : "text-left";

  const renderContent = () => {
    if (typeof children === "string") {
      return (
        <div className={`w-full block mb-2 ${alignmentClass}`}>
          <div className="block-reveal-wrapper relative inline-block overflow-hidden">
            <span className="reveal-content opacity-0 inline-block whitespace-nowrap">{children}</span>
            <div className={`reveal-block absolute inset-0 left-0 w-full h-full origin-left scale-x-0 z-10 ${blockColor}`} />
          </div>
        </div>
      );
    }

    return React.Children.map(children, (child) => {
      if (!child) return null;
      return (
        <div className={`w-full block mb-2 ${alignmentClass}`}>
          <div className="block-reveal-wrapper relative inline-block overflow-hidden">
            <span className="reveal-content opacity-0 inline-block">{child}</span>
            <div className={`reveal-block absolute inset-0 left-0 w-full h-full origin-left scale-x-0 z-10 ${blockColor}`} />
          </div>
        </div>
      );
    });
  };

  return (
    <div ref={containerRef} className={`w-full ${alignmentClass} ${className}`}>
      {renderContent()}
    </div>
  );
}