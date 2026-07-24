import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

const IMAGE_URLS = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1778546979309-d1b70b0d25c2?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80",
];

export default function ImageTrail() {
    const containerRef = useRef(null);
    const lastPos = useRef({ x: 0, y: 0 });
    // Target position to move toward (throttled by the ticker)
    const targetPos = useRef({ x: 0, y: 0 });
    const imageIndex = useRef(0);

    const idleTimer = useRef(null);
    const isAutoMoving = useRef(false);
    const virtualCursor = useRef({ x: 0, y: 0 });
    const autoTween = useRef(null);

    const POOL_SIZE = 25;
    const THRESHOLD = 90;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const imageElements = container.querySelectorAll(".trail-image");

        // OPTIMIZATION 1: Force immediate GPU image decoding on mount
        imageElements.forEach((el) => {
            const img = el.querySelector("img");
            if (img && img.decode) {
                img.decode().catch((err) => console.log("Image pre-decode skipped", err));
            }
        });

        const spawnImage = (x, y) => {
            const distance = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);

            if (distance > THRESHOLD) {
                lastPos.current = { x, y };

                // Get the explicit pool wrapper index (0 to 24)
                const poolIndex = imageIndex.current % POOL_SIZE;
                const targetImg = imageElements[poolIndex];
                imageIndex.current++;

                const randomRotation = Math.random() * 24 - 12;
                const randomScale = 0.85 + Math.random() * 0.25;

                gsap.killTweensOf(targetImg);

                gsap.set(targetImg, {
                    x,
                    y,
                    xPercent: -50,
                    yPercent: -50,
                    scale: 0,
                    rotation: randomRotation,
                    opacity: 1,
                    force3D: true,
                    // FIX: Cap the zIndex so it never exceeds 1000, while maintaining relative order
                    zIndex: (imageIndex.current % 100) + 1,
                });

                // To prevent stacking collisions when elements wrap around, 
                // explicitly force an immediate zIndex reset when the animation timeline finishes.
                const tl = gsap.timeline();
                tl.to(targetImg, {
                    scale: randomScale,
                    duration: 0.35,
                    ease: "back.out(1.4)",
                })
                    .to(targetImg, {
                        opacity: 0,
                        scale: randomScale * 0.75,
                        duration: 0.7,
                        ease: "power2.inOut",
                        delay: 0.1,
                        onComplete: () => {
                            // Drop the zIndex back to 0 so it doesn't mask newly incoming items
                            gsap.set(targetImg, { zIndex: 0 });
                        }
                    });
            }
        };

        // OPTIMIZATION 3: Process layout calculations inside GSAP Ticker loop (rAF)
        const tickHandler = () => {
            if (!isAutoMoving.current) {
                spawnImage(targetPos.current.x, targetPos.current.y);
            }
        };
        gsap.ticker.add(tickHandler);

        // Phantom Logic
        const startPhantomMovement = () => {
            if (!container) return;
            isAutoMoving.current = true;

            const rect = container.getBoundingClientRect();
            virtualCursor.current = { ...lastPos.current };

            const getNextPoint = () => ({
                x: Math.random() * (rect.width - 200) + 100,
                y: Math.random() * (rect.height - 200) + 100
            });

            let steps = 0;
            const runStep = () => {
                if (!isAutoMoving.current || steps >= 3) {
                    isAutoMoving.current = false;
                    resetIdleTimer();
                    return;
                }
                steps++;

                const nextPoint = getNextPoint();

                autoTween.current = gsap.to(virtualCursor.current, {
                    x: nextPoint.x,
                    y: nextPoint.y,
                    duration: 0.9,
                    ease: "power1.inOut",
                    onUpdate: () => {
                        spawnImage(virtualCursor.current.x, virtualCursor.current.y);
                    },
                    onComplete: runStep
                });
            };

            runStep();
        };

        const resetIdleTimer = () => {
            if (idleTimer.current) clearTimeout(idleTimer.current);
            if (autoTween.current) autoTween.current.kill();
            isAutoMoving.current = false;

            idleTimer.current = setTimeout(() => {
                startPhantomMovement();
            }, 2000);
        };

        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            // Simply cache the updates asynchronously instead of executing logic
            targetPos.current.x = e.clientX - rect.left;
            targetPos.current.y = e.clientY - rect.top;

            resetIdleTimer();
        };

        resetIdleTimer();
        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            gsap.ticker.remove(tickHandler);
            if (idleTimer.current) clearTimeout(idleTimer.current);
            if (autoTween.current) autoTween.current.kill();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-screen bg-[#F9F9F9] overflow-hidden select-none flex items-center p-16"
        >
            <h1 className="text-[7vw] font-medium tracking-tight text-[#1A1A1A] leading-none max-w-md pointer-events-none z-50">
                See for <br /> yourself
            </h1>

            {Array.from({ length: POOL_SIZE }).map((_, index) => {
                const imageUrl = IMAGE_URLS[index % IMAGE_URLS.length];
                return (
                    <div
                        key={index}
                        className="trail-image absolute top-0 left-0 w-44 h-44 rounded-xl overflow-hidden shadow-2xl bg-gray-200 border-4 border-white will-change-transform opacity-0 pointer-events-none"
                        style={{ transformOrigin: "center center" }}
                    >
                        <img
                            src={imageUrl}
                            alt={`Trail asset ${index}`}
                            className="w-full h-full object-cover pointer-events-none"
                            loading="eager"
                        />
                    </div>
                );
            })}
        </div>
    );
}