interface ProgressBarProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow';
  showLabel?: boolean;
}

const colorMap = {
  blue: 'bg-zima-600',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export default function ProgressBar({
  value,
  size = 'md',
  color = 'blue',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-1 items-center gap-2">
      <div className={`flex-1 rounded-full bg-surface-700 ${sizeMap[size]}`}>
        <div
          className={`${sizeMap[size]} rounded-full ${colorMap[color]} transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-surface-400 w-9 text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
