import { memo } from 'react';
import type { SymbolId } from '../lib/types';

interface CellProps {
  symbolId: SymbolId | null;
  isGiven: boolean;
  hasError: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isWordCell: boolean;
  isCorrectWordCell: boolean;
  isWordHint: boolean;
  displayMap: Map<SymbolId, string>;
  notes: SymbolId[];
  isNoteHighlighted: boolean;
  hasValidationError: boolean;
  noteHighlightSymbol: SymbolId | null;
  symbolIds: SymbolId[];
  onClick: () => void;
}

export const Cell = memo(function Cell({
  symbolId, isGiven, hasError, isSelected, isHighlighted,
  isWordCell, isCorrectWordCell, isWordHint, displayMap, notes,
  hasValidationError, isNoteHighlighted, noteHighlightSymbol, symbolIds, onClick,
}: CellProps) {
  const display = symbolId ? (displayMap.get(symbolId) ?? symbolId) : '';

  let bg = 'bg-white';
  if (isWordHint) bg = 'bg-violet-50';
  if (isGiven) bg = isWordHint ? 'bg-violet-100/60' : 'bg-stone-100';
  if (isHighlighted) bg = isGiven ? 'bg-indigo-200' : 'bg-indigo-100';
  if (isCorrectWordCell) bg = isGiven ? 'bg-emerald-200' : 'bg-emerald-100';
  if (hasError) bg = 'bg-red-100';
  if (hasValidationError) bg = 'bg-orange-200';
  if (isWordCell) bg = 'bg-amber-100';

  const ring = isSelected
    ? 'ring-2 ring-indigo-500 ring-inset'
    : isNoteHighlighted
      ? 'ring-1 ring-indigo-300 ring-inset'
      : isCorrectWordCell
        ? 'ring-1 ring-inset ring-emerald-400/50'
        : '';

  const textColor = hasValidationError
    ? 'text-orange-700'
    : hasError
    ? 'text-red-600'
    : isCorrectWordCell
      ? 'text-emerald-700'
      : isGiven
        ? 'text-slate-700'
        : 'text-indigo-600';

  const weight = isGiven ? 'font-bold' : 'font-normal';

  const showNotes = !symbolId && notes.length > 0;

  return (
    <div
      className={`flex items-center justify-center aspect-square text-sm sm:text-base select-none cursor-pointer transition-colors duration-150 hover:bg-slate-50 active:scale-95 ${bg} ${ring} ${weight} ${textColor}`}
      onClick={onClick}
    >
      {showNotes ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-px">
          {symbolIds.map((sid, idx) => {
            const hasNote = notes.includes(sid);
            const isMatch = hasNote && isNoteHighlighted && sid === noteHighlightSymbol;
            return (
              <span
                key={idx}
                className={`flex items-center justify-center text-[9px] sm:text-[10px] leading-none ${
                  isMatch ? 'text-indigo-500 font-semibold' : 'text-slate-400'
                }`}
              >
                {hasNote ? (displayMap.get(sid) ?? sid) : ''}
              </span>
            );
          })}
        </div>
      ) : (
        display
      )}
    </div>
  );
});
