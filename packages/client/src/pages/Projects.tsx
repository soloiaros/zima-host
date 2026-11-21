import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Globe, Calendar, ExternalLink } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Projects</h1>
          <p className="text-sm text-surface-400 mt-1">
            Manage and monitor your self-hosted websites and services
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

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-44 animate-pulse bg-surface-800/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No projects found"
            description="You haven't created any projects yet. Deploy static sites or Node.js applications with one click."
            action={
              <Link to="/projects/new" className="btn-primary inline-flex text-sm">
                Create First Project
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const domain = getDomainForProject(project.id);

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="card flex flex-col justify-between hover:border-surface-600 transition-colors duration-150 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg text-surface-100 group-hover:text-zima-400 transition-colors truncate">
                      {project.name}
                    </h3>
                    <StatusBadge status={project.status} size="sm" />
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {domain ? (
                      <div className="flex items-center gap-1.5 text-xs text-zima-400 font-medium">
                        <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{domain}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Port {project.port ?? 'N/A'} (Internal)</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-surface-500">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-700/60 flex items-center justify-between">
                  <Badge variant={project.type === 'node' ? 'purple' : 'blue'}>
                    {project.type === 'node' ? 'Node.js' : 'Static Site'}
                  </Badge>

                  <span className="text-xs text-surface-400 flex items-center gap-1 group-hover:text-surface-200 transition-colors">
                    Manage
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
