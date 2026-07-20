// AsadbekLogo.jsx
import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const AsadbekLogo = ({ size = "header" }) => {
  const logoRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const logo = logoRef.current;
      const nameWhite = logo.querySelector(".name-white");
      const nameAmber = logo.querySelector(".name-amber");
      const bracketOpen = logo.querySelector(".bracket-open");
      const bracketSlash = logo.querySelector(".bracket-slash");
      const bracketClose = logo.querySelector(".bracket-close");

      // Split text into individual characters
      const nameWhiteSplit = new SplitText(nameWhite, { type: "chars", charsClass: "char-white" });
      const nameAmberSplit = new SplitText(nameAmber, { type: "chars", charsClass: "char-amber" });
      const allNameChars = [...nameWhiteSplit.chars, ...nameAmberSplit.chars];

      // Initial states
      gsap.set([bracketOpen, bracketClose], { scale: 0, rotation: 180, opacity: 0 });
      gsap.set(bracketSlash, { scale: 0, opacity: 0 });
      gsap.set(allNameChars, { yPercent: 120, opacity: 0, filter: "blur(8px)" });

      // Entrance animation
      const tl = gsap.timeline({ delay: 0.3 });
      tl.to(bracketOpen, { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" })
        .to(bracketClose, { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }, "<0.1")
        .to(bracketSlash, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.3")
        .to(allNameChars, {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.7,
          stagger: 0.03,
          ease: "power3.out",
        }, "-=0.4");

      // Hover effects
      const handleEnter = () => {
        gsap.to(bracketOpen, { x: size === "large" ? -18 : -6, rotation: size === "large" ? -12 : 0, duration: 0.35, ease: "power2.out" });
        gsap.to(bracketClose, { x: size === "large" ? 18 : 6, rotation: size === "large" ? 12 : 0, duration: 0.35, ease: "power2.out" });
        gsap.to(bracketSlash, { opacity: 0.15, scale: 0.8, duration: 0.25 });
        gsap.to(nameWhiteSplit.chars, { color: "#f59e0b", duration: 0.3, stagger: 0.02 });
        gsap.to(nameAmberSplit.chars, { color: "#fff", duration: 0.3, stagger: 0.02 });
      };

      const handleLeave = () => {
        gsap.to([bracketOpen, bracketClose], { x: 0, rotation: 0, duration: 0.35, ease: "power2.inOut" });
        gsap.to(bracketSlash, { opacity: 1, scale: 1, duration: 0.25 });
        gsap.to(nameWhiteSplit.chars, { color: "#fff", duration: 0.3, stagger: 0.02 });
        gsap.to(nameAmberSplit.chars, { color: "#f59e0b", duration: 0.3, stagger: 0.02 });
      };

      logo.addEventListener("mouseenter", handleEnter);
      logo.addEventListener("mouseleave", handleLeave);

      return () => {
        logo.removeEventListener("mouseenter", handleEnter);
        logo.removeEventListener("mouseleave", handleLeave);
        nameWhiteSplit.revert();
        nameAmberSplit.revert();
      };
    }, logoRef);

    return () => ctx.revert();
  }, [size]);

  const isLarge = size === "large";

  return (
    <a
      ref={logoRef}
      href="/"
      className={`inline-block font-bold tracking-tight select-none ${isLarge ? "text-6xl md:text-8xl" : "text-xl md:text-2xl"}`}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <span className="bracket-open inline-block text-neutral-500">&lt;</span>
      <span className="name-white inline-block text-neutral-100">Asad</span>
      <span className="name-amber inline-block text-base-context">bek</span>
      <span className="bracket-slash inline-block text-neutral-500">/</span>
      <span className="bracket-close inline-block text-neutral-500">&gt;</span>
    </a>
  );
};

export default AsadbekLogo;