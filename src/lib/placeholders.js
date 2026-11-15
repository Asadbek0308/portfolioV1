// Placeholder entries that fill the Home and Work project lists until real
// projects take their place. Each real project in src/works replaces one
// placeholder, from the top, so the lists always show SLOTS items.
// When there are SLOTS or more real projects, no placeholders are shown.

export const SLOTS = 4

// Home page "Recent Projects" rows (hover preview uses `src` + `color`)
const HOME = [
  {
    title: 'C2 Montreal',
    src: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop',
    color: '#000000',
    tags: ['Brand', 'Web Design', 'Motion'],
  },
  {
    title: 'Office Spaces',
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop',
    color: '#8C8C8C',
    tags: ['UI Dev', 'Interior', 'Framer'],
  },
  {
    title: 'Locomotive',
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop',
    color: '#EFEFEF',
    tags: ['Frontend', 'Scroll FX', 'Case Study'],
  },
  {
    title: 'Silencio',
    src: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop',
    color: '#706D57',
    tags: ['Product', 'Web App', 'Branding'],
  },
]

// Work page cards
const WORK = [
  {
    id: 'proj-1',
    title: '[Project Name]',
    type: 'Web App',
    stack: ['React', 'Tailwind', 'GSAP'],
    summary: 'A line or two on the problem this solved and what you owned.',
    cover: 'https://picsum.photos/seed/w1/700/500',
  },
  {
    id: 'proj-2',
    title: '[Project Name]',
    type: 'Landing Page',
    stack: ['React', 'GSAP', 'ScrollTrigger'],
    summary: 'A line or two on the problem this solved and what you owned.',
    cover: 'https://picsum.photos/seed/w2/700/500',
  },
  {
    id: 'proj-3',
    title: '[Project Name]',
    type: 'Dashboard',
    stack: ['React', 'Tailwind', 'Vite'],
    summary: 'A line or two on the problem this solved and what you owned.',
    cover: 'https://picsum.photos/seed/w3/700/500',
  },
  {
    id: 'proj-4',
    title: '[Project Name]',
    type: 'E-commerce',
    stack: ['React', 'Tailwind'],
    summary: 'A line or two on the problem this solved and what you owned.',
    cover: 'https://picsum.photos/seed/w4/700/500',
  },
]

// realCount real projects already take the first slots
const remaining = (list, realCount) => list.slice(Math.min(realCount, list.length), SLOTS)

export const homePlaceholders = (realCount) => remaining(HOME, realCount)
export const workPlaceholders = (realCount) => remaining(WORK, realCount)
