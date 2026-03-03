import { useReducer, useCallback, useEffect, useRef, useMemo, useState } from 'react';
import type { GameState, SymbolId, WordGuessEntry, Puzzle } from '../lib/types';
import { GRID_SIZE, BOX_SIZE, MAX_GUESSES, GIVENS_MIN, GIVENS_MAX } from '../lib/constants';
import { generatePuzzle } from '../engine/sudoku-generator';
import { evaluateGuess } from '../engine/wordle';
import { getDailyWord, getDailySeed, getDayIndex, createSeededRng } from '../lib/daily';
import words from '../../words.json';

const STORAGE_KEY = 'woku-game-state';
const MAX_UNDO = 50;

// Pre-compute a Set for fast word validation
const wordSet = new Set((words as string[]).map((w) => w.toLowerCase()));

type Action =
  | { type: 'NEW_GAME' }
  | { type: 'START_GAME' }
  | { type: 'SELECT_CELL'; row: number; col: number }
  | { type: 'PLACE_SYMBOL'; symbolId: SymbolId }
  | { type: 'CLEAR_CELL' }
  | { type: 'GUESS_WORD'; word: string }
  | { type: 'TOGGLE_NOTES_MODE' }
  | { type: 'UNDO' }
  | { type: 'AUTO_NOTES' }
  | { type: 'VALIDATE' }
  | { type: 'DESELECT' }
  | { type: 'RESTORE'; state: GameState };

function createEmptyValidationErrors(): boolean[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
}

function createEmptyNotes(): SymbolId[][][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => [])
  );
}

function createNewGame(): GameState {
  const word = getDailyWord();
  const rng = createSeededRng(getDailySeed());
  const targetGivens = GIVENS_MIN + Math.floor(rng() * (GIVENS_MAX - GIVENS_MIN + 1));
  const puzzle = generatePuzzle(word, targetGivens, rng);
  const playerGrid: (SymbolId | null)[][] = puzzle.grid.map((row) =>
    row.map((cell) => cell.symbolId)
  );
  return {
    puzzle,
    playerGrid,
    selectedCell: null,
    guesses: [],
    gameStatus: 'idle',
    startTime: 0,
    elapsed: 0,
    notes: createEmptyNotes(),
    notesMode: false,
    penalty: 0,
    autoNotesActive: false,
    validationErrors: createEmptyValidationErrors(),
    dayIndex: getDayIndex(),
  };
}

function checkErrors(playerGrid: (SymbolId | null)[][]): boolean[][] {
  const errors: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(false)
  );

  for (let i = 0; i < GRID_SIZE; i++) {
    const rowVals: Map<SymbolId, number[]> = new Map();
    for (let j = 0; j < GRID_SIZE; j++) {
      const v = playerGrid[i][j];
      if (v) {
        if (!rowVals.has(v)) rowVals.set(v, []);
        rowVals.get(v)!.push(j);
      }
    }
    for (const positions of rowVals.values()) {
      if (positions.length > 1) {
        for (const j of positions) errors[i][j] = true;
      }
    }

    const colVals: Map<SymbolId, number[]> = new Map();
    for (let j = 0; j < GRID_SIZE; j++) {
      const v = playerGrid[j][i];
      if (v) {
        if (!colVals.has(v)) colVals.set(v, []);
        colVals.get(v)!.push(j);
      }
    }
    for (const positions of colVals.values()) {
      if (positions.length > 1) {
        for (const j of positions) errors[j][i] = true;
      }
    }
  }

  for (let br = 0; br < GRID_SIZE; br += BOX_SIZE) {
    for (let bc = 0; bc < GRID_SIZE; bc += BOX_SIZE) {
      const boxVals: Map<SymbolId, [number, number][]> = new Map();
      for (let dr = 0; dr < BOX_SIZE; dr++) {
        for (let dc = 0; dc < BOX_SIZE; dc++) {
          const r = br + dr, c = bc + dc;
          const v = playerGrid[r][c];
          if (v) {
            if (!boxVals.has(v)) boxVals.set(v, []);
            boxVals.get(v)!.push([r, c]);
          }
        }
      }
      for (const positions of boxVals.values()) {
        if (positions.length > 1) {
          for (const [r, c] of positions) errors[r][c] = true;
        }
      }
    }
  }

  return errors;
}

function checkSudokuComplete(playerGrid: (SymbolId | null)[][], puzzle: Puzzle): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (playerGrid[r][c] !== puzzle.solution[r][c]) return false;
    }
  }
  return true;
}

function checkWordRowColComplete(playerGrid: (SymbolId | null)[][], puzzle: Puzzle): boolean {
  if (puzzle.wordRow !== null) {
    const r = puzzle.wordRow;
    for (let c = 0; c < GRID_SIZE; c++) {
      if (playerGrid[r][c] !== puzzle.solution[r][c]) return false;
    }
    return true;
  }
  if (puzzle.wordCol !== null) {
    const c = puzzle.wordCol;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (playerGrid[r][c] !== puzzle.solution[r][c]) return false;
    }
    return true;
  }
  return false;
}

function clearSymbolFromPeerNotes(notes: SymbolId[][][], r: number, c: number, symbolId: SymbolId): SymbolId[][][] {
  const newNotes = notes.map((row) => row.map((cell) => [...cell]));

  for (let j = 0; j < GRID_SIZE; j++) {
    if (j !== c) newNotes[r][j] = newNotes[r][j].filter((s) => s !== symbolId);
  }
  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== r) newNotes[i][c] = newNotes[i][c].filter((s) => s !== symbolId);
  }
  const boxR = Math.floor(r / BOX_SIZE) * BOX_SIZE;
  const boxC = Math.floor(c / BOX_SIZE) * BOX_SIZE;
  for (let dr = 0; dr < BOX_SIZE; dr++) {
    for (let dc = 0; dc < BOX_SIZE; dc++) {
      const nr = boxR + dr, nc = boxC + dc;
      if (nr !== r || nc !== c) {
        newNotes[nr][nc] = newNotes[nr][nc].filter((s) => s !== symbolId);
      }
    }
  }

  return newNotes;
}

function computeAllNotes(playerGrid: (SymbolId | null)[][], puzzle: Puzzle): SymbolId[][][] {
  const notes = createEmptyNotes();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (playerGrid[r][c] !== null || puzzle.grid[r][c].isGiven) continue;
      const used = new Set<SymbolId>();
      for (let j = 0; j < GRID_SIZE; j++) {
        const v = playerGrid[r][j];
        if (v) used.add(v);
      }
      for (let i = 0; i < GRID_SIZE; i++) {
        const v = playerGrid[i][c];
        if (v) used.add(v);
      }
      const boxR = Math.floor(r / BOX_SIZE) * BOX_SIZE;
      const boxC = Math.floor(c / BOX_SIZE) * BOX_SIZE;
      for (let dr = 0; dr < BOX_SIZE; dr++) {
        for (let dc = 0; dc < BOX_SIZE; dc++) {
          const v = playerGrid[boxR + dr][boxC + dc];
          if (v) used.add(v);
        }
      }
      notes[r][c] = puzzle.symbolIds.filter((s) => !used.has(s));
    }
  }
  return notes;
}

// Undo history stored outside reducer to avoid serializing in state
let undoStack: GameState[] = [];

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      undoStack = [];
      return createNewGame();

    case 'START_GAME':
      if (state.gameStatus !== 'idle') return state;
      undoStack = [];
      return { ...state, gameStatus: 'playing', startTime: Date.now() };

    case 'RESTORE':
      undoStack = [];
      return {
        ...action.state,
        validationErrors: action.state.validationErrors ?? createEmptyValidationErrors(),
      };

    case 'UNDO': {
      const prev = undoStack.pop();
      return prev ?? state;
    }

    case 'SELECT_CELL': {
      if (state.gameStatus !== 'playing' || !state.puzzle) return state;
      return { ...state, selectedCell: [action.row, action.col] };
    }

    case 'DESELECT':
      return { ...state, selectedCell: null };

    case 'TOGGLE_NOTES_MODE':
      return { ...state, notesMode: !state.notesMode };

    case 'PLACE_SYMBOL': {
      if (state.gameStatus !== 'playing' || !state.selectedCell || !state.puzzle) return state;
      const [r, c] = state.selectedCell;
      if (state.puzzle.grid[r][c].isGiven) return state;

      // Save undo snapshot before mutation
      undoStack.push(state);
      if (undoStack.length > MAX_UNDO) undoStack.shift();

      if (state.notesMode) {
        const newNotes = state.notes.map((row) => row.map((cell) => [...cell]));
        const cellNotes = newNotes[r][c];
        const idx = cellNotes.indexOf(action.symbolId);
        if (idx >= 0) {
          cellNotes.splice(idx, 1);
        } else {
          cellNotes.push(action.symbolId);
        }
        return { ...state, notes: newNotes };
      }

      const newGrid = state.playerGrid.map((row) => [...row]);
      newGrid[r][c] = action.symbolId;

      let newNotes: SymbolId[][][];
      if (state.autoNotesActive) {
        newNotes = computeAllNotes(newGrid, state.puzzle);
      } else {
        newNotes = state.notes.map((row) => row.map((cell) => [...cell]));
        newNotes[r][c] = [];
        newNotes = clearSymbolFromPeerNotes(newNotes, r, c, action.symbolId);
      }

      // Clear validation error for the modified cell
      let newValidationErrors = state.validationErrors;
      if (state.validationErrors[r][c]) {
        newValidationErrors = state.validationErrors.map((row) => [...row]);
        newValidationErrors[r][c] = false;
      }

      const newState = { ...state, playerGrid: newGrid, notes: newNotes, validationErrors: newValidationErrors };

      if (checkSudokuComplete(newGrid, state.puzzle)) {
        return { ...newState, gameStatus: 'won' };
      }

      if (checkWordRowColComplete(newGrid, state.puzzle)) {
        return { ...newState, gameStatus: 'won' };
      }

      return newState;
    }

    case 'CLEAR_CELL': {
      if (state.gameStatus !== 'playing' || !state.selectedCell || !state.puzzle) return state;
      const [r, c] = state.selectedCell;
      if (state.puzzle.grid[r][c].isGiven) return state;

      // Save undo snapshot
      undoStack.push(state);
      if (undoStack.length > MAX_UNDO) undoStack.shift();

      const newGrid = state.playerGrid.map((row) => [...row]);
      newGrid[r][c] = null;

      let newNotes: SymbolId[][][];
      if (state.autoNotesActive) {
        newNotes = computeAllNotes(newGrid, state.puzzle);
      } else {
        newNotes = state.notes.map((row) => row.map((cell) => [...cell]));
        newNotes[r][c] = [];
      }

      // Clear validation error for the cleared cell
      let newValidationErrors2 = state.validationErrors;
      if (state.validationErrors[r][c]) {
        newValidationErrors2 = state.validationErrors.map((row) => [...row]);
        newValidationErrors2[r][c] = false;
      }

      return { ...state, playerGrid: newGrid, notes: newNotes, validationErrors: newValidationErrors2 };
    }

    case 'AUTO_NOTES': {
      if (state.gameStatus !== 'playing' || !state.puzzle || state.autoNotesActive) return state;

      // Save undo snapshot
      undoStack.push(state);
      if (undoStack.length > MAX_UNDO) undoStack.shift();

      const newNotes = computeAllNotes(state.playerGrid, state.puzzle);
      return { ...state, notes: newNotes, penalty: state.penalty + 600, autoNotesActive: true };
    }

    case 'VALIDATE': {
      if (state.gameStatus !== 'playing' || !state.puzzle) return state;
      const validationErrors: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const val = state.playerGrid[r][c];
          if (val !== null && val !== state.puzzle.solution[r][c]) {
            validationErrors[r][c] = true;
          }
        }
      }
      return { ...state, validationErrors, penalty: state.penalty + 60 };
    }

    case 'GUESS_WORD': {
      if (state.gameStatus !== 'playing' || !state.puzzle) return state;
      const guess = action.word.toLowerCase();
      const result = evaluateGuess(guess, state.puzzle.word);
      const entry: WordGuessEntry = { word: guess, result };
      const newGuesses = [...state.guesses, entry];

      if (guess === state.puzzle.word) {
        return { ...state, guesses: newGuesses, gameStatus: 'won' };
      }

      if (newGuesses.length >= MAX_GUESSES) {
        return { ...state, guesses: newGuesses, gameStatus: 'lost' };
      }

      return { ...state, guesses: newGuesses };
    }

    default:
      return state;
  }
}

/** Isolated timer hook — only re-renders the component that uses the returned value */
function useTimer(gameStatus: string, startTime: number, penalty: number) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hiddenDurationRef = useRef(0);
  const hideStartRef = useRef(0);

  useEffect(() => {
    if (gameStatus === 'playing') {
      hiddenDurationRef.current = 0;
      hideStartRef.current = 0;
      const computeElapsed = () =>
        startTime ? Math.floor((Date.now() - startTime - hiddenDurationRef.current) / 1000) : 0;
      setElapsed(computeElapsed());
      intervalRef.current = setInterval(() => setElapsed(computeElapsed()), 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      clearInterval(intervalRef.current);
    }
  }, [gameStatus, startTime]);

  // Pause timer when tab is hidden — track hidden duration
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const onVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
        hideStartRef.current = Date.now();
      } else {
        if (hideStartRef.current > 0) {
          hiddenDurationRef.current += Date.now() - hideStartRef.current;
          hideStartRef.current = 0;
        }
        const computeElapsed = () =>
          startTime ? Math.floor((Date.now() - startTime - hiddenDurationRef.current) / 1000) : 0;
        setElapsed(computeElapsed());
        intervalRef.current = setInterval(() => setElapsed(computeElapsed()), 1000);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [gameStatus, startTime]);

  return elapsed + penalty;
}

function loadOrCreateGame(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as GameState;
      if (parsed.puzzle && parsed.dayIndex === getDayIndex()) {
        if (!parsed.notes) parsed.notes = createEmptyNotes();
        if (parsed.notesMode === undefined) parsed.notesMode = false;
        if (parsed.penalty === undefined) parsed.penalty = 0;
        if (parsed.autoNotesActive === undefined) parsed.autoNotesActive = false;
        if (!parsed.validationErrors) parsed.validationErrors = createEmptyValidationErrors();
        if (parsed.gameStatus === 'playing' && parsed.elapsed > 0) {
          parsed.startTime = Date.now() - parsed.elapsed * 1000;
        }
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return createNewGame();
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, undefined, loadOrCreateGame);

  // Isolated timer — doesn't cause game state re-renders
  const elapsed = useTimer(state.gameStatus, state.startTime, state.penalty);

  // Persist game state to localStorage on state change (not every timer tick)
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;

  useEffect(() => {
    if (state.puzzle) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, elapsed: elapsedRef.current }));
    }
  }, [state]);

  // Save elapsed on visibility hidden and unmount
  useEffect(() => {
    const saveElapsed = () => {
      if (state.puzzle) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, elapsed: elapsedRef.current }));
      }
    };
    const onVisibility = () => { if (document.hidden) saveElapsed(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      saveElapsed();
    };
  }, [state]);


  // Memoize error checking on playerGrid reference
  const errors = useMemo(
    () => (state.playerGrid ? checkErrors(state.playerGrid) : []),
    [state.playerGrid]
  );

  const selectCell = useCallback((row: number, col: number) => {
    dispatch({ type: 'SELECT_CELL', row, col });
  }, []);

  const deselectCell = useCallback(() => {
    dispatch({ type: 'DESELECT' });
  }, []);

  const placeSymbol = useCallback((symbolId: SymbolId) => {
    dispatch({ type: 'PLACE_SYMBOL', symbolId });
  }, []);

  const clearCell = useCallback(() => {
    dispatch({ type: 'CLEAR_CELL' });
  }, []);

  const guessWord = useCallback((word: string) => {
    dispatch({ type: 'GUESS_WORD', word });
  }, []);

  const isValidWord = useCallback((word: string) => {
    return wordSet.has(word.toLowerCase());
  }, []);

  const toggleNotesMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTES_MODE' });
  }, []);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const autoNotes = useCallback(() => {
    dispatch({ type: 'AUTO_NOTES' });
  }, []);

  const validate = useCallback(() => {
    dispatch({ type: 'VALIDATE' });
  }, []);

  const canUndo = undoStack.length > 0;

  return {
    state,
    elapsed,
    errors,
    selectCell,
    deselectCell,
    placeSymbol,
    clearCell,
    guessWord,
    isValidWord,
    toggleNotesMode,
    startGame,
    undo,
    autoNotes,
    validate,
    canUndo,
  };
}
