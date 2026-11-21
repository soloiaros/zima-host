import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Globe,
  Search,
  LayoutGrid,
  List,
  GitBranch,
  ArrowUpRight,
  Terminal,
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { listDomains } from '../api/client';
import type { Domain } from '@zima-host/shared';
import StatusBadge from '../components/common/StatusBadge';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/format';

export default function Projects() {
  const { projects, loading, error } = useProjects();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    listDomains().then((res) => {
      if (res.success && res.data) {
        setDomains(res.data);
      }
    });
  }, []);

  const getDomainForProject = (projectId: string) => {
    const found = domains.find((d) => d.projectId === projectId);
    return found?.domain;
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (getDomainForProject(p.id) || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-surface-700/60">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-100">
            Hosted Projects
          </h1>
          <p className="text-xs text-surface-400 mt-0.5 tracking-tight">
            Manage your Dockerized web apps, ports, and attached domains
          </p>
        </div>
        <Link to="/projects/new" className="btn-primary self-start sm:self-auto">
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Filter and View Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-surface-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by project name or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Chips */}
          <div className="flex items-center bg-surface-900 border border-surface-700/60 p-0.5 rounded-md text-xs font-mono">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-surface-750 text-surface-100 font-medium'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('running')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'running'
                  ? 'bg-surface-750 text-emerald-400 font-medium'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Running
            </button>
            <button
              onClick={() => setStatusFilter('stopped')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'stopped'
                  ? 'bg-surface-750 text-surface-200 font-medium'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Stopped
            </button>
          </div>

          {/* Grid vs Table Toggle */}
          <div className="flex items-center bg-surface-900 border border-surface-700/60 p-0.5 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-surface-750 text-zima-400'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-surface-750 text-zima-400'
                  : 'text-surface-500 hover:text-surface-300'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-36 animate-pulse bg-surface-850" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card">
          <EmptyState
            title={search ? 'No projects match your filter' : 'No projects created yet'}
            description={
              search
                ? 'Try clearing your search query or filter options.'
                : 'Deploy static HTML sites or Node.js services with a single click.'
            }
            action={
              search ? (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              ) : (
                <Link to="/projects/new" className="btn-primary">
                  Deploy First Website
                </Link>
              )
            }
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const domain = getDomainForProject(project.id);

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="card flex flex-col justify-between hover:border-surface-600 transition-all duration-100 group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm text-surface-100 group-hover:text-zima-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <StatusBadge status={project.status} size="sm" />
                  </div>

                  <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                    {domain ? (
                      <div className="flex items-center gap-1.5 text-zima-400 font-medium">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{domain}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-surface-500">
                        <Globe className="h-3 w-3 flex-shrink-0" />
                        <span>Port :{project.port ?? 'N/A'}</span>
                      </div>
                    )}

                    {project.branch && (
                      <div className="flex items-center gap-1.5 text-surface-400">
                        <GitBranch className="h-3 w-3 flex-shrink-0 text-surface-500" />
                        <span className="truncate">{project.branch}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-surface-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={project.type === 'node' ? 'purple' : 'blue'}>
                      {project.type === 'node' ? 'Node.js' : 'Static'}
                    </Badge>
                    <span className="text-[10px] font-mono text-surface-500 uppercase">
                      {project.sourceType}
                    </span>
                  </div>

                  <span className="text-[11px] text-surface-500 flex items-center gap-1 group-hover:text-surface-300 transition-colors font-mono">
                    Inspect
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* High Density Table View */
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-surface-700/60 bg-surface-900/60 text-[10px] text-surface-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Project</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Type</th>
                <th className="py-2.5 px-3 font-medium">Domain / Port</th>
                <th className="py-2.5 px-3 font-medium">Source</th>
                <th className="py-2.5 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/40">
              {filteredProjects.map((project) => {
                const domain = getDomainForProject(project.id);
                return (
                  <tr
                    key={project.id}
                    className="hover:bg-surface-800/60 transition-colors group"
                  >
                    <td className="py-2.5 px-4 font-sans font-medium text-surface-100">
                      <Link
                        to={`/projects/${project.id}`}
                        className="hover:text-zima-400 transition-colors"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={project.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={project.type === 'node' ? 'purple' : 'blue'}>
                        {project.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-surface-300">
                      {domain ? (
                        <span className="text-zima-400">{domain}</span>
                      ) : (
                        <span className="text-surface-500">:{project.port ?? 'N/A'}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-surface-400 capitalize">
                      {project.branch ? `${project.sourceType} (${project.branch})` : project.sourceType}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        to={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-zima-400 hover:underline"
                      >
                        Manage
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
