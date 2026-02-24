# Grid Arcade (Next.js)

A browser mini-game site built with Next.js (App Router + TypeScript).

## Current games

- `/games/life`: Conway's Game of Life
- `/games/tetris`: Tetra Fusion (classic / cascade gravity / sand fusion)
- `/games/rotate-sum`: Spin Sum Puzzle (rotating corner balls + guaranteed solvable puzzles)

## Features implemented

- Game lobby homepage with compact cards and fuzzy search
- Classic Conway rules by default (`B3/S23`)
- Start, pause, single-step, clear, randomize
- Speed control (FPS)
- Grid size controls + presets (small/medium/large)
- Adjustable cell size
- Edge wrapping toggle
- Grid line toggle
- Click and drag drawing (toggle / paint / erase)
- Pattern stamping (Block, Blinker, Toad, Glider, LWSS, R-pentomino, Acorn, Gosper gun)
- Rule editor (custom `B.../S...` syntax)
- Real-time stats (generation, live cells, board size, rule)
- Keyboard shortcuts (Space, N, R, C)
- Share links (encodes current board state in URL)
- Local autosave + restore
- Theme switching (Arcade/Sunset/Terminal)
- Built-in i18n with browser language detection + language switcher
- Supported languages: English, 简体中文, Español, 日本語, Français, Deutsch
- Tetra Fusion with in-game mode guide, physics mode switch, and keyboard controls
- Spin Sum Puzzle with 3 difficulty levels, guaranteed solvable generation, auto-solver playback, and celebration modal

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

If your network cannot reach `registry.npmjs.org`, dependency installation will fail with `ENOTFOUND`.
