import type { SymbolId } from '../lib/types';
import { GRID_SIZE, BOX_SIZE } from '../lib/constants';

type PossibleSets = Set<SymbolId>[][];

// Pre-compute peer lists for all cells
const PEERS: [number, number][][][] = Array.from({ length: GRID_SIZE }, (_, r) =>
  Array.from({ length: GRID_SIZE }, (_, c) => {
    const result: [number, number][] = [];
    const seen = new Set<string>();
    const add = (nr: number, nc: number) => {
      const k = `${nr},${nc}`;
      if (!seen.has(k)) { seen.add(k); result.push([nr, nc]); }
    };
    for (let i = 0; i < GRID_SIZE; i++) {
      if (i !== c) add(r, i);
      if (i !== r) add(i, c);
    }
    const br = Math.floor(r / BOX_SIZE) * BOX_SIZE;
    const bc = Math.floor(c / BOX_SIZE) * BOX_SIZE;
    for (let dr = 0; dr < BOX_SIZE; dr++) {
      for (let dc = 0; dc < BOX_SIZE; dc++) {
        const nr = br + dr, nc = bc + dc;
        if (nr !== r || nc !== c) add(nr, nc);
      }
    }
    return result;
  })
);

function createPossibleSets(symbolIds: SymbolId[]): PossibleSets {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => new Set(symbolIds))
  );
}

function eliminate(possible: PossibleSets, r: number, c: number, val: SymbolId): boolean {
  if (!possible[r][c].has(val)) return true;
  possible[r][c].delete(val);
  const size = possible[r][c].size;
  if (size === 0) return false; // contradiction
  if (size === 1) {
    const remaining = [...possible[r][c]][0];
    for (const [pr, pc] of PEERS[r][c]) {
      if (!eliminate(possible, pr, pc, remaining)) return false;
    }
  }
  return true;
}

function assign(possible: PossibleSets, r: number, c: number, val: SymbolId): boolean {
  const others = [...possible[r][c]].filter((v) => v !== val);
  for (const o of others) {
    if (!eliminate(possible, r, c, o)) return false;
  }
  return true;
}

function clonePossible(possible: PossibleSets): PossibleSets {
  return possible.map((row) => row.map((s) => new Set(s)));
}

function isSolved(possible: PossibleSets): boolean {
  return possible.every((row) => row.every((s) => s.size === 1));
}

function extractGrid(possible: PossibleSets): SymbolId[][] {
  return possible.map((row) => row.map((s) => [...s][0]));
}

export function solve(
  grid: (SymbolId | null)[][],
  symbolIds: SymbolId[],
  maxSolutions = 1
): SymbolId[][][] {
  const possible = createPossibleSets(symbolIds);

  // Apply given values
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) {
        if (!assign(possible, r, c, grid[r][c]!)) return [];
      }
    }
  }

  const solutions: SymbolId[][][] = [];

  function search(possible: PossibleSets): boolean {
    if (solutions.length >= maxSolutions) return true;
    if (isSolved(possible)) {
      solutions.push(extractGrid(possible));
      return solutions.length >= maxSolutions;
    }

    // Find cell with fewest possibilities > 1
    let minSize = GRID_SIZE + 1;
    let bestR = 0, bestC = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const s = possible[r][c].size;
        if (s > 1 && s < minSize) {
          minSize = s;
          bestR = r;
          bestC = c;
        }
      }
    }

    for (const val of possible[bestR][bestC]) {
      const copy = clonePossible(possible);
      if (assign(copy, bestR, bestC, val)) {
        if (search(copy)) return true;
      }
    }
    return false;
  }

  search(possible);
  return solutions;
}
