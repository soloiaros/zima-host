import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  Settings,
  Server,
  Cpu,
  HardDrive,
  Activity,
  Layers,
} from 'lucide-react';
import { useSystemStats } from '../../hooks/useSystemStats';
import ProgressBar from '../common/ProgressBar';
import { formatBytes } from '../../utils/format';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/domains', icon: Globe, label: 'Domains' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { stats } = useSystemStats(4000);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-surface-900 border-r border-surface-700/60 shadow-xl">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-surface-700/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zima-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]">
            <Server className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-surface-100 flex items-center gap-1.5">
              Zima Host
            </span>
            <span className="text-[10px] text-surface-400 font-mono block -mt-0.5">
              ZimaBoard 2 PaaS
            </span>
          </div>
        </div>

        {/* Live Host Ping Indicator */}
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          LIVE
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 pt-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 px-2 pb-1.5">
          Navigation
        </div>
        <nav className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium tracking-tight transition-all duration-100 ${
                  isActive
                    ? 'bg-surface-800 text-surface-100 border border-surface-700/80 shadow-sm'
                    : 'text-surface-400 hover:bg-surface-850 hover:text-surface-200 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-zima-400' : 'text-surface-400'
                  }`}
                />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="flex-1" />

      {/* System Hardware Telemetry */}
      {stats && (
        <div className="m-3 p-3 rounded-lg bg-surface-850 border border-surface-700/60 shadow-inner-glow space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-surface-400 font-mono">
            <span className="flex items-center gap-1 text-surface-300 font-medium">
              <Activity className="h-3 w-3 text-zima-400" />
              Hardware
            </span>
            <span>{stats.cpu.cores} Cores</span>
          </div>

          <div className="space-y-2 pt-0.5">
            {/* CPU */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-surface-400">
                <span className="flex items-center gap-1">
                  <Cpu className="h-2.5 w-2.5" /> CPU
                </span>
                <span className="text-surface-300 tabular-nums">
                  {Math.round(stats.cpu.usage)}%
                </span>
              </div>
              <ProgressBar value={stats.cpu.usage} size="xs" color="auto" />
            </div>

            {/* RAM */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-surface-400">
                <span className="flex items-center gap-1">
                  <Layers className="h-2.5 w-2.5" /> RAM
                </span>
                <span className="text-surface-300 tabular-nums">
                  {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
                </span>
              </div>
              <ProgressBar value={stats.memory.percentage} size="xs" color="auto" />
            </div>

            {/* Disk */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-surface-400">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-2.5 w-2.5" /> Disk
                </span>
                <span className="text-surface-300 tabular-nums">
                  {Math.round(stats.disk.percentage)}%
                </span>
              </div>
              <ProgressBar value={stats.disk.percentage} size="xs" color="auto" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
