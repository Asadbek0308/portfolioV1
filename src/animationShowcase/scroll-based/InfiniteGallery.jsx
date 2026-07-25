'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger plugin safely on client
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const DEFAULT_IMAGES = [
    {
        src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
        alt: 'Yosemite Valley Landscape',
    },
    {
        src: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80',
        alt: 'Dense Foggy Forest',
    },
    {
        src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
        alt: 'Foggy Mountain Range',
    },
    {
        src: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&q=80',
        alt: 'Canyon Stream',
    },
    {
        src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
        alt: 'Sunset Valley',
    },
    {
        src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
        alt: 'Lake Reflection',
    },
    {
        src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
        alt: 'Mountain Wilderness',
    },
    {
        src: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1200&q=80',
        alt: 'Autumn Trees',
    },
];

export default function InfiniteGallery({
    images = DEFAULT_IMAGES,
    speed = 1.0, // Overall speed multiplier
    visibleCount = 12,
    depthRange = 1000,
    pinDistance = 10000, // Distance in px to pin component during page scroll
    className = 'h-screen w-full',
}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const headingRef = useRef(null);
    const footerRef = useRef(null);

    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Animation and interaction state stored in refs for 60fps performance
    const stateRef = useRef({
        zOffset: 0,
        velocity: 0,
        isAutoPlay: true,
        lastInteraction: Date.now(),
        hoveredItem: null,
        mouseX: -9999,
        mouseY: -9999,
    });

    // Preload HTML Image elements
    const loadedImages = useMemo(() => {
        return images.map((img) => {
            const el = new Image();
            el.src = typeof img === 'string' ? img : img.src;
            return el;
        });
    }, [images]);

    // Generate 3D spatial positions for gallery items
    const items = useMemo(() => {
        const arr = [];
        const maxOffset = 350;

        for (let i = 0; i < visibleCount; i++) {
            const angle = (i * 2.618) % (Math.PI * 2);
            const radius = ((i % 4) + 1) * 0.25;

            arr.push({
                id: i,
                x: Math.sin(angle) * radius * maxOffset,
                y: Math.cos(angle) * radius * maxOffset * 0.7,
                baseZ: (depthRange / visibleCount) * i,
                imgIndex: i % images.length,
            });
        }
        return arr;
    }, [visibleCount, depthRange, images.length]);

    // GSAP ScrollTrigger Pinning & UI Entrance Setup
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Pin component during scroll and apply smooth normalized velocity
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top top',
                end: `+=${pinDistance}`,
                pin: true,
                pinSpacing: true,
                scrub: true,
                onUpdate: (self) => {
                    const scrollVel = self.getVelocity();

                    // Heavily scaled & hard-clamped scroll velocity (Max +/- 3.5 units per scroll update)
                    const clampedVelocity = Math.max(
                        -3.5,
                        Math.min(3.5, scrollVel * 0.0012 * speed)
                    );

                    stateRef.current.velocity += clampedVelocity;
                    stateRef.current.isAutoPlay = false;
                    stateRef.current.lastInteraction = Date.now();
                },
            });

            // Heading Fade-in Animation
            if (headingRef.current) {
                gsap.fromTo(
                    headingRef.current,
                    { opacity: 0, y: 20, scale: 0.98 },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        duration: 1,
                        ease: 'power3.out',
                    }
                );
            }

            // Footer Fade-in Animation
            if (footerRef.current) {
                gsap.fromTo(
                    footerRef.current,
                    { opacity: 0, y: 15 },
                    { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power2.out' }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, [pinDistance, speed]);

    // Main Canvas Render & Physics Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const handleResize = () => {
            if (containerRef.current && canvas) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        const render = () => {
            const state = stateRef.current;
            const now = Date.now();

            // Resume gentle auto-scroll after 3 seconds of user inactivity
            if (!state.isAutoPlay && now - state.lastInteraction > 3000) {
                state.isAutoPlay = true;
            }

            // Gentle auto-scroll push
            if (state.isAutoPlay) {
                state.velocity += 0.08 * speed;
            }

            // Hard clamp velocity ceiling so gallery never moves too fast
            state.velocity = Math.max(-6, Math.min(6, state.velocity));

            // Higher friction (0.86) to bring fast scrolling to a smooth, controlled stop
            state.velocity *= 0.86;
            state.zOffset += state.velocity;

            // Clear Canvas Frame
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const focalLength = 400;

            // Sort items by current depth for proper painter's algorithm Z-rendering
            const sortedItems = items
                .map((item) => {
                    let z = (item.baseZ + state.zOffset) % depthRange;
                    if (z < 0) z += depthRange;
                    return { ...item, currentZ: z };
                })
                .sort((a, b) => b.currentZ - a.currentZ);

            let currentHovered = null;

            sortedItems.forEach((item) => {
                const z = item.currentZ;
                const perspective = focalLength / (z + 100);
                const screenX = centerX + item.x * perspective;
                const screenY = centerY + item.y * perspective;

                const img = loadedImages[item.imgIndex];
                if (!img || !img.complete) return;

                const baseWidth = 240;
                const aspect = img.naturalWidth / img.naturalHeight || 1.33;
                const width = baseWidth * perspective;
                const height = (baseWidth / aspect) * perspective;

                const drawX = screenX - width / 2;
                const drawY = screenY - height / 2;

                // Depth Opacity & Fade logic
                const normalizedZ = z / depthRange;
                let opacity = 1;

                if (normalizedZ < 0.1) {
                    opacity = normalizedZ / 0.1;
                } else if (normalizedZ > 0.8) {
                    opacity = 1 - (normalizedZ - 0.8) / 0.2;
                }

                opacity = Math.max(0, Math.min(1, opacity));

                if (opacity <= 0.01) return;

                // Mouse Hover Hit Testing
                const mouseX = state.mouseX;
                const mouseY = state.mouseY;
                const isHovered =
                    mouseX >= drawX &&
                    mouseX <= drawX + width &&
                    mouseY >= drawY &&
                    mouseY <= drawY + height &&
                    opacity > 0.5;

                if (isHovered && (!currentHovered || item.currentZ < currentHovered.currentZ)) {
                    currentHovered = item.id;
                }

                ctx.save();
                ctx.globalAlpha = opacity;

                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 18 * perspective;
                ctx.shadowOffsetY = 8 * perspective;

                // Hover scale effect
                if (isHovered) {
                    const scale = 1.05;
                    ctx.translate(screenX, screenY);
                    ctx.scale(scale, scale);
                    ctx.translate(-screenX, -screenY);
                }

                // Render Image onto 2D Canvas Context
                ctx.drawImage(img, drawX, drawY, width, height);

                // Border outline
                ctx.strokeStyle = isHovered
                    ? 'rgba(255, 255, 255, 0.8)'
                    : 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = Math.max(1, 2 * perspective);
                ctx.strokeRect(drawX, drawY, width, height);

                ctx.restore();
            });

            state.hoveredItem = currentHovered;
            setHoveredIndex(currentHovered);

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [items, loadedImages, depthRange, speed]);

    // Normalized Wheel Handler (prevents fast trackpad wheel spikes)
    const handleWheel = useCallback(
        (e) => {
            const state = stateRef.current;

            // Normalize delta across input devices and clamp maximum single impulse
            const normalizedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 30);
            const impulse = (normalizedDelta / 30) * 0.8 * speed;

            state.velocity = Math.max(-5, Math.min(5, state.velocity + impulse));
            state.isAutoPlay = false;
            state.lastInteraction = Date.now();
        },
        [speed]
    );

    const handleMouseMove = useCallback((e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        stateRef.current.mouseX = e.clientX - rect.left;
        stateRef.current.mouseY = e.clientY - rect.top;
    }, []);

    const handleKeyDown = useCallback(
        (e) => {
            const state = stateRef.current;
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                state.velocity -= 1.5 * speed;
                state.isAutoPlay = false;
                state.lastInteraction = Date.now();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                state.velocity += 1.5 * speed;
                state.isAutoPlay = false;
                state.lastInteraction = Date.now();
            }
        },
        [speed]
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('wheel', handleWheel, { passive: true });
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleWheel, handleKeyDown]);

    return (
        <div
            ref={containerRef}
            className={`relative bg-black overflow-hidden select-none ${className}`}
            onMouseMove={handleMouseMove}
        >
            {/* 2D Canvas Viewport */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full block cursor-default"
            />
            {/* Component-Centered Typography Overlay */}
            <div
                ref={headingRef}
                className="absolute inset-0 pointer-events-none flex items-center justify-center text-center px-4 mix-blend-exclusion text-white z-10"
            >
                <h1 className="font-serif text-4xl sm:text-6xl md:text-8xl tracking-tight">
                    <span className="italic font-light">I create;</span> therefore I am
                </h1>
            </div>

            {/* Component-Centered Bottom Overlay */}
            <div
                ref={footerRef}
                className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center justify-center text-center font-mono uppercase text-[11px] tracking-widest text-white/80 space-y-2 pointer-events-none"
            >
                <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <svg
                        className="w-3.5 h-3.5 text-white/70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                    </svg>
                    <span>Scroll down to navigate gallery</span>
                </div>

                <div className="flex items-center space-x-1.5 text-white/50 text-[10px]">
                    <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                    </svg>
                    <span>Auto-play resumes after 3s of inactivity</span>
                </div>
            </div>
        </div>
    );
}