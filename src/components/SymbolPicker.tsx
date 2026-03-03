import type { Symbol as SymbolType, SymbolId } from '../lib/types';
import { symbolToId, symbolDisplay } from '../engine/symbols';

interface SymbolPickerProps {
  symbols: SymbolType[];
  onPick: (symbolId: SymbolId) => void;
  onClear: () => void;
  disabled: boolean;
  notesMode: boolean;
  remainingCounts?: Map<SymbolId, number>;
}

export function SymbolPicker({ symbols, onPick, onClear, disabled, notesMode, remainingCounts }: SymbolPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center max-w-[500px] mx-auto">
      {symbols.map((sym) => {
        const id = symbolToId(sym);
        const remaining = remainingCounts?.get(id) ?? null;
        const allPlaced = remaining !== null && remaining <= 0;
        return (
          <button
            key={id}
            onClick={() => onPick(id)}
            disabled={disabled || allPlaced}
            className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-medium text-sm sm:text-base transition-colors disabled:opacity-40 ${
              allPlaced
                ? 'bg-slate-100 text-slate-300 ring-1 ring-slate-200'
                : notesMode
                  ? 'bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 ring-1 ring-amber-300'
                  : 'bg-white shadow-sm hover:bg-slate-50 active:bg-slate-100 text-slate-800 ring-1 ring-slate-200'
            }`}
          >
            {symbolDisplay(sym)}
            {remaining !== null && remaining > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-200 text-[10px] text-slate-500 flex items-center justify-center font-normal">
                {remaining}
              </span>
            )}
          </button>
        );
      })}
      <button
        onClick={onClear}
        disabled={disabled}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-medium text-xs transition-colors disabled:opacity-40"
      >
        Clear
      </button>
    </div>
  );
}
