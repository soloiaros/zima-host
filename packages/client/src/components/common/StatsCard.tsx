import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  iconColor?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  subtext,
  iconColor = 'text-surface-400',
}: StatsCardProps) {
  return (
    <div className="card relative overflow-hidden flex flex-col justify-between group hover:border-surface-600/80 transition-all">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-surface-400 tracking-tight">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${iconColor} transition-transform group-hover:scale-105`} />
      </div>

      <div className="mt-3">
        <div className="text-2xl font-semibold tracking-tight text-surface-100 font-mono tabular-nums">
          {value}
        </div>
        {subtext && (
          <div className="text-[11px] text-surface-400 mt-1 flex items-center gap-1 font-mono">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
