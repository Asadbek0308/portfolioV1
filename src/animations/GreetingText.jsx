import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const greetings = [
  { text: "Hello", language: "English" },
  { text: "Привет", language: "Russian" },
  { text: "Bonjour", language: "French" },
  { text: "Hola", language: "Spanish" },
  { text: "Ciao", language: "Italian" },
  { text: "안녕하세요", language: "Korean" },
  { text: "Salom", language: "Uzbek" },
  { text: "Hello", language: "English" },
];

export default function GreetingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const textRef = useRef(null);
  const containerRef = useRef(null); // Ref to animate the full-screen overlay

  useEffect(() => {
    const el = textRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    // Timeline to sequence through all greetings
    const tl = gsap.timeline();

    greetings.forEach((_, index) => {
      if (index === 0) return; // Skip initial state setup for the first item

      tl.to(el, {
        y: -100,
        opacity: 0,
        duration: 0.14,
        ease: "power2.out",
        onComplete: () => {
          // Update text state mid-transition while invisible
          setCurrentIndex(index);
        },
      })
        .set(el, { y: 100, opacity: 0 }) // Instant reset to bottom
        .to(el, {
          y: 0,
          opacity: 1,
          duration: 0.14,
          ease: "power2.out",
        })
        .to({}, { duration: 0.18 }); // Pause duration before next slide
    });

    // Wait 1 second on the final greeting, then slide up to reveal website
    tl.to(container, {
      yPercent: -100,
      duration: 0.8,
      ease: "power3.inOut",
      delay: 0.7, // 1-second delay before sliding up
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      aria-label="Rapid greetings in different languages"
      className="fixed inset-0 z-60 flex h-screen w-screen items-center justify-center bg-white dark:bg-black p-4"
    >
      <div className="relative flex h-16 w-60 items-center justify-center overflow-visible">
        <div
          ref={textRef}
          className="absolute flex items-center gap-2 font-medium text-2xl text-gray-800 dark:text-gray-200"
        >
          <div
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-black dark:bg-white"
          />
          {greetings[currentIndex].text}
        </div>
      </div>
    </section>
  );
}