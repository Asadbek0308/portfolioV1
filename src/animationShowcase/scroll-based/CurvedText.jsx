import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CurvedText = () => {
  const box = useRef(null);
  const texts = useRef([]);
  // unique per instance, so two CurvedTexts on one page don't share a path
  const curveId = `curve-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    // gsap.context collects the tweens + ScrollTriggers so they are killed on unmount
    const ctx = gsap.context(() => {
      texts.current.filter(Boolean).forEach((path, i) => {
        gsap.fromTo(
          path,
          { attr: { startOffset: `${35 * i - 15}%` } },
          {
            attr: { startOffset: `${35 * i + 35}%` },
            ease: "none",
            scrollTrigger: {
              trigger: box.current,
              scrub: true,
            },
          }
        );
      });
    }, box);

    return () => ctx.revert();
  }, []);

  const text = "Lorem ipsum dolor sit ame";

  return (
    <div className="section" ref={box}>
      <svg viewBox="0 0 1440 200" className="w-full h-48">
        <path
          id={curveId}
          d="M0 170 C360 170 420 30 720 30 C1020 30 1080 170 1440 170"
          fill="none"
          strokeWidth="2"
        />

        <text fill="red" fontSize="32" fontWeight="bold">
          {[...Array(3)].map((_, i) => (
            <textPath
              key={i}
              ref={(el) => {
                texts.current[i] = el;
              }}
              href={`#${curveId}`}
              startOffset={`${i * 35}%`}
              className="uppercase"
            >
              {text}
            </textPath>
          ))}
        </text>
      </svg>
    </div>
  );
};

export default CurvedText;
