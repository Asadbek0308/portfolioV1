import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { useTheme } from '../context/ThemeContext';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Link } from 'react-router-dom';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(CustomEase, MorphSVGPlugin);
    CustomEase.create('cinematic', 'M0,0 C0.1,0 0.05,1 1,1');
}

const MENU_ITEMS = [
    {
        text: 'home',
        imgUrl:
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
        link: '/',
    },
    {
        text: 'work',
        imgUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        link: 'work',
    },
    {
        text: 'animations',
        imgUrl:
            'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=400&q=80',
        link: 'animations',
    },
    {
        text: 'academics',
        imgUrl:
            'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=80',
        link: 'academics',
    },
];

const NUM_STRIPES = 4;
const ALL_DOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PLUS_DOTS = new Set([2, 4, 5, 6, 8]);
const CROSS_DOTS = new Set([1, 3, 5, 7, 9]);

/* ==========================================================================
   HOVER IMAGE LINK (Desktop Hover Image, Completely Hidden on Mobile)
   ========================================================================== */
function HoverImageLink({ text, imgUrl, link, onClick }) {
    const [isHovered, setIsHovered] = useState(false);
    const wrapRef = useRef(null);
    const imgRef = useRef(null);

    useEffect(() => {
        const wrapEl = wrapRef.current;
        const imgEl = imgRef.current;
        if (!wrapEl || !imgEl) return;

        // Animate hover expansion only on desktop devices
        if (window.innerWidth >= 768) {
            gsap.killTweensOf([wrapEl, imgEl]);

            if (isHovered) {
                gsap.to(wrapEl, {
                    width: '7.5rem',
                    opacity: 1,
                    marginRight: '1.25rem',
                    duration: 0.5,
                    ease: 'power3.out',
                });
                gsap.fromTo(imgEl, { scale: 1.2 }, { scale: 1, duration: 0.5, ease: 'power3.out' });
            } else {
                gsap.to(wrapEl, {
                    width: 0,
                    opacity: 0,
                    marginRight: 0,
                    duration: 0.4,
                    ease: 'power3.inOut',
                });
            }
        }
    }, [isHovered]);

    return (
        <Link
            to={link}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="inline-flex items-center select-none cursor-pointer focus:outline-none h-fit pointer-events-auto group"
        >
            {/* Image container: Completely removed on mobile using `hidden`, visible on desktop `md:block` */}
            <div
                ref={wrapRef}
                className="hidden md:block w-0 h-16 opacity-0 rounded-xl overflow-hidden shrink-0 pointer-events-none"
                style={{ willChange: 'width, opacity, margin' }}
            >
                <img
                    ref={imgRef}
                    src={imgUrl}
                    alt={text}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </div>

            <span className="text-4xl sm:text-5xl md:text-7xl lg:text-[7.5rem] leading-none font-black tracking-tighter uppercase text-base-content block align-bottom">
                {text}
            </span>
        </Link>
    );
}

/* ==========================================================================
   MENU GRID TRIGGER
   ========================================================================== */
function MenuGridButton({ isOpen, onToggle, sizeClass }) {
    const { theme } = useTheme();
    const [isGridHovered, setIsGridHovered] = useState(false);
    const containerRef = useRef(null);
    const waveTl = useRef(null);

    useEffect(() => {
        const dots = Array.from(containerRef.current?.querySelectorAll('.grid-dot') || []);
        if (!dots.length) return;

        const isDark = theme === 'dark';
        const active = isDark ? '#ffffff' : '#000000';
        const inactive = isDark ? '#374151' : '#d1d5db';

        waveTl.current?.kill();
        gsap.killTweensOf(dots);

        if (isOpen) {
            dots.forEach((dot) => {
                const num = parseInt(dot.dataset.index, 10);
                gsap.to(dot, {
                    backgroundColor: CROSS_DOTS.has(num) ? active : inactive,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });
            return;
        }

        if (isGridHovered) {
            const byIndex = (num) => dots.find((d) => parseInt(d.dataset.index, 10) === num);
            const d1 = byIndex(1);
            const d9 = byIndex(9);
            const diag24 = [byIndex(2), byIndex(4)];
            const diag357 = [byIndex(3), byIndex(5), byIndex(7)];
            const diag68 = [byIndex(6), byIndex(8)];
            const STEP = 0.06;

            const tl = gsap.timeline();
            tl.to(dots, { backgroundColor: inactive, duration: 0.15, ease: 'power1.out' })
                .to(d9, { backgroundColor: active, duration: STEP, ease: 'power1.inOut' })
                .to(diag68, { backgroundColor: active, duration: STEP, ease: 'power1.inOut', stagger: 0.04 })
                .to(diag357, { backgroundColor: active, duration: STEP, ease: 'power1.inOut', stagger: 0.04 })
                .to(diag24, { backgroundColor: active, duration: STEP, ease: 'power1.inOut', stagger: 0.04 })
                .to(d1, { backgroundColor: active, duration: STEP, ease: 'power1.inOut' })
                .to(dots, {
                    backgroundColor: (i, target) => (PLUS_DOTS.has(parseInt(target.dataset.index, 10)) ? active : inactive),
                    duration: 0.35,
                    ease: 'power2.out',
                });

            waveTl.current = tl;
        } else {
            gsap.to(dots, { backgroundColor: active, duration: 0.3, ease: 'power2.out' });
        }

        return () => waveTl.current?.kill();
    }, [isOpen, isGridHovered, theme]);

    return (
        <button
            ref={containerRef}
            onClick={onToggle}
            onMouseEnter={() => setIsGridHovered(true)}
            onMouseLeave={() => setIsGridHovered(false)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className={`grid grid-cols-3 gap-1 place-items-center rounded-xl transition-colors duration-300 active:scale-90 focus:outline-none border border-base-content/10 ${sizeClass} ${
                isOpen ? 'bg-base-200' : 'bg-base-100'
            }`}
        >
            {ALL_DOTS.map((num) => (
                <span key={num} data-index={num} className="grid-dot w-1.5 h-1.5 rounded-full block" />
            ))}
        </button>
    );
}

/* ==========================================================================
   THEME TOGGLE
   ========================================================================== */
function ThemeToggle({ sizeClass }) {
    const { theme, setTheme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const pathRef = useRef(null);

    const moonPath =
        'M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401';
    const circlePath = 'M 12,3 A 9,9 0 1,1 11.9,3 Z';

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const target =
            theme === 'light'
                ? { path: isHovered ? moonPath : circlePath, color: '#000000' }
                : { path: isHovered ? circlePath : moonPath, color: '#ffffff' };

        gsap.to(pathRef.current, {
            morphSVG: { shape: target.path },
            fill: target.color,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: 'auto',
        });
    }, [theme, isHovered]);

    return (
        <button
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Toggle theme"
            className={`flex items-center justify-center rounded-xl transition-all duration-200 active:scale-90 focus:outline-none border border-base-content/10 bg-base-100 text-base-content ${sizeClass}`}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path ref={pathRef} d={circlePath} fill={theme === 'light' ? '#000000' : '#ffffff'} />
            </svg>
        </button>
    );
}

/* ==========================================================================
   HEADER COMPONENT
   ========================================================================== */
export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    const menuRef = useRef(null);
    const stripsRef = useRef([]);
    const linksContainerRef = useRef(null);
    const tl = useRef(null);
    const isAnimating = useRef(false);

    useEffect(() => {
        return () => {
            tl.current?.kill();
            gsap.killTweensOf(stripsRef.current);
        };
    }, []);

    const playCloseTransition = useCallback(() => {
        if (isAnimating.current) return;
        isAnimating.current = true;

        const strips = stripsRef.current;
        const linkItems = linksContainerRef.current?.querySelectorAll('.animate-link');

        tl.current?.kill();
        gsap.killTweensOf(strips);
        if (linkItems) gsap.killTweensOf(linkItems);

        tl.current = gsap.timeline({
            onComplete: () => {
                gsap.set(menuRef.current, { display: 'none', pointerEvents: 'none' });
                setIsOpen(false);
                isAnimating.current = false;
            },
        });

        tl.current
            .set(strips, { transformOrigin: 'right center' }, 0)
            .to(linkItems, { y: -30, opacity: 0, duration: 0.25, ease: 'power2.out', stagger: 0.02 }, 0)
            .to(
                strips,
                {
                    scaleX: 0,
                    duration: 0.7,
                    ease: 'cinematic',
                    stagger: { amount: 0.15, from: 'end' },
                },
                0.1
            );
    }, []);

    const playOpenTransition = useCallback(() => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        setIsOpen(true);

        const strips = stripsRef.current;
        const linkItems = linksContainerRef.current?.querySelectorAll('.animate-link');

        tl.current?.kill();
        gsap.killTweensOf(strips);
        if (linkItems) gsap.killTweensOf(linkItems);

        tl.current = gsap.timeline({
            onComplete: () => {
                isAnimating.current = false;
            },
        });

        tl.current
            .set(menuRef.current, { display: 'flex', pointerEvents: 'auto' })
            .set(strips, { transformOrigin: 'left center', scaleX: 0 })
            .to(strips, {
                scaleX: 1,
                duration: 0.7,
                ease: 'cinematic',
                stagger: { amount: 0.18, from: 'start' },
            })
            .fromTo(
                linkItems,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out', stagger: 0.06 },
                '-=0.3'
            );
    }, []);

    const handleToggle = useCallback(() => {
        if (isAnimating.current) return;
        if (!isOpen) {
            playOpenTransition();
        } else {
            playCloseTransition();
        }
    }, [isOpen, playOpenTransition, playCloseTransition]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') handleToggle();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, handleToggle]);

    return (
        <div>
            <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 flex justify-between items-center gap-3 p-3 rounded-2xl bg-base-content/20 backdrop-blur-xs">
                <Link to="/" className="font-semibold text-lg tracking-wide select-none text-base-100">
                    Asadbek
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggle sizeClass="w-11 h-11 p-2" />
                    <MenuGridButton isOpen={isOpen} onToggle={handleToggle} sizeClass="w-11 h-11 p-2" />
                </div>
            </header>

            <div
                ref={menuRef}
                style={{ display: 'none' }}
                aria-hidden={!isOpen}
                className="fixed inset-0 z-40 flex-col justify-center items-start px-6 md:px-24 overflow-hidden w-full h-full"
            >
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col w-full h-full">
                    {[...Array(NUM_STRIPES)].map((_, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                stripsRef.current[i] = el;
                            }}
                            className="flex-1 w-full bg-base-200 scale-x-0"
                            style={{ willChange: 'transform' }}
                        />
                    ))}
                </div>

                <nav
                    ref={linksContainerRef}
                    className="relative z-20 flex flex-col justify-center items-start gap-5 md:gap-8 w-full max-w-6xl pointer-events-none"
                >
                    {MENU_ITEMS.map((item) => (
                        <div key={item.text} className="animate-link opacity-0 pointer-events-none">
                            <HoverImageLink
                                text={item.text}
                                imgUrl={item.imgUrl}
                                link={item.link}
                                onClick={playCloseTransition}
                            />
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
}