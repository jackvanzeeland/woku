interface HeaderProps {
  elapsed: number;
  dayIndex: number;
  penalty: number;
  filledCount: number;
  onHelpClick: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Header({ elapsed, dayIndex, penalty, filledCount, onHelpClick }: HeaderProps) {
  const baseTime = elapsed - penalty;
  return (
    <div className="flex items-center justify-between w-full max-w-[500px] mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-slate-800">
        <span className="text-indigo-600">W</span>oku
        <span className="text-sm font-normal text-slate-400 ml-1">#{dayIndex + 1}</span>
      </h1>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 font-mono tabular-nums">{filledCount}/81</span>
        <button
          onClick={onHelpClick}
          className="w-7 h-7 rounded-full border border-slate-300 text-slate-500 hover:bg-slate-100 text-sm font-semibold transition-colors"
          aria-label="How to play"
        >
          ?
        </button>
        <span className="text-sm text-slate-500 font-mono tabular-nums">
          {penalty > 0 ? (
            <>{formatTime(baseTime)} <span className="text-red-400">+{formatTime(penalty)}</span></>
          ) : (
            formatTime(elapsed)
          )}
        </span>
      </div>
    </div>
  );
}
