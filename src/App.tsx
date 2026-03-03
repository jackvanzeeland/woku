import { useEffect, useMemo, useState } from 'react';
import { GRID_SIZE, MAX_GUESSES } from './lib/constants';
import { symbolToId, buildSymbolDisplayMap } from './engine/symbols';
import { useGameState } from './state/useGameState';
import { Grid } from './components/Grid';
import { SymbolPicker } from './components/SymbolPicker';
import { WordGuess } from './components/WordGuess';
import { Header } from './components/Header';
import { GameOverModal } from './components/GameOverModal';
import { HowToPlayModal } from './components/HowToPlayModal';

function App() {
  const {
    state, elapsed, errors, selectCell, deselectCell, placeSymbol, clearCell,
    guessWord, isValidWord, toggleNotesMode, startGame, undo, autoNotes, validate, canUndo,
  } = useGameState();
  const { puzzle, playerGrid, selectedCell, guesses, gameStatus, notes, notesMode, autoNotesActive, validationErrors, dayIndex } = state;

  const [showHelp, setShowHelp] = useState(() => {
    if (!localStorage.getItem('woku-first-visit')) {
      localStorage.setItem('woku-first-visit', '1');
      return true;
    }
    return false;
  });
  const [showGameOver, setShowGameOver] = useState(false);

  // Show game over modal when game ends
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      setShowGameOver(true);
    }
  }, [gameStatus]);

  const givenMask = useMemo(() => {
    if (!puzzle) return [];
    return puzzle.grid.map((row) => row.map((cell) => cell.isGiven));
  }, [puzzle]);

  const displayMap = useMemo(() => {
    if (!puzzle) return new Map();
    return buildSymbolDisplayMap(puzzle.symbols);
  }, [puzzle]);

  const wordCells = useMemo(() => {
    const set = new Set<string>();
    if (!puzzle || gameStatus !== 'won') return set;
    if (puzzle.wordRow !== null) {
      for (let c = 0; c < GRID_SIZE; c++) set.add(`${puzzle.wordRow},${c}`);
    }
    if (puzzle.wordCol !== null) {
      for (let r = 0; r < GRID_SIZE; r++) set.add(`${r},${puzzle.wordCol}`);
    }
    return set;
  }, [puzzle, gameStatus]);

  const correctWordCells = useMemo(() => {
    const set = new Set<string>();
    if (!puzzle || gameStatus !== 'playing') return set;
    if (puzzle.wordRow !== null) {
      const r = puzzle.wordRow;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (playerGrid[r][c] && playerGrid[r][c] === puzzle.solution[r][c]) {
          set.add(`${r},${c}`);
        }
      }
    }
    if (puzzle.wordCol !== null) {
      const c = puzzle.wordCol;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (playerGrid[r][c] && playerGrid[r][c] === puzzle.solution[r][c]) {
          set.add(`${r},${c}`);
        }
      }
    }
    return set;
  }, [puzzle, gameStatus, playerGrid]);

  // Subtle hint showing which row/col contains the word
  const wordHintCells = useMemo(() => {
    const set = new Set<string>();
    if (!puzzle || gameStatus === 'won' || gameStatus === 'lost') return set;
    if (puzzle.wordRow !== null) {
      for (let c = 0; c < GRID_SIZE; c++) set.add(`${puzzle.wordRow},${c}`);
    }
    if (puzzle.wordCol !== null) {
      for (let r = 0; r < GRID_SIZE; r++) set.add(`${r},${puzzle.wordCol}`);
    }
    return set;
  }, [puzzle, gameStatus]);

  const highlightSymbol = useMemo(() => {
    if (!selectedCell) return null;
    const [r, c] = selectedCell;
    return playerGrid[r][c];
  }, [selectedCell, playerGrid]);

  const remainingCounts = useMemo(() => {
    if (!puzzle) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const id of puzzle.symbolIds) counts.set(id, GRID_SIZE);
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = playerGrid[r][c];
        if (val && counts.has(val)) {
          counts.set(val, counts.get(val)! - 1);
        }
      }
    }
    return counts;
  }, [puzzle, playerGrid]);

  const filledCount = useMemo(() => {
    let count = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (playerGrid[r][c] !== null) count++;
      }
    }
    return count;
  }, [playerGrid]);

  const noteHighlightCells = useMemo(() => {
    const set = new Set<string>();
    if (!highlightSymbol) return set;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!playerGrid[r][c] && notes[r][c].includes(highlightSymbol)) {
          set.add(`${r},${c}`);
        }
      }
    }
    return set;
  }, [highlightSymbol, playerGrid, notes]);

  // Keyboard navigation
  useEffect(() => {
    if (!puzzle || gameStatus !== 'playing') return;

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (showHelp || showGameOver) return;

      if (e.key === 'N' && e.shiftKey) {
        e.preventDefault();
        toggleNotesMode();
        return;
      }

      // Ctrl+Z / Cmd+Z for undo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        deselectCell();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const [r, c] = selectedCell ?? [0, 0];
        let nr = r, nc = c;
        if (e.key === 'ArrowUp') { nr = r - 1; if (nr < 0) { nr = GRID_SIZE - 1; nc = (c - 1 + GRID_SIZE) % GRID_SIZE; } }
        if (e.key === 'ArrowDown') { nr = r + 1; if (nr >= GRID_SIZE) { nr = 0; nc = (c + 1) % GRID_SIZE; } }
        if (e.key === 'ArrowLeft') { nc = c - 1; if (nc < 0) { nc = GRID_SIZE - 1; nr = (r - 1 + GRID_SIZE) % GRID_SIZE; } }
        if (e.key === 'ArrowRight') { nc = c + 1; if (nc >= GRID_SIZE) { nc = 0; nr = (r + 1) % GRID_SIZE; } }
        selectCell(nr, nc);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        clearCell();
        return;
      }

      const letter = e.key.toLowerCase();
      if (/^[a-z]$/.test(letter)) {
        const matching = puzzle.symbols
          .filter((s) => s.letter === letter)
          .map((s) => symbolToId(s));
        if (matching.length === 0) return;

        if (selectedCell) {
          const currentVal = playerGrid[selectedCell[0]][selectedCell[1]];
          const currentIdx = currentVal ? matching.indexOf(currentVal) : -1;
          const nextIdx = (currentIdx + 1) % (matching.length + 1);
          if (nextIdx === matching.length) {
            clearCell();
          } else {
            placeSymbol(matching[nextIdx]);
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [puzzle, gameStatus, selectedCell, playerGrid, selectCell, deselectCell, placeSymbol, clearCell, toggleNotesMode, undo, showHelp, showGameOver]);

  if (!puzzle) return null;

  const isIdle = gameStatus === 'idle';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-stone-100 flex">
      {/* Left sidebar — hidden on mobile */}
      <div className="hidden lg:block w-[10%]" />

      {/* Center game column */}
      <div className="w-full lg:w-[80%] p-4 flex flex-col items-center gap-4">
        <Header elapsed={elapsed} dayIndex={dayIndex} penalty={state.penalty} filledCount={filledCount} onHelpClick={() => setShowHelp(true)} />

        <div className="relative w-full max-w-[500px]">
          {isIdle && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl gap-4 px-6">
              <h2 className="text-xl font-bold text-slate-800">Woku #{dayIndex + 1}</h2>
              <p className="text-sm text-slate-500 text-center leading-relaxed">
                Solve the sudoku using letters instead of numbers.
                A <strong>9-letter word</strong> is hidden in one row or column.
                Find it by solving the grid or guess it directly!
              </p>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-lg"
              >
                Start
              </button>
              <button
                onClick={() => setShowHelp(true)}
                className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                How to play
              </button>
            </div>
          )}
          <div className={isIdle ? 'blur-sm pointer-events-none select-none' : ''}>
            <Grid
              playerGrid={playerGrid}
              givenMask={givenMask}
              errors={errors}
              selectedCell={selectedCell}
              highlightSymbol={highlightSymbol}
              wordCells={wordCells}
              correctWordCells={correctWordCells}
              wordHintCells={wordHintCells}
              displayMap={displayMap}
              symbolIds={puzzle.symbolIds}
              notes={notes}
              validationErrors={validationErrors}
              noteHighlightCells={noteHighlightCells}
              noteHighlightSymbol={highlightSymbol}
              onCellClick={selectCell}
            />
          </div>
        </div>

        {/* Toolbar: notes toggle + undo */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleNotesMode}
            disabled={isIdle}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              notesMode
                ? 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Notes {notesMode ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={undo}
            disabled={isIdle || !canUndo}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Undo
          </button>
          <button
            onClick={autoNotes}
            disabled={isIdle || gameStatus !== 'playing' || autoNotesActive}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              autoNotesActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {autoNotesActive ? 'Auto Notes ON' : <>Auto Notes <span className="text-red-400 text-xs">(+10:00)</span></>}
          </button>
          <button
            onClick={validate}
            disabled={isIdle || gameStatus !== 'playing'}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Validate <span className="text-red-400 text-xs">(+1:00)</span>
          </button>
          <span className="text-[10px] text-slate-400 hidden sm:inline ml-1">
            Shift+N / Ctrl+Z
          </span>
        </div>

        <SymbolPicker
          symbols={puzzle.symbols}
          onPick={placeSymbol}
          onClear={clearCell}
          disabled={gameStatus !== 'playing'}
          notesMode={notesMode}
          remainingCounts={remainingCounts}
        />

        <div className="border-t border-slate-200 pt-4 w-full max-w-[500px]">
          <p className="text-center text-xs text-slate-400 mb-2">
            Guess the hidden 9-letter word ({MAX_GUESSES - guesses.length} guess{MAX_GUESSES - guesses.length !== 1 ? 'es' : ''} remaining)
          </p>
          <WordGuess
            guesses={guesses}
            onGuess={guessWord}
            isValidWord={isValidWord}
            disabled={gameStatus !== 'playing'}
          />
        </div>

        {showGameOver && (gameStatus === 'won' || gameStatus === 'lost') && (
          <GameOverModal
            status={gameStatus}
            word={puzzle.word}
            elapsed={elapsed}
            guessCount={guesses.length}
            dayIndex={dayIndex}
            onClose={() => setShowGameOver(false)}
          />
        )}

        {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}
      </div>

      {/* Right sidebar — hidden on mobile */}
      <div className="hidden lg:block w-[10%]" />
    </div>
  );
}

export default App;
