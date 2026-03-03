import { useState, useEffect, useRef } from 'react';

interface GameOverModalProps {
  status: 'won' | 'lost';
  word: string;
  elapsed: number;
  guessCount: number;
  dayIndex: number;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function buildShareText(status: 'won' | 'lost', dayIndex: number, elapsed: number, guessCount: number): string {
  const lines = [`Woku #${dayIndex + 1}`];
  if (status === 'won') {
    lines.push(`Solved in ${formatTime(elapsed)}${guessCount > 0 ? ` (${guessCount} guess)` : ''}`);
  } else {
    lines.push('Did not solve');
  }
  lines.push('');
  lines.push(`Play at ${window.location.origin}/projects/woku/`);
  return lines.join('\n');
}

export function GameOverModal({ status, word, elapsed, guessCount, dayIndex, onClose }: GameOverModalProps) {
  const [countdown, setCountdown] = useState(getSecondsUntilMidnight);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    shareRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = async () => {
    const text = buildShareText(status, dayIndex, elapsed, guessCount);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: try share API
      if (navigator.share) {
        navigator.share({ text }).catch(() => {});
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="game-over-title" className="text-2xl font-bold">
          {status === 'won' ? 'You Won!' : 'Game Over'}
        </h2>
        <p className="text-slate-600">
          The word was{' '}
          <span className="font-bold text-slate-800 uppercase tracking-wider">{word}</span>
        </p>
        {status === 'won' && (
          <p className="text-sm text-slate-500">
            Solved in {formatTime(elapsed)}
            {guessCount > 0
              ? ` with ${guessCount} guess${guessCount !== 1 ? 'es' : ''}`
              : ' — no guesses needed!'}
          </p>
        )}

        <button
          ref={shareRef}
          onClick={handleShare}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          {copied ? 'Copied!' : 'Share Result'}
        </button>

        <div className="pt-2">
          <p className="text-xs text-slate-400">Next puzzle in</p>
          <p className="text-lg font-mono font-semibold text-slate-700 tabular-nums">
            {formatCountdown(countdown)}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
