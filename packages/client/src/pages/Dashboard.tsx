import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  PlayCircle,
  StopCircle,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  ArrowRight,
  Plus,
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
      // Keep last 15 points
      return next.slice(-15);
    });
  }, [stats]);

  const totalProjects = projects.length;
  const runningProjects = projects.filter((p) => p.status === 'running').length;
  const stoppedProjects = projects.filter((p) => p.status === 'stopped').length;
  const recentProjects = [...projects].slice(0, 5);

  const getDomainForProject = (projectId: string) => {
    const found = domains.find((d) => d.projectId === projectId);
    return found ? found.domain : undefined;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Dashboard</h1>
          <p className="text-sm text-surface-400 mt-1">
            Overview of your hosted applications and server resources
          </p>
        </div>
        <Link
          to="/projects/new"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={FolderKanban}
          label="Total Projects"
          value={projectsLoading ? '...' : totalProjects}
          subtext={`${runningProjects} active`}
          iconColor="text-zima-400"
        />
        <StatsCard
          icon={PlayCircle}
          label="Running"
          value={projectsLoading ? '...' : runningProjects}
          subtext="Healthy containers"
          iconColor="text-green-400"
        />
        <StatsCard
          icon={StopCircle}
          label="Stopped"
          value={projectsLoading ? '...' : stoppedProjects}
          subtext="Offline or paused"
          iconColor="text-surface-400"
        />
        <StatsCard
          icon={Clock}
          label="System Uptime"
          value={stats ? formatUptime(stats.uptime) : '...'}
          subtext="Since last boot"
          iconColor="text-yellow-400"
        />
      </div>

      {/* System Resources Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1 space-y-5">
          <h2 className="text-base font-semibold text-surface-100">
            System Resources
          </h2>

          <div className="space-y-4">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-surface-300">
                  <Cpu className="h-4 w-4 text-zima-400" />
                  CPU Usage
                </span>
                <span className="font-semibold text-surface-200">
                  {stats ? `${Math.round(stats.cpu.usage)}%` : '...'}
                </span>
              </div>
              <ProgressBar
                value={stats?.cpu.usage ?? 0}
                color={stats && stats.cpu.usage > 80 ? 'red' : 'blue'}
              />
              <p className="text-xs text-surface-500">
                {stats?.cpu.cores ?? 1} Cores available
              </p>
            </div>

            {/* Memory */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-surface-300">
                  <MemoryStick className="h-4 w-4 text-green-400" />
                  Memory Usage
                </span>
                <span className="font-semibold text-surface-200">
                  {stats ? `${Math.round(stats.memory.percentage)}%` : '...'}
                </span>
              </div>
              <ProgressBar
                value={stats?.memory.percentage ?? 0}
                color={stats && stats.memory.percentage > 85 ? 'red' : 'green'}
              />
              <p className="text-xs text-surface-500">
                {stats
                  ? `${formatBytes(stats.memory.used)} / ${formatBytes(
                      stats.memory.total,
                    )}`
                  : '...'}
              </p>
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-surface-300">
                  <HardDrive className="h-4 w-4 text-yellow-400" />
                  Disk Usage
                </span>
                <span className="font-semibold text-surface-200">
                  {stats ? `${Math.round(stats.disk.percentage)}%` : '...'}
                </span>
              </div>
              <ProgressBar
                value={stats?.disk.percentage ?? 0}
                color={stats && stats.disk.percentage > 90 ? 'red' : 'yellow'}
              />
              <p className="text-xs text-surface-500">
                {stats
                  ? `${formatBytes(stats.disk.used)} / ${formatBytes(
                      stats.disk.total,
                    )}`
                  : '...'}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Sparkline / Area Chart */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-surface-100">
                Resource Activity
              </h2>
              <p className="text-xs text-surface-400 mt-0.5">
                Real-time CPU and Memory utilization trends
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-surface-300">
                <span className="h-2.5 w-2.5 rounded-full bg-zima-500" />
                CPU (%)
              </span>
              <span className="flex items-center gap-1.5 text-surface-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Memory (%)
              </span>
            </div>
          </div>

          <div className="h-48 w-full">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={history}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#338dff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#338dff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#475569"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    name="CPU"
                    stroke="#338dff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#cpuGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    name="Memory"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#memGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-surface-500">
                Collecting real-time metrics...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-100">
            Recent Projects
          </h2>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-zima-400 hover:text-zima-300 transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentProjects.length === 0 && !projectsLoading ? (
          <div className="card">
            <EmptyState
              title="No projects yet"
              description="Deploy your first website or Node.js application in seconds."
              action={
                <Link to="/projects/new" className="btn-primary inline-flex text-sm">
                  Create Project
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => {
              const domain = getDomainForProject(project.id);
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="card hover:border-surface-600 transition-colors duration-150 group block"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-surface-100 group-hover:text-zima-400 transition-colors">
                        {project.name}
                      </h3>
                      {domain ? (
                        <p className="text-xs text-zima-400 mt-1">{domain}</p>
                      ) : (
                        <p className="text-xs text-surface-500 mt-1">
                          Port {project.port ?? 'N/A'}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={project.status} size="sm" />
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-surface-700/50">
                    <Badge variant={project.type === 'node' ? 'purple' : 'blue'}>
                      {project.type === 'node' ? 'Node.js' : 'Static Site'}
                    </Badge>
                    <span className="text-xs text-surface-500 capitalize">
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
