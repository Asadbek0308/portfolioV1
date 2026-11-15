import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import ThemeProvider from './context/ThemeContext';
import GreetingText from './animations/GreetingText';
import { setLenis } from './lib/lenis';

// Route-level code splitting: each page only downloads when it is visited
const Home = lazy(() => import('./pages/Home'));
const Work = lazy(() => import('./pages/Work'));
const WorkDetail = lazy(() => import('./pages/WorkDetail'));
const Animations = lazy(() => import('./pages/Animations'));
const AnimationDetail = lazy(() => import('./pages/AnimationDetail'));
const Academics = lazy(() => import('./pages/Academics'));
const NotFound = lazy(() => import('./pages/NotFound'));

gsap.registerPlugin(ScrollTrigger);

const PageFallback = () => <div className="min-h-screen" aria-hidden="true" />;

const App = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Respect users who asked the OS for less motion: keep native scrolling
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
    });
    setLenis(lenis);

    lenis.on('scroll', ScrollTrigger.update);

    const update = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <ThemeProvider>
      <GreetingText />

      <Header />
      <ScrollToTop />
      {/* key={pathname}: a crash on one page is cleared when the user navigates away */}
      <ErrorBoundary key={pathname}>
        <main id="main-content">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/animations" element={<Animations />} />
              <Route path="/animations/:animationName" element={<AnimationDetail />} />
              <Route path="/academics" element={<Academics />} />
              <Route path="/work" element={<Work />} />
              <Route path="/work/:slug" element={<WorkDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </ErrorBoundary>
      <Footer />
    </ThemeProvider>
  );
};

export default App;
