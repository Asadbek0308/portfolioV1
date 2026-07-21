import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
// Import your custom useTheme hook
import { useTheme } from '../context/ThemeContext'; // Update this path to match your file structure

// NOTE: MorphSVGPlugin is a paid Club GreenSock / GSAP Business plugin.
// It will not resolve from the free public "gsap" package — you need it
// installed from your licensed GSAP registry for the ThemeToggle below to work.
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
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=90',
        link: '/',
    },
    {
        text: 'work',
        imgUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=90',
        link: 'work',
    },
    {
        text: 'animations',
        imgUrl:
            'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=90',
        link: 'animations',
    },
    {
        text: 'academics',
        imgUrl:
            'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=90',
        link: 'academics',
    },
];

const NUM_STRIPES = 4;
const ALL_DOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PLUS_DOTS = new Set([2, 4, 5, 6, 8]);
const CROSS_DOTS = new Set([1, 3, 5, 7, 9]);

/* ==========================================================================
   HOVER IMAGE LINK (Fixed Trigger Area & Height Matching)
   ========================================================================== */
function HoverImageLink({ text, imgUrl, link }) {
    const [isHovered, setIsHovered] = useState(false);
    const imageWrapRef = useRef(null);
    const imageRef = useRef(null);
    const textRef = useRef(null);
    const revealSizeRef = useRef({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const textEl = textRef.current;
        const wrapEl = imageWrapRef.current;
        const imgEl = imageRef.current;
        if (!textEl || !wrapEl || !imgEl) return;

        const syncSize = () => {
            const h = textEl.offsetHeight * 0.85;
            const w = h * 1.5;
            revealSizeRef.current = { width: w, height: h };
            wrapEl.style.height = `${h}px`;

            imgEl.style.width = `${w}px`;
            imgEl.style.height = `${h}px`;
        };

        syncSize();
        const ro = new ResizeObserver(syncSize);
        ro.observe(textEl);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const wrapEl = imageWrapRef.current;
        const imgEl = imageRef.current;
        if (!wrapEl || !imgEl) return;

        gsap.killTweensOf([wrapEl, imgEl]);

        if (isHovered) {
            const targetWidth = revealSizeRef.current.width;
            gsap.fromTo(
                wrapEl,
                { width: 0, opacity: 0, marginRight: 0 },
                {
                    width: targetWidth,
                    opacity: 1,
                    marginRight: 24,
                    duration: 0.75,
                    ease: 'power3.out',
                }
            );
            gsap.fromTo(imgEl, { scale: 1.15 }, { scale: 1, duration: 0.75, ease: 'power3.out' });
        } else {
            gsap.to(wrapEl, {
                width: 0,
                opacity: 0,
                marginRight: 0,
                duration: 0.6,
                ease: 'power3.inOut',
            });
            gsap.to(imgEl, { scale: 1.15, duration: 0.6, ease: 'power3.inOut' });
        }

        return () => gsap.killTweensOf([wrapEl, imgEl]);
    }, [isHovered]);

    return (
        <Link
            to={`${link}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="inline-flex items-end select-none cursor-pointer focus:outline-none h-fit pointer-events-auto"
        >
            <div
                ref={imageWrapRef}
                className="w-0 rounded-2xl overflow-hidden shrink-0 opacity-0 pointer-events-none"
            >
                <img
                    ref={imageRef}
                    src={imgUrl}
                    alt={text}
                    className="object-cover max-w-none"
                    loading="lazy"
                />
            </div>

            <span
                ref={textRef}
                className="text-5xl md:text-7xl lg:text-[8rem] leading-[0.8] font-black tracking-tighter uppercase text-base-content block align-bottom"
            >
                {text}
            </span>
        </Link>
    );
}

/* ==========================================================================
   MENU GRID TRIGGER — Uses useTheme() to switch dot colors instantly
   ========================================================================== */
function MenuGridButton({ isOpen, onToggle, sizeClass }) {
    const { theme } = useTheme(); // Consuming your custom hook
    const [isGridHovered, setIsGridHovered] = useState(false);
    const containerRef = useRef(null);
    const waveTl = useRef(null);

    const getThemeColors = () => {
        const isDark = theme === 'dark';
        return {
            active: isDark ? '#ffffff' : '#000000',
            inactive: isDark ? '#374151' : '#d1d5db',
        };
    };

    useEffect(() => {
        const dots = Array.from(containerRef.current?.querySelectorAll('.grid-dot') || []);
        if (!dots.length) return;
        const byIndex = (num) => dots.find((d) => parseInt(d.dataset.index, 10) === num);

        const { active, inactive } = getThemeColors();

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
                .to(d9, { backgroundColor: inactive, duration: STEP, ease: 'power1.inOut' })
                .to(diag68, { backgroundColor: inactive, duration: STEP, ease: 'power1.inOut', stagger: 0.04 })
                .to(diag357, { backgroundColor: inactive, duration: STEP, ease: 'power1.inOut', stagger: 0.04 })
                .to(diag24, { backgroundColor: inactive, duration: STEP, ease: 'power1.inOut', stagger: 0.04 })
                .to(d1, { backgroundColor: inactive, duration: STEP, ease: 'power1.inOut' })
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
    }, [isOpen, isGridHovered, theme]); // Listens to theme updates instantly

    return (
        <button
            ref={containerRef}
            onClick={onToggle}
            onMouseEnter={() => setIsGridHovered(true)}
            onMouseLeave={() => setIsGridHovered(false)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className={`grid grid-cols-3 gap-1 place-items-center rounded-xl transition-colors duration-300 active:scale-90 focus:outline-none border border-base-content/10 ${sizeClass} ${isOpen ? 'bg-base-200' : 'bg-base-100'
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
    const { theme, setTheme } = useTheme(); // Consuming your custom hook
    const [isHovered, setIsHovered] = useState(false);
    const pathRef = useRef(null);

    const moonPath =
        'M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401';
    const circlePath = 'M 12,3 A 9,9 0 1,1 11.9,3 Z';

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
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
            duration: 0.4,
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path ref={pathRef} d={circlePath} fill={theme === 'light' ? '#000000' : '#ffffff'} />
            </svg>
        </button>
    );
}

/* ==========================================================================
   INTEGRATED FULLSCREEN MENU (Header Component)
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

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') handleToggle();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    const handleToggle = useCallback(() => {
        if (isAnimating.current) return;
        if (!isOpen) {
            playOpenTransition();
        } else {
            playCloseTransition();
        }
    }, [isOpen]);

    const playOpenTransition = () => {
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
                duration: 0.85,
                ease: 'cinematic',
                stagger: { amount: 0.22, from: 'start' },
            })
            .fromTo(
                linkItems,
                { y: 80, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.75, ease: 'power4.out', stagger: 0.08 },
                '-=0.35'
            );
    };

    const playCloseTransition = () => {
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
            .to(linkItems, { y: -40, opacity: 0, duration: 0.3, ease: 'power2.out', stagger: 0.03 }, 0)
            .to(
                strips,
                {
                    scaleX: 0,
                    duration: 0.85,
                    ease: 'cinematic',
                    stagger: { amount: 0.2, from: 'end' },
                },
                0.15
            );
    };

    const gridButtonSize = 'w-11 h-11 p-2';
    const themeButtonSize = 'w-11 h-11 p-2';

    return (
        <div className="">
            <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 flex justify-between items-center gap-3 px-2 md:px-5 text-base-content">
                <Link to={"/"} className="font-semibold text-lg tracking-wide select-none">
                    Asadbek
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggle sizeClass={themeButtonSize} />
                    <MenuGridButton isOpen={isOpen} onToggle={handleToggle} sizeClass={gridButtonSize} />
                </div>
            </header>

            <div
                ref={menuRef}
                style={{ display: 'none' }}
                aria-hidden={!isOpen}
                className="fixed inset-0 z-40 flex-col justify-center items-start px-12 md:px-24 overflow-hidden w-full h-full"
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
                    className="relative z-20 flex flex-col justify-center items-start gap-8 w-full max-w-6xl pointer-events-none"
                >
                    {MENU_ITEMS.map((item) => (
                        <div key={item.text} className="animate-link opacity-0 pointer-events-none">
                            <HoverImageLink text={item.text} imgUrl={item.imgUrl} link={item.link} />
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
}