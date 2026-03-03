import type { SymbolId, Puzzle, CellData } from '../lib/types';
import { GRID_SIZE, BOX_SIZE } from '../lib/constants';
import { wordToSymbols, getSymbolIds } from './symbols';
import { solve } from './sudoku-solver';

// Base valid Sudoku grid (digits 0-8)
const BASE_GRID: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [3, 4, 5, 6, 7, 8, 0, 1, 2],
  [6, 7, 8, 0, 1, 2, 3, 4, 5],
  [1, 2, 0, 4, 5, 3, 7, 8, 6],
  [4, 5, 3, 7, 8, 6, 1, 2, 0],
  [7, 8, 6, 1, 2, 0, 4, 5, 3],
  [2, 0, 1, 5, 3, 4, 8, 6, 7],
  [5, 3, 4, 8, 6, 7, 2, 0, 1],
  [8, 6, 7, 2, 0, 1, 5, 3, 4],
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}

function transpose<T>(grid: T[][]): T[][] {
  return grid[0].map((_, c) => grid.map((row) => row[c]));
}

function swapRows(grid: number[][], r1: number, r2: number): void {
  [grid[r1], grid[r2]] = [grid[r2], grid[r1]];
}

function swapCols(grid: number[][], c1: number, c2: number): void {
  for (let r = 0; r < GRID_SIZE; r++) {
    [grid[r][c1], grid[r][c2]] = [grid[r][c2], grid[r][c1]];
  }
}

function randomizeGrid(rng: () => number): number[][] {
  let grid = cloneGrid(BASE_GRID);

  // Random transformations
  const numTransforms = 20 + Math.floor(rng() * 20);
  for (let t = 0; t < numTransforms; t++) {
    const op = Math.floor(rng() * 5);
    switch (op) {
      case 0: { // swap rows within band
        const band = Math.floor(rng() * BOX_SIZE);
        const r1 = band * BOX_SIZE + Math.floor(rng() * BOX_SIZE);
        let r2 = band * BOX_SIZE + Math.floor(rng() * BOX_SIZE);
        while (r2 === r1) r2 = band * BOX_SIZE + Math.floor(rng() * BOX_SIZE);
        swapRows(grid, r1, r2);
        break;
      }
      case 1: { // swap cols within stack
        const stack = Math.floor(rng() * BOX_SIZE);
        const c1 = stack * BOX_SIZE + Math.floor(rng() * BOX_SIZE);
        let c2 = stack * BOX_SIZE + Math.floor(rng() * BOX_SIZE);
        while (c2 === c1) c2 = stack * BOX_SIZE + Math.floor(rng() * BOX_SIZE);
        swapCols(grid, c1, c2);
        break;
      }
      case 2: { // swap bands
        const b1 = Math.floor(rng() * BOX_SIZE);
        let b2 = Math.floor(rng() * BOX_SIZE);
        while (b2 === b1) b2 = Math.floor(rng() * BOX_SIZE);
        for (let i = 0; i < BOX_SIZE; i++) swapRows(grid, b1 * BOX_SIZE + i, b2 * BOX_SIZE + i);
        break;
      }
      case 3: { // swap stacks
        const s1 = Math.floor(rng() * BOX_SIZE);
        let s2 = Math.floor(rng() * BOX_SIZE);
        while (s2 === s1) s2 = Math.floor(rng() * BOX_SIZE);
        for (let i = 0; i < BOX_SIZE; i++) swapCols(grid, s1 * BOX_SIZE + i, s2 * BOX_SIZE + i);
        break;
      }
      case 4: { // transpose
        grid = transpose(grid);
        break;
      }
    }
  }

  return grid;
}

function embedWord(grid: number[][], wordSymbolIds: SymbolId[], rng: () => number): {
  grid: SymbolId[][];
  wordRow: number | null;
  wordCol: number | null;
  wordReversed: boolean;
} {
  // Pick random row or column
  const useRow = rng() < 0.5;
  const index = Math.floor(rng() * GRID_SIZE);

  // Possibly reverse the word direction
  const reversed = rng() < 0.5;
  const targetOrder = reversed ? [...wordSymbolIds].reverse() : wordSymbolIds;

  // Current symbols in chosen row/col (as indices 0-8)
  const currentIndices: number[] = useRow
    ? grid[index]
    : grid.map((row) => row[index]);

  // Build relabeling: currentIndices[i] should map to targetOrder[i]
  const relabel: Record<number, SymbolId> = {};
  for (let i = 0; i < GRID_SIZE; i++) {
    relabel[currentIndices[i]] = targetOrder[i];
  }

  // Apply relabeling globally
  const result: SymbolId[][] = grid.map((row) =>
    row.map((val) => relabel[val])
  );

  return {
    grid: result,
    wordRow: useRow ? index : null,
    wordCol: useRow ? null : index,
    wordReversed: reversed,
  };
}

function digHoles(
  fullGrid: SymbolId[][],
  symbolIds: SymbolId[],
  targetGivens: number,
  rng: () => number
): (SymbolId | null)[][] {
  const puzzle: (SymbolId | null)[][] = fullGrid.map((row) => [...row]);
  const totalCells = GRID_SIZE * GRID_SIZE;
  const toRemove = totalCells - targetGivens;

  // Create shuffled list of all cell positions
  const positions = shuffle(
    Array.from({ length: totalCells }, (_, i) => [Math.floor(i / GRID_SIZE), i % GRID_SIZE] as [number, number]),
    rng
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= toRemove) break;

    const saved = puzzle[r][c];
    puzzle[r][c] = null;

    const solutions = solve(puzzle, symbolIds, 2);
    if (solutions.length !== 1) {
      puzzle[r][c] = saved; // restore — removal breaks uniqueness
    } else {
      removed++;
    }
  }

  return puzzle;
}

export function generatePuzzle(word: string, targetGivens: number, rng: () => number = Math.random): Puzzle {
  const symbols = wordToSymbols(word);
  const symbolIds = getSymbolIds(symbols);

  // Stage 1: Generate random valid grid
  const numericGrid = randomizeGrid(rng);

  // Stage 2: Embed word via relabeling
  const { grid: solution, wordRow, wordCol, wordReversed } = embedWord(numericGrid, symbolIds, rng);

  // Stage 3: Dig holes
  const puzzleGrid = digHoles(solution, symbolIds, targetGivens, rng);

  // Build CellData grid
  const grid: CellData[][] = puzzleGrid.map((row) =>
    row.map((val) => ({
      symbolId: val,
      isGiven: val !== null,
    }))
  );

  // Shuffle display order so the symbol picker doesn't spell out the word
  const displayOrder = shuffle(Array.from({ length: GRID_SIZE }, (_, i) => i), rng);
  const shuffledSymbols = displayOrder.map(i => symbols[i]);
  const shuffledSymbolIds = displayOrder.map(i => symbolIds[i]);

  return {
    grid,
    solution,
    symbols: shuffledSymbols,
    symbolIds: shuffledSymbolIds,
    wordRow,
    wordCol,
    wordReversed,
    word: word.toLowerCase(),
  };
}
