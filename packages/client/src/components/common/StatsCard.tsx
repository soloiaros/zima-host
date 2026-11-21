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
  iconColor = 'text-zima-400',
}: StatsCardProps) {
  return (
    <div className="card flex items-start gap-4">
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-surface-700/50 ${iconColor}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-surface-400">{label}</p>
        <p className="text-2xl font-bold text-surface-100">{value}</p>
        {subtext && (
          <p className="text-xs text-surface-500 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}
