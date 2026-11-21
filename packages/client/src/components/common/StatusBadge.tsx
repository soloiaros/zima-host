import type { ProjectStatus } from '@zima-host/shared';

const statusConfig: Record<ProjectStatus, { color: string; label: string }> = {
  running: { color: 'bg-green-500', label: 'Running' },
  stopped: { color: 'bg-surface-500', label: 'Stopped' },
  building: { color: 'bg-yellow-500', label: 'Building' },
  error: { color: 'bg-red-500', label: 'Error' },
};

interface StatusBadgeProps {
  status: ProjectStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function StatusBadge({
  status,
  showLabel = true,
  size = 'md',
}: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.stopped;
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${dotSize} rounded-full ${config.color} ${
          status === 'running' ? 'animate-pulse' : ''
        }`}
      />
      {showLabel && (
        <span
          className={`font-medium ${
            size === 'sm' ? 'text-xs' : 'text-sm'
          } text-surface-300`}
        >
          {config.label}
        </span>
      )}
    </span>
  );
}
