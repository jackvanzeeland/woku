import type { SymbolId } from '../lib/types';
import { GRID_SIZE, BOX_SIZE } from '../lib/constants';
import { Cell } from './Cell';

interface GridProps {
  playerGrid: (SymbolId | null)[][];
  givenMask: boolean[][];
  errors: boolean[][];
  selectedCell: [number, number] | null;
  highlightSymbol: SymbolId | null;
  wordCells: Set<string>;
  correctWordCells: Set<string>;
  wordHintCells: Set<string>;
  displayMap: Map<SymbolId, string>;
  symbolIds: SymbolId[];
  notes: SymbolId[][][];
  validationErrors: boolean[][];
  noteHighlightCells: Set<string>;
  noteHighlightSymbol: SymbolId | null;
  onCellClick: (row: number, col: number) => void;
}

export function Grid({
  playerGrid, givenMask, errors, selectedCell, highlightSymbol,
  wordCells, correctWordCells, wordHintCells, displayMap, symbolIds, notes,
  validationErrors, noteHighlightCells, noteHighlightSymbol, onCellClick,
}: GridProps) {
  return (
    <div role="grid" aria-label="Sudoku grid" className="grid grid-cols-9 border-2 border-slate-700 w-full max-w-[500px] mx-auto rounded-xl overflow-hidden shadow-lg shadow-slate-300/50">
      {Array.from({ length: GRID_SIZE }, (_, r) =>
        Array.from({ length: GRID_SIZE }, (_, c) => {
          const borderR = (r + 1) % BOX_SIZE === 0 && r < GRID_SIZE - 1 ? 'border-b-2 border-b-slate-800' : 'border-b border-b-slate-300';
          const borderC = (c + 1) % BOX_SIZE === 0 && c < GRID_SIZE - 1 ? 'border-r-2 border-r-slate-800' : 'border-r border-r-slate-300';
          const isHighlighted = highlightSymbol != null && playerGrid[r][c] === highlightSymbol;

          return (
            <div key={`${r}-${c}`} className={`${borderR} ${borderC}`}>
              <Cell
                symbolId={playerGrid[r][c]}
                isGiven={givenMask[r][c]}
                hasError={errors[r]?.[c] ?? false}
                isSelected={selectedCell?.[0] === r && selectedCell?.[1] === c}
                isHighlighted={isHighlighted}
                isWordCell={wordCells.has(`${r},${c}`)}
                isCorrectWordCell={correctWordCells.has(`${r},${c}`)}
                isWordHint={wordHintCells.has(`${r},${c}`)}
                displayMap={displayMap}
                hasValidationError={validationErrors[r]?.[c] ?? false}
                notes={notes[r][c]}
                isNoteHighlighted={noteHighlightCells.has(`${r},${c}`)}
                noteHighlightSymbol={noteHighlightSymbol}
                symbolIds={symbolIds}
                onClick={() => onCellClick(r, c)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
