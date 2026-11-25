# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state and commands

All spec stages are implemented (the five engines, audio, scores, content, mobile/accessibility pass); remaining work is review and polish. Stack: a Vite + React 19 scaffold with Tailwind v4 (`@tailwindcss/vite`), `react-router-dom` (`HashRouter`, so URLs look like `/#/games/pong`), all routes, placeholder pages, the CRT overlay, and the `ArcadeCabinet` shell, and all Ukrainian article content with `GameArticle`, the home-page timeline/showcase and the About page. The audio synthesizer and the home-page `HighScoresTable` are also done. All five games are playable (`ENGINES` is complete; the «СКОРО» overlay remains only for unknown/unregistered slugs) (the cabinet shows «СКОРО»). The spec [Технічне_завдання.md](Технічне_завдання.md) is the source of truth.

```bash
npm run dev      # dev server (Vite, http://localhost:5173)
npm run build    # production build into dist/
npm run lint     # oxlint
npm run preview  # serve the built dist/
npm test         # vitest run (all tests)
npx vitest run src/games/PongEngine.test.js   # a single test file
```

Vitest tests cover pure game logic only (e.g. `paddleBounce`, Snake's `advance`, Invaders' `stepFormation`, Tetris' `collides`/`clearLines`/`tryRotate`, Pac-Man's `MAZE`/`bfsDistances`/`chaseTarget`); export such functions from the engines to test them.

Tailwind v4 has no `tailwind.config.js`: theme colors and fonts live in the `@theme` block of `src/index.css` (`bg-night`, `text-neon-pink`, `font-pixel`, ...). Global `soundOn`/`crtOn` settings live in `src/utils/SettingsContext.jsx` (`useSettings()`), persisted through `src/utils/storageService.js`, which also holds the `getScore`/`setScoreIfBest`/`resetScores` helpers. `ArcadeCabinet` is presentational: an engine passes `score`, `highScore`, `status` (`idle|running|paused|over`) and receives touch input via `onInput(name, pressed)` with names `up/down/left/right/fire/rotate`; the touch pad is hidden from `md` up. Sound: games call `const { play } = useRetroAudio(); play('shoot')` (`src/utils/useRetroAudio.js` over `src/utils/audioService.js`; names: select, start, bounce, wall, score, shoot, explosion, eat, move, line, gameover, win). `SettingsProvider` pushes the mute flag into the audio service, so games never check it; the `AudioContext` is created lazily on first play (browser autoplay rules).

Engine contract (documented at the top of `src/games/engines.js`, which maps slug -> factory): `createXEngine(canvas, { play, onScore, onStatus, onGameOver })` returns `{ keymap, start, pause, resume, togglePause, setInput, releaseAll, destroy }`. `GamePage`'s `GameView` (keyed by slug) creates the engine in an effect, translates keyboard events through `engine.keymap`, handles P (pause), auto-pauses on blur/hidden tab, saves records via `setScoreIfBest`, and calls `engine.destroy()` (cancels `requestAnimationFrame`) on unmount. The loop runs only while status is `running`. To add a game: write `XEngine.js` following `PongEngine.js`, register it in `ENGINES`, and set `pad` (touch buttons) in `gamesData.js`.

Mobile/touch: the on-screen pad (`.touch-pad` in `src/index.css`) shows on narrow screens and on coarse-pointer devices; the `pad` field in `gamesData.js` picks which buttons (`dpad`, `vertical`, `horizontal`, `fire`, `rotate`). `swipe: true` (Snake, Pac-Man) enables swipe control in `GameView` and sets `touch-action: none` on that canvas. The cabinet header has a pause button (the P key does not exist on phones). Canvas is fixed 480x360 and scaled by CSS.

`src/games/gamesData.js` is the single registry: order, accent color, controls hint and the full article text per game, plus `findGame`/`getNeighbors`. The navbar, home page, `GamePage` and `GameArticle` all read from it. Historical facts were written from memory, so have them checked against sources; the About page has `[ім’я автора]` placeholders to fill. Avoid `useEffect(() => fn(), ...)` with an implicit return; use braces so the effect returns nothing.

## Project

"Ретро-Аркади XX століття" (Retro Arcades of the 20th Century): a school-project React SPA that works as a digital museum of five arcade games (Pong 1972, Space Invaders 1978, Pac-Man 1980, Tetris 1984, Snake 1997). Each game has a playable HTML5 Canvas cabinet plus a historical article.

- **All UI text and content is Ukrainian (100% localization).** Keep code comments clear for less-experienced readers.
- Stack: React 18+ (hooks), `react-router-dom` (or a light hash/state router for zero-config hosting), Tailwind CSS, Canvas API, Web Audio API, `localStorage`. Fonts from Google Fonts: `Press Start 2P`, `VT323`, `Rajdhani`.

## Architecture (as specified)

Planned layout under `src/`: `components/` (Navbar, Footer, ArcadeCabinet, HighScoresTable), `games/` (one `*Engine.js` per game), `pages/` (HomePage, GamePage, AboutPage, NotFoundPage), `utils/` (`audioService.js`, `storageService.js`), `App.jsx` (routes), `index.css` (fonts + Tailwind directives).

Key design points that span multiple files:

- **One generic `GamePage` serves all game routes.** Routes are `/`, `/games/{pong|invaders|pacman|tetris|snake}` (slug selects the game), `/about`, and `*` (retro-styled "Game Over / Insert Coin" 404). The slug drives which engine, which article content and which prev/next game links are used, so keep a single game registry/content database (spec stage 3) keyed by slug.
- **Game engines are isolated Canvas modules** wrapped by React components via `useRef` and driven by `requestAnimationFrame`. Each must call `cancelAnimationFrame` (and remove key listeners) on unmount or route change, so no loop leaks when navigating.
- **`ArcadeCabinet` is the shared shell** for every game: score/high-score header, Canvas container with start/pause/game-over overlay, and on-screen D-Pad/action buttons for mobile. Engines should be controllable by both keyboard and these virtual buttons.
- **Audio** is synthesized with Web Audio oscillators (no mp3 files), exposed as a `useRetroAudio()` hook or service. The mute state is global across routes and persisted in `localStorage`.
- **Persistence** uses `localStorage` keys `retro_arcade_score_{pong|invaders|pacman|tetris|snake}` for high scores, plus saved settings (sound, CRT). The home page shows an aggregated leaderboard with a reset button. Route all access through `storageService.js`.
- **Global CRT overlay** (scanlines and flicker) is toggled from the Navbar along with the audio toggle.

## Game rules to preserve

- Pong: first to 5 points, vs. computer; ball bounce angle depends on the paddle hit point; speed increases over time. Keys W/S or arrows.
- Space Invaders: aliens sweep left-right-down, speed up as their count drops, drop random bombs. Arrows/A/D + Space.
- Pac-Man: tile-grid maze, mouth animation, simple ghost patrol AI. Arrows/WASD.
- Tetris: 10×20 well, 7 tetrominoes (I,J,L,O,S,T,Z), 90° rotation, line clear, rising level. Left/Right, Down (soft drop), Up/Space (rotate).
- Snake: green LCD (Nokia-style) look, body as a coordinate queue, wall/self collisions, speeds up. Four-direction controls.

## Design system

Dark neon cyberpunk/retrowave theme. Palette: backgrounds `#05070f` / `#090d1a`, magenta `#ff2a85`, cyan `#00f3ff`, amber `#ffe600`, terminal green `#39ff14`. Define these as Tailwind theme colors rather than hard-coding hex values in components.

## Testing games in the Browser pane

When the Browser pane is hidden or unfocused, the browser throttles or stops `requestAnimationFrame` (games freeze or run at ~2 fps). To test an engine there, first override `window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16)` (and `cancelAnimationFrame` with `clearTimeout`) before starting a game; this is a testing workaround, not a bug in the engines.
