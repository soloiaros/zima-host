interface ProgressBarProps {
  value: number;
  size?: 'xs' | 'sm' | 'md';
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'auto';
  showLabel?: boolean;
}

const sizeMap = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
};

export default function ProgressBar({
  value,
  size = 'sm',
  color = 'auto',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  // Auto pick color based on percentage thresholds
  const resolvedColor =
    color === 'auto'
      ? clamped >= 90
        ? 'bg-rose-500'
        : clamped >= 75
        ? 'bg-amber-500'
        : 'bg-zima-500'
      : color === 'emerald'
      ? 'bg-emerald-500'
      : color === 'amber'
      ? 'bg-amber-500'
      : color === 'rose'
      ? 'bg-rose-500'
      : 'bg-zima-500';

  return (
    <div className="flex flex-1 items-center gap-2">
      <div
        className={`flex-1 rounded-full bg-surface-750 overflow-hidden ${sizeMap[size]}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${sizeMap[size]} rounded-full ${resolvedColor} transition-all duration-300 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-mono text-surface-400 w-8 text-right tabular-nums">
          {clamped}%
        </span>
      )}
    </div>
  );
}
