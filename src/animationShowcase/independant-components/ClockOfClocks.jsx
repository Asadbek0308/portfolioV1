import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// Target direction angles (0 deg = Up, 90 deg = Right, 180 deg = Down, 270 deg = Left)
const DIRECTIONS = {
  RIGHT: 90,
  DOWN: 180,
  LEFT: 270,
  UP: 0,
  BLANK: 225, // Idle / diagonal position
};

// Fixed 2x3 Grid Digit Angle Definitions [top-left, top-right, mid-left, mid-right, bot-left, bot-right]
const PAIR_MAP = {
  0: [
    [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.DOWN, DIRECTIONS.UP],
    [DIRECTIONS.DOWN, DIRECTIONS.UP],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
  ],
  1: [
    [DIRECTIONS.BLANK, DIRECTIONS.BLANK],
    [DIRECTIONS.DOWN, DIRECTIONS.DOWN],
    [DIRECTIONS.BLANK, DIRECTIONS.BLANK],
    [DIRECTIONS.DOWN, DIRECTIONS.UP],
    [DIRECTIONS.BLANK, DIRECTIONS.BLANK],
    [DIRECTIONS.UP, DIRECTIONS.UP],
  ],
  2: [
    [DIRECTIONS.RIGHT, DIRECTIONS.RIGHT],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.LEFT],
  ],
  3: [
    [DIRECTIONS.RIGHT, DIRECTIONS.RIGHT],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.RIGHT, DIRECTIONS.RIGHT],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
    [DIRECTIONS.RIGHT, DIRECTIONS.RIGHT],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
  ],
  4: [
    [DIRECTIONS.DOWN, DIRECTIONS.DOWN],
    [DIRECTIONS.DOWN, DIRECTIONS.DOWN],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.BLANK, DIRECTIONS.BLANK],
    [DIRECTIONS.UP, DIRECTIONS.UP],
  ],
  5: [
    [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
    [DIRECTIONS.LEFT, DIRECTIONS.LEFT],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.RIGHT, DIRECTIONS.RIGHT],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
  ],
  6: [
    [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
    [DIRECTIONS.LEFT, DIRECTIONS.LEFT],
    [DIRECTIONS.DOWN, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
  ],
  7: [
    [DIRECTIONS.RIGHT, DIRECTIONS.RIGHT],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.BLANK, DIRECTIONS.BLANK],
    [DIRECTIONS.DOWN, DIRECTIONS.UP],
    [DIRECTIONS.BLANK, DIRECTIONS.BLANK],
    [DIRECTIONS.UP, DIRECTIONS.UP],
  ],
  8: [
    [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
  ],
  9: [
    [DIRECTIONS.RIGHT, DIRECTIONS.DOWN],
    [DIRECTIONS.LEFT, DIRECTIONS.DOWN],
    [DIRECTIONS.RIGHT, DIRECTIONS.UP],
    [DIRECTIONS.DOWN, DIRECTIONS.UP],
    [DIRECTIONS.RIGHT, DIRECTIONS.RIGHT],
    [DIRECTIONS.LEFT, DIRECTIONS.UP],
  ],
};

const EASING_OPTIONS = [
  { label: "Elastic Out", value: "elastic.out(1, 0.5)" },
  { label: "Steps (6)", value: "steps(6)" },
  { label: "Bounce In/Out", value: "bounce.inOut" },
  { label: "Smooth Out", value: "power2.out" },
];

// Individual Sub-Clock Component
const SubClock = ({ hourAngle, minuteAngle, ease }) => {
  const hourHandRef = useRef(null);
  const minuteHandRef = useRef(null);

  const prevHourRef = useRef(hourAngle);
  const prevMinRef = useRef(minuteAngle);

  useEffect(() => {
    if (hourHandRef.current && minuteHandRef.current) {
      let hTarget = hourAngle;
      let mTarget = minuteAngle;

      // Maintain smooth continuous clockwise rotation
      while (hTarget < prevHourRef.current) hTarget += 360;
      while (mTarget < prevMinRef.current) mTarget += 360;

      gsap.to(hourHandRef.current, {
        rotation: hTarget,
        duration: 0.9,
        ease: ease,
      });

      gsap.to(minuteHandRef.current, {
        rotation: mTarget,
        duration: 0.9,
        ease: ease,
      });

      prevHourRef.current = hTarget;
      prevMinRef.current = mTarget;
    }
  }, [hourAngle, minuteAngle, ease]);

  return (
    <div className="relative w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full border border-zinc-800/80 bg-zinc-950/90 shadow-inner flex items-center justify-center">
      <div className="absolute w-1 h-1 bg-zinc-300 rounded-full z-10" />
      <div
        ref={hourHandRef}
        className="absolute top-1/2 left-1/2 w-0.5 h-3.5 sm:h-4.5 md:h-5 bg-zinc-100 origin-bottom -translate-x-1/2 -translate-y-full rounded-full"
      />
      <div
        ref={minuteHandRef}
        className="absolute top-1/2 left-1/2 w-0.5 h-3.5 sm:h-4.5 md:h-5 bg-zinc-100 origin-bottom -translate-x-1/2 -translate-y-full rounded-full opacity-80"
      />
    </div>
  );
};

// 2x3 Grid Digit
const Digit = ({ value, ease }) => {
  const clocks = PAIR_MAP[value] ?? PAIR_MAP[0];

  return (
    <div className="grid grid-cols-2 gap-1 sm:gap-1.5 p-0.5 sm:p-1">
      {clocks.map(([hAngle, mAngle], idx) => (
        <SubClock key={idx} hourAngle={hAngle} minuteAngle={mAngle} ease={ease} />
      ))}
    </div>
  );
};

// Colon Separator
const Colon = () => (
  <div className="flex flex-col justify-around h-full py-3 sm:py-4 opacity-50">
    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-300 rounded-full animate-pulse" />
    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-300 rounded-full animate-pulse" />
  </div>
);

export default function ClockOfClocks() {
  const [time, setTime] = useState(new Date());
  const [currentEase, setCurrentEase] = useState("elastic.out(1, 0.5)");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigit = (num) => String(num).padStart(2, "0");

  const hours = formatDigit(time.getHours());
  const minutes = formatDigit(time.getMinutes());
  const seconds = formatDigit(time.getSeconds());

  const h1 = parseInt(hours[0], 10);
  const h2 = parseInt(hours[1], 10);
  const m1 = parseInt(minutes[0], 10);
  const m2 = parseInt(minutes[1], 10);
  const s1 = parseInt(seconds[0], 10);
  const s2 = parseInt(seconds[1], 10);

  return (
    <div className="flex flex-col items-center justify-center  bg-black text-white p-4 sm:p-6 font-mono select-none">
      {/* Easing Switcher Menu */}
      <div className="mb-8 flex flex-wrap justify-center gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 backdrop-blur-md">
        {EASING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCurrentEase(opt.value)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-xl transition-all duration-200 ${
              currentEase === opt.value
                ? "bg-zinc-100 text-black font-semibold shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 p-4 sm:p-8 bg-zinc-900/60 backdrop-blur-md rounded-3xl border border-zinc-800/80 shadow-2xl overflow-x-auto">
        <Digit value={h1} ease={currentEase} />
        <Digit value={h2} ease={currentEase} />
        <Colon />
        <Digit value={m1} ease={currentEase} />
        <Digit value={m2} ease={currentEase} />
        <Colon />
        <Digit value={s1} ease={currentEase} />
        <Digit value={s2} ease={currentEase} />
      </div>

      <div className="mt-8 text-zinc-500 text-xs sm:text-sm tracking-widest uppercase">
        Clock of Clocks • {hours}:{minutes}:{seconds}
      </div>
    </div>
  );
}