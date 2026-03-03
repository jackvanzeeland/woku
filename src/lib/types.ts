export interface Symbol {
  letter: string;
  occurrence: number;
  totalCount: number;
}

export type SymbolId = string; // e.g. "s" or "s_2"

export interface CellData {
  symbolId: SymbolId | null;
  isGiven: boolean;
}

export type Grid = CellData[][];

export type SolverGrid = (SymbolId | null)[][];

export interface Puzzle {
  grid: Grid;
  solution: SymbolId[][];
  symbols: Symbol[];
  symbolIds: SymbolId[];
  wordRow: number | null;    // row index if word is in a row
  wordCol: number | null;    // col index if word is in a column
  wordReversed: boolean;
  word: string;
}

export type GuessResult = ('correct' | 'present' | 'absent')[];

export interface WordGuessEntry {
  word: string;
  result: GuessResult;
}

export interface GameState {
  puzzle: Puzzle | null;
  playerGrid: (SymbolId | null)[][];
  selectedCell: [number, number] | null;
  guesses: WordGuessEntry[];
  gameStatus: 'idle' | 'playing' | 'won' | 'lost';
  startTime: number;
  elapsed: number;
  notes: SymbolId[][][];
  notesMode: boolean;
  penalty: number;
  autoNotesActive: boolean;
  validationErrors: boolean[][];
  dayIndex: number;
}
