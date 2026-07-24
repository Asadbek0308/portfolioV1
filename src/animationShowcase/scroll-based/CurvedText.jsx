import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CurvedText = () => {
    const box = useRef(null);
    const texts = useRef([]);




useEffect(() => {
  texts.current.forEach((path, i) => {
    path.setAttribute('startOffset', -15 + (i * 35))
    gsap.to(path, {
      attr: {
        startOffset: `${35 * i + 35}%`,
      },
      ease: "none",
      scrollTrigger: {
        trigger: box.current,
        scrub: true,
      },
    });
  });
}, []);


    const text = "Lorem ipsum dolor sit ame"

    return (
        <div className="section" ref={box}>
            <svg
                viewBox="0 0 1440 200"
                className="w-full h-48"
            >
                <path
                    id="curve"
                    d="M0 170 C360 170 420 30 720 30 C1020 30 1080 170 1440 170"
                    fill="none"
                    // stroke="#00317E"
                    strokeWidth="2"
                />

                <text fill="red" fontSize="32" fontWeight={"bold"}>
                    {
                        [...Array(3)].map((_, i) => {
                            return (
                                <textPath  ref={ref => texts.current[i] = ref} key={i} href="#curve" startOffset={i * 35 + "%"} className="uppercase">
                                    {text}
                                </textPath>

                            )
                        })
                    }
                </text>
            </svg>
        </div>
    );
};

export default CurvedText;  