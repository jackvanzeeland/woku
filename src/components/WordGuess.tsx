import { useState } from 'react';
import type { WordGuessEntry } from '../lib/types';
import { MAX_GUESSES } from '../lib/constants';

interface WordGuessProps {
  guesses: WordGuessEntry[];
  onGuess: (word: string) => void;
  isValidWord: (word: string) => boolean;
  disabled: boolean;
}

const colorMap = {
  correct: 'bg-green-500 text-white',
  present: 'bg-yellow-500 text-white',
  absent: 'bg-slate-400 text-white',
};

export function WordGuess({ guesses, onGuess, isValidWord, disabled }: WordGuessProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [pendingWord, setPendingWord] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingWord) return;
    const word = input.trim().toLowerCase();
    if (word.length !== 9) {
      setError('Word must be 9 letters');
      return;
    }
    if (!isValidWord(word)) {
      setError('Not in word list');
      return;
    }
    setError('');
    setPendingWord(word);
  };

  const confirmGuess = () => {
    if (pendingWord) {
      onGuess(pendingWord);
      setInput('');
      setPendingWord(null);
    }
  };

  const cancelGuess = () => {
    setPendingWord(null);
  };

  return (
    <div className="w-full max-w-[500px] mx-auto space-y-2">
      {/* Past guesses */}
      {guesses.map((g, i) => (
        <div key={i} className="flex gap-0.5 justify-center">
          {g.word.split('').map((letter, j) => (
            <div
              key={j}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded text-xs sm:text-sm font-bold uppercase ${colorMap[g.result[j]]}`}
            >
              {letter}
            </div>
          ))}
        </div>
      ))}

      {/* Input */}
      {!disabled && guesses.length < MAX_GUESSES && (
        <form onSubmit={handleSubmit} className="flex gap-2 justify-center items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 9));
              setError('');
            }}
            placeholder="Guess the 9-letter word"
            className="w-56 sm:w-64 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={9}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            Guess
          </button>
        </form>
      )}
      {pendingWord && (
        <div className="flex flex-col items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">
            Are you sure? This is your only guess.
          </p>
          <p className="text-lg font-bold uppercase tracking-wider text-slate-800">{pendingWord}</p>
          <div className="flex gap-2">
            <button
              onClick={confirmGuess}
              className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={cancelGuess}
              className="px-4 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-center text-red-500 text-xs">{error}</p>}
    </div>
  );
}
