import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  PlayCircle,
  StopCircle,
  Clock,
  Cpu,
  Layers,
  HardDrive,
  ArrowRight,
  Plus,
  Globe,
  Radio,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useProjects } from '../hooks/useProjects';
import { useSystemStats } from '../hooks/useSystemStats';
import { listDomains } from '../api/client';
import type { Domain } from '@zima-host/shared';
import StatsCard from '../components/common/StatsCard';
import StatusBadge from '../components/common/StatusBadge';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import EmptyState from '../components/common/EmptyState';
import { formatBytes, formatUptime } from '../utils/format';

interface HistoryPoint {
  time: string;
  cpu: number;
  memory: number;
}

export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { stats } = useSystemStats(3000);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    listDomains().then((res) => {
      if (res.success && res.data) {
        setDomains(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (!stats) return;
    const now = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setHistory((prev) => {
      const next = [
        ...prev,
        {
          time: now,
          cpu: Math.round(stats.cpu.usage),
          memory: Math.round(stats.memory.percentage),
        },
      ];
      return next.slice(-20);
    });
  }, [stats]);

  const totalProjects = projects.length;
  const runningProjects = projects.filter((p) => p.status === 'running').length;
  const stoppedProjects = projects.filter((p) => p.status === 'stopped').length;
  const recentProjects = [...projects].slice(0, 6);

  const getDomainForProject = (projectId: string) => {
    const found = domains.find((d) => d.projectId === projectId);
    return found ? found.domain : undefined;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-surface-700/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-surface-100">
              Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-zima-500/10 text-zima-400 border border-zima-500/20">
              Overview
            </span>
          </div>
          <p className="text-xs text-surface-400 mt-0.5 tracking-tight">
            Real-time telemetry and management for your self-hosted websites
          </p>
        </div>
        <Link
          to="/projects/new"
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Link>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatsCard
          icon={FolderKanban}
          label="Total Websites"
          value={projectsLoading ? '—' : totalProjects}
          subtext={`${runningProjects} online`}
          iconColor="text-zima-400"
        />
        <StatsCard
          icon={PlayCircle}
          label="Active Containers"
          value={projectsLoading ? '—' : runningProjects}
          subtext="Healthy state"
          iconColor="text-emerald-400"
        />
        <StatsCard
          icon={StopCircle}
          label="Offline / Stopped"
          value={projectsLoading ? '—' : stoppedProjects}
          subtext="Inactive"
          iconColor="text-surface-500"
        />
        <StatsCard
          icon={Clock}
          label="ZimaBoard Uptime"
          value={stats ? formatUptime(stats.uptime) : '—'}
          subtext="Continuous"
          iconColor="text-amber-400"
        />
      </div>

      {/* Hardware Telemetry & Real-Time Sparkline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Hardware Meters Card */}
        <div className="card lg:col-span-1 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-surface-700/60">
              <span className="text-xs font-semibold text-surface-200 tracking-tight flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-zima-400" />
                Live Resources
              </span>
              <span className="text-[10px] font-mono text-surface-500">
                {stats?.cpu.cores ?? 1} CPU Cores
              </span>
            </div>

            <div className="mt-3.5 space-y-3">
              {/* CPU */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-400 flex items-center gap-1.5 font-mono text-[11px]">
                    <Cpu className="h-3 w-3 text-zima-400" /> CPU Load
                  </span>
                  <span className="font-mono text-xs text-surface-200 tabular-nums">
                    {stats ? `${Math.round(stats.cpu.usage)}%` : '—'}
                  </span>
                </div>
                <ProgressBar
                  value={stats?.cpu.usage ?? 0}
                  color="auto"
                  size="xs"
                />
              </div>

              {/* Memory */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-400 flex items-center gap-1.5 font-mono text-[11px]">
                    <Layers className="h-3 w-3 text-emerald-400" /> Memory
                  </span>
                  <span className="font-mono text-xs text-surface-200 tabular-nums">
                    {stats ? `${Math.round(stats.memory.percentage)}%` : '—'}
                  </span>
                </div>
                <ProgressBar
                  value={stats?.memory.percentage ?? 0}
                  color="auto"
                  size="xs"
                />
                <p className="text-[10px] font-mono text-surface-500 text-right">
                  {stats
                    ? `${formatBytes(stats.memory.used)} / ${formatBytes(
                        stats.memory.total,
                      )}`
                    : '—'}
                </p>
              </div>

              {/* Disk */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-400 flex items-center gap-1.5 font-mono text-[11px]">
                    <HardDrive className="h-3 w-3 text-amber-400" /> Storage
                  </span>
                  <span className="font-mono text-xs text-surface-200 tabular-nums">
                    {stats ? `${Math.round(stats.disk.percentage)}%` : '—'}
                  </span>
                </div>
                <ProgressBar
                  value={stats?.disk.percentage ?? 0}
                  color="auto"
                  size="xs"
                />
                <p className="text-[10px] font-mono text-surface-500 text-right">
                  {stats
                    ? `${formatBytes(stats.disk.used)} / ${formatBytes(
                        stats.disk.total,
                      )}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Utilization Graph */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-surface-700/60">
            <div>
              <span className="text-xs font-semibold text-surface-200 tracking-tight">
                Activity Stream
              </span>
              <p className="text-[11px] text-surface-500 font-mono">
                Continuous 3-second polling interval
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-surface-300">
                <span className="h-2 w-2 rounded-full bg-zima-500" />
                CPU
              </span>
              <span className="flex items-center gap-1.5 text-surface-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                RAM
              </span>
            </div>
          </div>

          <div className="h-44 w-full pt-3">
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={history}
                  margin={{ top: 5, right: 8, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#3f3f46"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#3f3f46"
                    fontSize={10}
                    tickLine={false}
                    fontFamily="monospace"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121215',
                      borderColor: '#27272a',
                      borderRadius: '6px',
                      color: '#f3f4f6',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    name="CPU (%)"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#cpuGrad)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    name="RAM (%)"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#memGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-mono text-surface-500">
                Sampling system stream...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hosted Projects Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            Deployed Websites
          </span>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-xs font-medium text-zima-400 hover:text-zima-300 transition-colors"
          >
            All projects
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentProjects.length === 0 && !projectsLoading ? (
          <div className="card">
            <EmptyState
              title="No websites hosted yet"
              description="Deploy a static frontend or Node.js backend to get started."
              action={
                <Link to="/projects/new" className="btn-primary">
                  Deploy Website
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => {
              const domain = getDomainForProject(project.id);
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="card hover:border-surface-600 transition-all duration-100 group block relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm text-surface-100 group-hover:text-zima-400 transition-colors truncate">
                        {project.name}
                      </h3>
                      {domain ? (
                        <p className="text-[11px] font-mono text-zima-400 flex items-center gap-1 mt-0.5 truncate">
                          <Globe className="h-3 w-3 flex-shrink-0" />
                          {domain}
                        </p>
                      ) : (
                        <p className="text-[11px] font-mono text-surface-500 mt-0.5">
                          Port :{project.port ?? 'N/A'}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={project.status} size="sm" />
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-surface-700/50">
                    <Badge variant={project.type === 'node' ? 'purple' : 'blue'}>
                      {project.type === 'node' ? 'Node.js' : 'Static'}
                    </Badge>
                    <span className="text-[10px] font-mono text-surface-500 uppercase">
                      {project.sourceType}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
