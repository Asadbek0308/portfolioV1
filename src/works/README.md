# Works

Every folder in here is one project on the **Work** page. The site finds them
automatically (same idea as `src/animationShowcase`), so adding a project never
means touching page code.

## Add a project

1. Create a folder named after the project's URL slug, e.g. `src/works/my-app/`.
   The page will live at `/work/my-app`.
2. Put the cover image in it (e.g. `cover.jpg` or `cover.webp`). Keep it under ~300 KB.
3. Add an `index.js` that default-exports the project data. Copy
   `philosophify/index.js` as a starting point.

## Fields

| Field | Required | What it is |
|---|---|---|
| `title` | yes | Project name |
| `tagline` | yes | One line under the title |
| `type` | yes | e.g. `Web App`, `Landing Page` |
| `year` | yes | e.g. `'2026'` |
| `role` | no | What you did |
| `order` | no | Sort order on the Work page, lower first (default: by title) |
| `cover` / `coverAlt` | yes | Imported image + description of it |
| `accent` | no | Hex colour behind the cover in the Home page hover preview |
| `tags` | no | 2–3 short labels for the Home page list (default: type + first two of `stack`) |
| `featured` | no | Set to `false` to hide it from Home's "Recent Projects" (it stays on the Work page) |
| `summary` | yes | 1–2 sentences, shown on the card and at the top of the page |
| `overview` | no | Array of paragraphs |
| `stack` | yes | Array of technologies |
| `features` | no | Array of `{ title, description }` |
| `engineering` | no | Array of short technical highlights |
| `links.live` / `links.repo` | no | Empty strings are hidden |
