import type { Symbol, SymbolId } from '../lib/types';
import { SUBSCRIPT_DIGITS } from '../lib/constants';

export function wordToSymbols(word: string): Symbol[] {
  const letters = word.toLowerCase().split('');
  const counts: Record<string, number> = {};
  for (const l of letters) {
    counts[l] = (counts[l] || 0) + 1;
  }

  const seen: Record<string, number> = {};
  return letters.map((letter) => {
    seen[letter] = (seen[letter] || 0) + 1;
    return {
      letter,
      occurrence: seen[letter],
      totalCount: counts[letter],
    };
  });
}

export function symbolToId(sym: Symbol): SymbolId {
  if (sym.totalCount === 1) return sym.letter;
  return `${sym.letter}_${sym.occurrence}`;
}

export function symbolDisplay(sym: Symbol): string {
  if (sym.totalCount === 1) return sym.letter;
  return `${sym.letter}${SUBSCRIPT_DIGITS[sym.occurrence]}`;
}

export function buildSymbolDisplayMap(symbols: Symbol[]): Map<SymbolId, string> {
  const map = new Map<SymbolId, string>();
  for (const sym of symbols) {
    map.set(symbolToId(sym), symbolDisplay(sym));
  }
  return map;
}

export function symbolIdToDisplay(id: SymbolId, symbols: Symbol[]): string {
  const sym = symbols.find((s) => symbolToId(s) === id);
  return sym ? symbolDisplay(sym) : id;
}

export function getSymbolIds(symbols: Symbol[]): SymbolId[] {
  return symbols.map(symbolToId);
}
