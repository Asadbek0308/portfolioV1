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
import AnimationDetail from './pages/AnimationDetail';
import Academics from './pages/Academics';
import Work from './pages/Work';
import ScrollToTop from './components/ScrollToTop';
import CursorGrid from './animations/CursorGrid';

// 2. Import your GreetingText preloader component
import GreetingText from './animations/GreetingText';

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const App = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const update = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return (
    <div>
      <ThemeProvider>
        {/* Render the preloader overlay here */}
        <GreetingText />

        <Header />
        <ErrorBoundary>
          <ScrollToTop />
          {/* <CursorGrid/> */}
          
          {/* FIXED: Wrapped main content in <main> landmark tag */}
          <main id="main-content">
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/animations' element={<Animations />} />
              <Route path='/animations/:animationName' element={<AnimationDetail />} />
              <Route path='/academics' element={<Academics />} />
              <Route path='/work' element={<Work />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </main>
          
        </ErrorBoundary>
        <Footer />
      </ThemeProvider>
    </div>
  );
};

export default App;