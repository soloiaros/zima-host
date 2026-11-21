interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
}

const variantClasses = {
  default: 'bg-surface-800 text-surface-300 border-surface-700/80',
  blue: 'bg-zima-500/10 text-zima-300 border-zima-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  purple: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
};

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono tracking-tight border select-none ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
