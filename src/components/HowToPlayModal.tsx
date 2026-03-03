import { useEffect, useRef } from 'react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-md w-full text-left space-y-4 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="how-to-play-title" className="text-xl font-bold text-slate-800">How to Play</h2>

        <div className="space-y-3 text-sm text-slate-600">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Sudoku + Word Game</h3>
            <p>
              Woku is a 9x9 sudoku where the symbols are <strong>letters from a hidden 9-letter word</strong>.
              Solve the sudoku to reveal the word, or guess the word to win instantly.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Subscript Letters</h3>
            <p>
              When the word has repeated letters, subscripts tell them apart.
              For example, if the word has two E's, you'll see <span className="font-mono bg-slate-100 px-1 rounded">e&#x2081;</span> and <span className="font-mono bg-slate-100 px-1 rounded">e&#x2082;</span> as separate symbols in the grid.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-1">The Hidden Word</h3>
            <p>
              The word is hidden in one <span className="bg-violet-100 px-1 rounded">highlighted row or column</span>.
              Fill in that row/column correctly to win, or type your guess below the grid.
              You only get <strong>1 guess</strong>, so make it count!
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Controls</h3>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Click a cell, then tap a letter to place it</li>
              <li><strong>Arrow keys</strong> to navigate</li>
              <li><strong>Backspace</strong> to clear a cell</li>
              <li><strong>Shift+N</strong> to toggle pencil notes</li>
              <li><strong>Ctrl+Z</strong> to undo</li>
              <li><strong>Escape</strong> to deselect the current cell</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Tools & Penalties</h3>
            <p>
              Two optional tools add time penalties to your solve:
            </p>
            <ul className="space-y-1 ml-4 list-disc mt-1">
              <li><strong>Auto Notes</strong> fills in all possible pencil marks automatically (<span className="text-red-500 font-medium">+10:00</span> penalty)</li>
              <li><strong>Validate</strong> highlights incorrectly placed cells (<span className="text-red-500 font-medium">+1:00</span> penalty)</li>
            </ul>
          </div>
        </div>

        <button
          ref={closeRef}
          onClick={onClose}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
