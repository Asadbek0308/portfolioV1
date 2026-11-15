// Single source of truth for the Work page.
// Every src/works/<slug>/index.js becomes a project at /work/<slug>.
// See src/works/README.md for the fields.

import { lazy } from 'react'

const modules = import.meta.glob('../works/*/index.js', { eager: true, import: 'default' })
// Optional per-project hover effect for the Work page card: src/works/<slug>/Hover.jsx
// It receives an `active` prop (true while the card is hovered or focused).
const hoverModules = import.meta.glob('../works/*/Hover.jsx')

export const WORKS = Object.entries(modules)
  .map(([path, data]) => {
    const slug = path.split('/').at(-2)
    const hoverLoader = hoverModules[`../works/${slug}/Hover.jsx`]
    return {
      slug,
      Hover: hoverLoader ? lazy(hoverLoader) : null,
      overview: [],
      features: [],
      engineering: [],
      stack: [],
      ...data,
      links: { live: '', repo: '', ...data.links },
    }
  })
  .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.title.localeCompare(b.title))

export const WORKS_BY_SLUG = Object.fromEntries(WORKS.map((w) => [w.slug, w]))
