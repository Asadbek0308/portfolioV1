import React, { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const CARDS_DATA = [
  {
    id: "c1",
    image: "https://picsum.photos/id/1015/600/800",
    heading: "Blueprint Systems",
    text: "Grid-driven UI language built from scratch for the portfolio redesign.",
  },
  {
    id: "c2",
    image: "https://picsum.photos/id/1025/600/800",
    heading: "Scroll Choreography",
    text: "Pinned, scrub-driven sequences that reveal content beat by beat.",
  },
  {
    id: "c3",
    image: "https://picsum.photos/id/1035/600/800",
    heading: "Signal Motion",
    text: "Cursor-reactive tilt and glare tuned with GSAP quickTo.",
  },
  {
    id: "c4",
    image: "https://picsum.photos/id/1045/600/800",
    heading: "Water Distortion",
    text: "SVG feDisplacementMap lens effect for a rippling hover state.",
  },
  {
    id: "c5",
    image: "https://picsum.photos/id/1055/600/800",
    heading: "Stair Reveal",
    text: "Clip-path bands with geometry-derived offsets for a stepped wipe.",
  },
  {
    id: "c6",
    image: "https://picsum.photos/id/1065/600/800",
    heading: "Mosaic Flip",
    text: "CSS 3D cube grid that turns tile by tile on interaction.",
  },
];

// visual params for a card sitting at a given depth in the stack
// index 0 = front / active card
const getDepthProps = (index, total) => {
  const visible = index < 5; // fade out anything deeper than 5th card
  return {
    x: 0,
    y: index * 14,
    scale: 1 - index * 0.045,
    rotation: index === 0 ? 0 : (index % 2 === 0 ? -1 : 1) * (3 + index * 1.1),
    zIndex: total - index,
    opacity: visible ? 1 : 0,
  };
};

const DRAG_THRESHOLD = 140; // px distance that counts as a "swipe away"

const CardsStack = () => {
  const [order, setOrder] = useState(CARDS_DATA.map((c) => c.id));
  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const draggableRef = useRef(null);

  const setCardRef = (id) => (el) => {
    if (el) cardRefs.current[id] = el;
  };

  // send whichever card id is at the front to the back of the stack
  const sendToBack = (id) => {
    setOrder((prev) => {
      const rest = prev.filter((cardId) => cardId !== id);
      return [...rest, id];
    });
  };

  // animate every card to its current depth position whenever order changes
  useLayoutEffect(() => {
    order.forEach((id, index) => {
      const el = cardRefs.current[id];
      if (!el) return;
      const props = getDepthProps(index, order.length);
      gsap.to(el, {
        ...props,
        duration: 0.6,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }, [order]);

  // (re)bind Draggable to whichever card is currently on top
  useLayoutEffect(() => {
    const topId = order[0];
    const topEl = cardRefs.current[topId];
    if (!topEl) return;

    if (draggableRef.current) {
      draggableRef.current.kill();
      draggableRef.current = null;
    }

    const [instance] = Draggable.create(topEl, {
      type: "x,y",
      inertia: false,
      onDragStart: function () {
        gsap.set(topEl, { zIndex: order.length + 1 });
      },
      onDrag: function () {
        // slight rotation feedback while dragging, proportional to x offset
        gsap.set(topEl, { rotation: this.x * 0.05 });
      },
      onDragEnd: function () {
        const distance = Math.hypot(this.x, this.y);

        if (distance < DRAG_THRESHOLD) {
          // not far enough -> snap back to resting position
          gsap.to(topEl, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.7)",
          });
          return;
        }

        // far enough -> fling the card off, then recycle it to the back
        const flyX = this.x * 2.2;
        const flyY = this.y >= 0 ? this.y * 2.2 + 200 : this.y * 2.2 - 200;

        gsap.to(topEl, {
          x: flyX,
          y: flyY,
          rotation: this.x * 0.15,
          opacity: 0,
          duration: 0.45,
          ease: "power2.in",
          onComplete: () => {
            const backIndex = order.length - 1;
            const backProps = getDepthProps(backIndex, order.length);
            // teleport it (invisibly) to the back-of-stack pose before
            // the reorder makes it animate into its new resting spot
            gsap.set(topEl, { ...backProps, opacity: 0 });
            sendToBack(topId);
          },
        });
      },
    });

    draggableRef.current = instance;

    return () => {
      if (draggableRef.current) {
        draggableRef.current.kill();
        draggableRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-[420px] w-[300px] items-center justify-center select-none"
    >
      {order.map((id, index) => {
        const card = CARDS_DATA.find((c) => c.id === id);
        const isTop = index === 0;

        return (
          <div
            key={id}
            ref={setCardRef(id)}
            className={`group absolute inset-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-xl ${
              isTop ? "cursor-grab touch-none active:cursor-grabbing" : "pointer-events-none"
            }`}
          >
            {/* background image, grayscale/faded until hovered or on top */}
            <img
              src={card.image}
              alt={card.heading}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover grayscale opacity-60 transition-all duration-500 ease-out group-hover:grayscale-0 group-hover:opacity-100"
            />

            {/* readability gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* content */}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="text-lg font-semibold text-white">
                {card.heading}
              </h3>
              <p className="mt-1 text-sm text-white/70">{card.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardsStack;