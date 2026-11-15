// Shared handle to the single Lenis instance created in App.jsx, so other
// parts of the app (route changes, the full-screen menu) can control scrolling.
let instance = null;

export const setLenis = (lenis) => {
  instance = lenis;
};

export const getLenis = () => instance;
