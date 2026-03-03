# Woku

A daily puzzle game that combines **Sudoku** and **Wordle**. Solve a 9x9 letter-based Sudoku grid where a hidden 9-letter word is embedded in one row or column — or skip the grid and guess the word directly.

A new puzzle is generated every day, consistent for all players.

## How It Works

- The grid uses **letters instead of numbers**. Each of the 9 unique symbols (derived from the daily word) appears exactly once per row, column, and 3x3 box.
- Duplicate letters in the word are distinguished with subscript digits (e.g. `s₁`, `s₂`).
- A **9-letter word** is hidden in a single row or column (possibly reversed). Completing that row/column — or guessing the word — wins the game.
- Each day, the number of pre-filled cells (givens) is randomly chosen between **28 and 35**, seeded by the date so every player gets the same puzzle.

## Features

- **Daily puzzles** — deterministic per day via seeded PRNG (Mulberry32)
- **Notes mode** — toggle pencil marks per cell (Shift+N)
- **Auto Notes** — fills all valid candidates automatically (+10:00 penalty)
- **Validate** — highlights incorrect cells (+1:00 penalty)
- **Undo** — revert moves (Ctrl/Cmd+Z), up to 50 steps
- **Keyboard navigation** — arrow keys, letter keys to place, Backspace/Delete to clear
- **Word guess** — guess the hidden word Wordle-style with color-coded feedback
- **Persistent state** — progress saved to localStorage; resume where you left off
- **Timer** — tracks solve time including penalties; pauses when the tab is hidden

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for dev/build
- **Tailwind CSS 4** for styling
- No external runtime dependencies beyond React

## Getting Started

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server with hot reload    |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build        |
| `npm run lint`    | Run ESLint                          |

## Project Structure

```
src/
  engine/          # Core game logic
    sudoku-generator.ts   # Puzzle generation (randomize, embed word, dig holes)
    sudoku-solver.ts      # Backtracking solver (ensures unique solutions)
    symbols.ts            # Word-to-symbol mapping and display
    wordle.ts             # Wordle-style guess evaluation
  lib/             # Shared utilities and types
    constants.ts          # Grid size, givens range, etc.
    daily.ts              # Daily word/seed selection (seeded PRNG)
    types.ts              # TypeScript interfaces
  state/           # State management
    useGameState.ts       # Game reducer, timer, localStorage persistence
  components/      # React UI components
    Grid.tsx, Cell.tsx, SymbolPicker.tsx, WordGuess.tsx,
    Header.tsx, GameOverModal.tsx, HowToPlayModal.tsx
  App.tsx           # Root component
```
