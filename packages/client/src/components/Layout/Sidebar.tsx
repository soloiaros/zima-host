import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  Settings,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
} from 'lucide-react';
import { useSystemStats } from '../../hooks/useSystemStats';
import ProgressBar from '../common/ProgressBar';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/domains', icon: Globe, label: 'Domains' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const { stats } = useSystemStats();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-surface-900 border-r border-surface-700">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zima-600">
          <Server className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-surface-100">Zima Host</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-zima-600/15 text-zima-400'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* System Quick Stats */}
      {stats && (
        <div className="border-t border-surface-700 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            System
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Cpu className="h-3.5 w-3.5 text-surface-500 flex-shrink-0" />
              <ProgressBar
                value={stats.cpu.usage}
                size="sm"
                color={stats.cpu.usage > 80 ? 'red' : 'blue'}
              />
              <span className="text-xs text-surface-400 w-9 text-right">
                {Math.round(stats.cpu.usage)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MemoryStick className="h-3.5 w-3.5 text-surface-500 flex-shrink-0" />
              <ProgressBar
                value={stats.memory.percentage}
                size="sm"
                color={stats.memory.percentage > 80 ? 'red' : 'blue'}
              />
              <span className="text-xs text-surface-400 w-9 text-right">
                {Math.round(stats.memory.percentage)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-3.5 w-3.5 text-surface-500 flex-shrink-0" />
              <ProgressBar
                value={stats.disk.percentage}
                size="sm"
                color={stats.disk.percentage > 90 ? 'red' : 'blue'}
              />
              <span className="text-xs text-surface-400 w-9 text-right">
                {Math.round(stats.disk.percentage)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
