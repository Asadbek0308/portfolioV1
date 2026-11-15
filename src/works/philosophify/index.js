// Philosophify — case study data for /work/philosophify
// Source project: github.com/Asadbek0308/Philosophify
import cover from './cover.jpg'

export default {
  title: 'Philosophify',
  tagline: 'An interactive universe of philosophical thought',
  type: 'Web App',
  year: '2026',
  role: 'Design & development',
  order: 1, // lower comes first on the Work page

  cover,
  coverAlt: 'Engraving of a classical philosopher wearing a red VR visor over a blueprint grid',
  accent: '#E8DFD0', // background behind the cover in the Home page hover preview (matches the paper tone)
  tags: ['Web App', 'Data Visualisation', 'GSAP'], // short labels for the Home page list

  summary:
    'A single-page app that turns 2,600 years of philosophy into places you can explore: a scrolling reel through history, a living graph of who influenced whom, an endless gallery of art, and a reading library — all in a classical-meets-cyber visual style.',

  overview: [
    'Philosophify started from a simple question: what if a history of ideas felt less like a textbook and more like an instrument you could play with? Every page is a different way of moving through the same subject — by time, by connection, by image, by reading.',
    'The content is curated and checked rather than generated: timeline dates follow the Stanford Encyclopedia of Philosophy and Routledge, and quotations are only included when they are reliably attested. Counts shown in the interface are computed from the data, never hard-coded.',
  ],

  stack: ['React 19', 'Vite', 'React Router', 'GSAP', 'ScrollTrigger', 'Tailwind CSS', 'DaisyUI', 'canvas-confetti'],

  features: [
    {
      title: 'Chronos Timeline',
      description:
        '197 verified milestones from 600 BC to 2014, across Greek, Indian, Chinese, Islamic, Jewish, Japanese, African-American and Western traditions. A physics-driven reel with a rolling year counter, era mini-map, pin-and-compare, keyboard navigation, deep links and a quiz mode where you guess the year.',
    },
    {
      title: 'Neuron Map',
      description:
        'A "second brain" knowledge graph of about 280 thinkers, ideas and places, laid out by a custom force simulation with a fixed timestep. Pan, zoom, pinch on mobile, filter by tag and share a link straight to any node.',
    },
    {
      title: 'Infinite Gallery',
      description:
        'Forty artworks on an endless canvas that drifts away from the cursor. Only the visible tiles are mounted, and opening one zooms the lightbox out of the card it came from (FLIP).',
    },
    {
      title: 'Cinematic Home',
      description:
        'A GSAP ScrollTrigger hero built around the "neural visor" image, a School of Athens panorama with hotspots that introduce each thinker, and an axiom of the day drawn from real quotations.',
    },
    {
      title: 'Resource Library',
      description:
        'Searchable reading guides filtered by format and category, with a table-of-contents preview and a small confetti celebration on download.',
    },
    {
      title: 'Eight Themes & a 404 to Remember',
      description:
        'Noir, White/Black, Deep Slate, Papyrus Codex, Cybernetic Logos, Cyberpunk, Aqua and Retro themes across every page — plus a 404 with 3D shattered glass and an ASCII Greek temple on fire.',
    },
  ],

  engineering: [
    'Route-level code splitting, so the large timeline, graph and gallery data only downloads when its page is opened.',
    'Animation loops write straight to the DOM instead of going through React state, keeping the timeline reel, graph and gallery smooth at 60fps.',
    'Virtualised rendering in the gallery and timeline: rows and tiles mount only when they are near the viewport.',
    'Compact data formats for the timeline and graph, expanded at load time, which keep thousands of lines of content easy to edit and review.',
  ],

  links: {
    live: 'https://philosophify.vercel.app/',
    repo: 'https://github.com/Asadbek0308/Philosophify',
  },
}
