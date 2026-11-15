// TEMPORARY — hover options shown as extra cards on the Work page so they can
// be compared side by side. Each card uses its project's real cover. Once one
// is chosen for a project:
//   1. move it to src/works/<project>/Hover.jsx (it already has the same contract),
//   2. remove that project's entries here (delete this file, and its import in
//      src/pages/Work.jsx, when the list is empty),
//   3. delete the unused files in src/works/<project>/hover-options/.
// `number` matches the lists of ideas suggested in the conversation.
import { lazy } from 'react'

export const HOVER_OPTIONS = [
  // Philosophify — current hover is the ASCII fire (src/works/philosophify/Hover.jsx)
  {
    slug: 'philosophify',
    number: 1,
    label: 'Neuron constellation',
    summary: 'Thinkers appear as glowing nodes joined by lines of influence; nodes near the cursor link to it.',
    Hover: lazy(() => import('../works/philosophify/hover-options/NeuronConstellation')),
  },
  {
    slug: 'philosophify',
    number: 2,
    label: 'Visor scan',
    summary: 'A red laser sweeps the card into a blueprint with HUD brackets, readouts and a cursor reticle.',
    Hover: lazy(() => import('../works/philosophify/hover-options/VisorScan')),
  },
  {
    slug: 'philosophify',
    number: 3,
    label: 'Chronos counter',
    summary: 'A year counter rolls from 600 BC to 2014 AD while milestones flash up along a sliding ruler.',
    Hover: lazy(() => import('../works/philosophify/hover-options/ChronosCounter')),
  },
  {
    slug: 'philosophify',
    number: 4,
    label: 'Typewriter quote',
    summary: 'A famous quotation types itself out in a classical serif, then its author and source appear.',
    Hover: lazy(() => import('../works/philosophify/hover-options/TypewriterQuote')),
  },

  // Chessio — current hover is the knight under the cursor (src/works/chessio/Hover.jsx)
  {
    slug: 'chessio',
    number: 3,
    label: 'Self-playing opening',
    summary: "A small board plays Scholar's Mate move by move, flashes CHECKMATE and tips the king over.",
    Hover: lazy(() => import('../works/chessio/hover-options/SelfPlayingOpening')),
  },
  {
    slug: 'chessio',
    number: 6,
    label: 'ASCII chess',
    summary: 'Chess symbols and moves like e4, O-O and Qxf7# drift up the card in amber monospace.',
    Hover: lazy(() => import('../works/chessio/hover-options/AsciiChess')),
  },
]
