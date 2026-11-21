import { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  Activity,
  HardDrive,
  Cpu,
  Clock,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { getSystemInfo } from '../api/client';
import { useSystemStats } from '../hooks/useSystemStats';
import { formatUptime, formatBytes } from '../utils/format';

export default function Settings() {
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({});
  const { stats } = useSystemStats();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemInfo()
      .then((res) => {
        if (res.success && res.data) {
          setSystemInfo(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Settings</h1>
        <p className="text-sm text-surface-400 mt-1">
          Server environment, proxy configuration and runtime status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-surface-700/60">
            <Server className="h-5 w-5 text-zima-400" />
            <h2 className="font-semibold text-base text-surface-100">
              System Environment
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">Hostname</span>
              <span className="text-surface-200 font-mono text-xs">
                {systemInfo.hostname || (loading ? '...' : 'zimaboard')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">Operating System</span>
              <span className="text-surface-200">
                {systemInfo.os || 'Linux (ZimaOS / CasaOS)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">Architecture</span>
              <span className="text-surface-200 font-mono text-xs">
                {systemInfo.arch || 'x64'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">Node Runtime</span>
              <span className="text-surface-200 font-mono text-xs">
                {systemInfo.nodeVersion || 'v20.x'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-400">Uptime</span>
              <span className="text-surface-200">
                {stats ? formatUptime(stats.uptime) : '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Reverse Proxy (Caddy) Status */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-700/60">
            <div className="flex items-center gap-2.5">
              <Shield className="h-5 w-5 text-green-400" />
              <h2 className="font-semibold text-base text-surface-100">
                Caddy Reverse Proxy
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full font-medium">
              <CheckCircle className="h-3.5 w-3.5" />
              Running
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">HTTP Port</span>
              <span className="font-mono text-xs text-surface-200">80</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">HTTPS Port</span>
              <span className="font-mono text-xs text-surface-200">443</span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">Admin API</span>
              <span className="font-mono text-xs text-surface-200">
                localhost:2019
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-surface-700/40">
              <span className="text-surface-400">Caddyfile Path</span>
              <span className="font-mono text-xs text-surface-200 truncate max-w-[200px]">
                ~/.zima-host/Caddyfile
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-400">Auto SSL</span>
              <span className="text-surface-200">Let's Encrypt / ZeroSSL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware & Storage Specs */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-surface-700/60">
          <HardDrive className="h-5 w-5 text-yellow-400" />
          <h2 className="font-semibold text-base text-surface-100">
            Hardware & Storage Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/60">
            <div className="flex items-center gap-2 text-surface-400 text-xs font-medium">
              <Cpu className="h-4 w-4 text-zima-400" />
              Processor Cores
            </div>
            <p className="text-xl font-bold text-surface-100 mt-2">
              {stats?.cpu.cores ?? 4} Cores
            </p>
            <p className="text-xs text-surface-500 mt-1">
              Current load: {stats ? `${Math.round(stats.cpu.usage)}%` : '...'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/60">
            <div className="flex items-center gap-2 text-surface-400 text-xs font-medium">
              <Activity className="h-4 w-4 text-green-400" />
              Total RAM
            </div>
            <p className="text-xl font-bold text-surface-100 mt-2">
              {stats ? formatBytes(stats.memory.total) : '...'}
            </p>
            <p className="text-xs text-surface-500 mt-1">
              Used: {stats ? formatBytes(stats.memory.used) : '...'} (
              {stats ? `${Math.round(stats.memory.percentage)}%` : '...'})
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-900 border border-surface-700/60">
            <div className="flex items-center gap-2 text-surface-400 text-xs font-medium">
              <HardDrive className="h-4 w-4 text-yellow-400" />
              Storage Capacity
            </div>
            <p className="text-xl font-bold text-surface-100 mt-2">
              {stats ? formatBytes(stats.disk.total) : '...'}
            </p>
            <p className="text-xs text-surface-500 mt-1">
              Free: {stats ? formatBytes(stats.disk.total - stats.disk.used) : '...'}
            </p>
          </div>
        </div>
      </div>

      {/* About Box */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-base text-surface-100">
          About Zima Host
        </h3>
        <p className="text-sm text-surface-400 leading-relaxed">
          Zima Host is an open-source, lightweight website and application hosting
          management panel designed specifically for ZimaBoard and personal home servers.
          It orchestrates Docker containers and automates Caddy reverse proxy routing with zero hassle.
        </p>
        <div className="flex items-center gap-4 pt-2 text-xs text-surface-500">
          <span>Version: 0.1.0</span>
          <span>•</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zima-400 inline-flex items-center gap-1 transition-colors"
          >
            GitHub Repository
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
