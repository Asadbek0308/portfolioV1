import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const GREETINGS = [
  { text: "Hello", language: "English" },
  { text: "Привет", language: "Russian" },
  { text: "Bonjour", language: "French" },
  { text: "Ciao", language: "Italian" },
  { text: "안녕하세요", language: "Korean" },
  { text: "Salom", language: "Uzbek" },
  { text: "Hello", language: "English" },
];

export default function GreetingText() {
  const [shouldShow, setShouldShow] = useState(() => {
    // Check if session storage exists in window context (SSR safety check)
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("hasSeenGreeting");
    }
    return true;
  });

  const containerRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    // If the flag is already set, do not trigger animations
    if (!shouldShow) return;

    const ctx = gsap.context(() => {
      const items = itemsRef.current.filter(Boolean);
      if (!items.length || !containerRef.current) return;

      const tl = gsap.timeline({
        onComplete: () => {
          // Mark as seen in session storage when animation finishes
          sessionStorage.setItem("hasSeenGreeting", "true");
          // Optionally unmount component state or hide overlay
          gsap.set(containerRef.current, { display: "none", pointerEvents: "none" });
          setShouldShow(false);
        },
      });

      // 1. Initial setup: hide all items except the first
      gsap.set(items, { yPercent: 100, opacity: 0 });
      gsap.set(items[0], { yPercent: 0, opacity: 1 });

      // 2. Animate through greetings smoothly
      items.forEach((item, index) => {
        if (index === 0) return;

        const prevItem = items[index - 1];

        tl.to(prevItem, {
          yPercent: -100,
          opacity: 0,
          duration: 0.15,
          ease: "power2.in",
        })
          .to(
            item,
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.15,
              ease: "power2.out",
            }
          )
          .to({}, { duration: 0.18 }); // Hold duration for each word
      });

      // 3. Slide up overlay to reveal page content
      tl.to(containerRef.current, {
        yPercent: -100,
        duration: 0.8,
        ease: "power3.inOut",
        delay: 0.5,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [shouldShow]);

  // Prevent rendering DOM element if user already saw it during this browser session
  if (!shouldShow) return null;

  return (
    <section
      ref={containerRef}
      aria-label="Rapid greetings in different languages"
      className="fixed inset-0 z-51 flex h-screen w-screen items-center justify-center bg-white dark:bg-black p-4 select-none overflow-hidden"
    >
      <div className="relative flex h-16 w-60 items-center justify-center overflow-hidden">
        {GREETINGS.map((greeting, index) => (
          <div
            key={`${greeting.language}-${index}`}
            ref={(el) => (itemsRef.current[index] = el)}
            className="absolute flex items-center gap-2 font-medium text-2xl text-gray-800 dark:text-gray-200"
            style={{ willChange: "transform, opacity" }}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-black dark:bg-white shrink-0"
            />
            {greeting.text}
          </div>
        ))}
      </div>
    </section>
  );
}