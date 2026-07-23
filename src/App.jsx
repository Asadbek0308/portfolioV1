import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ThemeProvider from './context/ThemeContext';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';

// 1. Import Lenis and GSAP
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from './components/Footer';
import Animations from './pages/Animations';
import Academics from './pages/Academics';
import Work from './pages/Work';
import ScrollToTop from './components/ScrollToTop';

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const App = () => {
  useEffect(() => {
    // 2. Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2, // Scroll speed/duration (higher = smoother & slower)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth momentum curve
      smoothWheel: true,
      wheelMultiplier: 0.8, // Reduces aggressive trackpad/wheel flicks
    });

    // 3. Sync Lenis scroll position with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // 4. Drive Lenis via GSAP's RAF loop for 60fps+ sync
    const update = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);

    // Disable lag smoothing to prevent visual stuttering during heavy animations
    gsap.ticker.lagSmoothing(0);

    // Cleanup on unmount
    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return (
    <div>
      <ThemeProvider>
        <Header />
        <ErrorBoundary>
          <ScrollToTop/>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/animations' element={<Animations />} />

            <Route path='/academics' element={<Academics />} />
            <Route path='/work' element={<Work />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
        <Footer/>
      </ThemeProvider>
    </div>
  );
};

export default App;