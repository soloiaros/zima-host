import type { ProjectStatus } from '@zima-host/shared';

const statusConfig: Record<
  ProjectStatus,
  {
    dotClass: string;
    pillClass: string;
    label: string;
    ping?: boolean;
  }
> = {
  running: {
    dotClass: 'bg-emerald-400',
    pillClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    label: 'Running',
    ping: true,
  },
  stopped: {
    dotClass: 'bg-zinc-400',
    pillClass: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
    label: 'Stopped',
  },
  building: {
    dotClass: 'bg-amber-400',
    pillClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    label: 'Building',
    ping: true,
  },
  error: {
    dotClass: 'bg-rose-400',
    pillClass: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    label: 'Error',
  },
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

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-mono uppercase tracking-wider select-none ${
        config.pillClass
      } ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.ping && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotClass}`}
        />
      </span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
