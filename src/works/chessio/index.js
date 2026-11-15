// Chessio — case study data for /work/chessio
// Source project: github.com/Asadbek0308/chessioNew
import cover from './cover.png'

export default {
  title: 'Chessio',
  tagline: 'Chess with a friend — on one screen, or peer-to-peer online',
  type: 'Web App',
  year: '2026',
  role: 'Design & development',
  order: 2, // lower comes first on the Work page

  cover,
  coverAlt: 'Chessio game screen: a wooden chessboard mid-game with White in check, the knight’s blocking move marked, on a dark background',
  accent: '#b58863', // background behind the cover in the Home page hover preview (the board's dark square)
  tags: ['Multiplayer', 'WebRTC', 'Chess'],

  summary:
    'A minimal two-player chess app: pass one device back and forth, or create a room and play a friend online over a direct peer-to-peer connection — no accounts, no game server.',

  overview: [
    'Chessio is about getting two people into a game as fast as possible. One tap starts a local game; another creates an online room with a six-character code and an invite link to send to a friend.',
    'Online games run browser-to-browser over WebRTC. The players’ browsers talk to each other directly, and only use a public relay when a network blocks direct connections — so there is no backend to host and nothing to sign up for. Every move is still checked by a full chess rules engine on both sides.',
  ],

  stack: ['React 19', 'Vite', 'React Router', 'chess.js', 'react-chessboard', 'PeerJS / WebRTC', 'Tailwind CSS', 'Web Audio API'],

  features: [
    {
      title: 'Pass & Play',
      description:
        'A local game for two people on one device, with an optional auto-flip that turns the board to whoever is to move, plus a manual flip.',
    },
    {
      title: 'Online Rooms',
      description:
        'Create a room to get a six-character code and a copyable invite link; the host plays white. A friend joins from the room hub by typing the code, and the game connects directly over WebRTC.',
    },
    {
      title: 'Connections That Survive',
      description:
        'Several STUN servers plus a TURN relay for strict networks, a keep-alive ping, a full board sync whenever players connect, and automatic retries while a guest waits for the host — with a live connection status in the header.',
    },
    {
      title: 'Full Chess Rules',
      description:
        'chess.js validates every move. Legal-move dots and capture rings, last-move highlight, a promotion picker for queen, rook, bishop or knight, and detection of check, checkmate, stalemate and draws.',
    },
    {
      title: 'The Whole Game Flow',
      description:
        'Draw offers, resignation with confirmation and rematch requests that work across the connection, a move history in paired algebraic notation, and captured pieces with the material balance.',
    },
    {
      title: 'Themes, Sound & Memory',
      description:
        'Four board themes (Classic Wood, Emerald, Ocean, Dark Neutral), move, capture, check and game-over sounds synthesised with the Web Audio API (no audio files), mute, and a saved game that survives a page refresh.',
    },
  ],

  engineering: [
    'Peer-to-peer multiplayer with PeerJS: game actions (moves, draw offers, resignations, rematches, resets) travel as small typed messages over a reliable WebRTC data channel.',
    'The full position is re-sent as a FEN on every (re)connection, so a refreshed tab or dropped link rejoins the exact same game.',
    'Game state is saved per room and per colour, so two tabs on the same machine (host and guest) never overwrite each other while testing.',
    'All sounds are generated at runtime with oscillators, keeping the app free of audio assets.',
  ],

  links: {
    live: 'https://chessionew.vercel.app/',
    repo: 'https://github.com/Asadbek0308/chessioNew',
  },
}
