// Single source of truth for the animation showcase.
// Every .jsx file under src/animationShowcase/<category>/ becomes an entry,
// with a slug made from its file name (e.g. ImageTrail.jsx -> image-trail).

const componentModules = import.meta.glob('../animationShowcase/**/*.jsx')
const rawSourceModules = import.meta.glob('../animationShowcase/**/*.jsx', {
  query: '?raw',
  import: 'default',
})
const screenshotModules = import.meta.glob(
  '../assets/screenshots/*.{png,jpg,jpeg,webp,avif}',
  { eager: true, import: 'default' }
)

// ImageTrail -> image-trail (kept identical to the old rule so existing URLs keep working)
export const toSlug = (str) =>
  str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

// image-trail -> Image Trail
export const slugToTitle = (slug) =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const createPlaceholder = (title) => {
  const safe = title.replace(/[<>&"']/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#18181b"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#71717a" font-family="monospace" font-size="16">${safe}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const SCREENSHOTS = {}
for (const path of Object.keys(screenshotModules)) {
  const fileName = path.split('/').pop().replace(/\.[^.]+$/, '')
  SCREENSHOTS[toSlug(fileName)] = screenshotModules[path]
}

export const ANIMATIONS = []
export const ANIMATIONS_BY_SLUG = {}

for (const path of Object.keys(componentModules)) {
  // '../animationShowcase/hover-interactions/ImageTrail.jsx'
  const segments = path.split('/')
  const fileName = segments.pop().replace(/\.jsx$/, '')
  const folder = segments.length > 2 ? segments.pop() : 'general'
  const slug = toSlug(fileName)

  if (ANIMATIONS_BY_SLUG[slug]) {
    console.warn(`[showcase] Duplicate slug "${slug}" from ${path}; it is ignored.`)
    continue
  }

  // 'ImageTrail' -> 'Image Trail', keeps acronyms like 'CSSBox' readable
  const title = fileName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ')
  const item = {
    id: String(ANIMATIONS.length + 1).padStart(2, '0'),
    slug,
    fileName,
    title,
    category: slugToTitle(folder),
    image: SCREENSHOTS[slug] || createPlaceholder(title),
    load: componentModules[path],
    loadSource: rawSourceModules[path],
  }
  ANIMATIONS.push(item)
  ANIMATIONS_BY_SLUG[slug] = item
}

export const CATEGORIES = [...new Set(ANIMATIONS.map((a) => a.category))]
