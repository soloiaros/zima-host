import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { listDomains, createDomain, deleteDomain } from '../api/client';
import { useProjects } from '../hooks/useProjects';
import type { Domain } from '@zima-host/shared';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/format';

export default function Domains() {
  const { projects } = useProjects();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedProject, setSelectedProject] = useState('');
  const [domainName, setDomainName] = useState('');
  const [sslEnabled, setSslEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await listDomains();
      if (res.success && res.data) {
        setDomains(res.data);
      } else {
        setError(res.error || 'Failed to fetch domains');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching domains');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !domainName.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await createDomain({
        projectId: selectedProject,
        domain: domainName.trim(),
        sslEnabled,
      });

      if (res.success && res.data) {
        setDomains((prev) => [...prev, res.data!]);
        setDomainName('');
      } else {
        setError(res.error || 'Failed to add domain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding domain');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      const res = await deleteDomain(domainId);
      if (res.success) {
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
      } else {
        setError(res.error || 'Failed to delete domain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting domain');
    }
  };

  const getProjectName = (projectId: string) => {
    const p = projects.find((proj) => proj.id === projectId);
    return p ? p.name : projectId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Domains</h1>
        <p className="text-sm text-surface-400 mt-1">
          Manage domains and Caddy reverse proxy SSL routing
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add Domain Form at Top */}
      <div className="card space-y-4">
        <h2 className="text-base font-semibold text-surface-100">Add New Domain</h2>
        <form
          onSubmit={handleAddDomain}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        >
          <div>
            <label className="label">Target Project</label>
            <select
              className="input text-sm"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              required
            >
              <option value="">Select project...</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.type})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">Domain Name</label>
            <input
              type="text"
              className="input text-sm"
              placeholder="e.g. app.myhome.net or customsite.com"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 h-10">
            <label className="flex items-center gap-2 text-xs text-surface-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sslEnabled}
                onChange={(e) => setSslEnabled(e.target.checked)}
                className="rounded border-surface-700 bg-surface-900 text-zima-600 focus:ring-zima-600 h-4 w-4"
              />
              Auto HTTPS (SSL)
            </label>

            <button
              type="submit"
              disabled={submitting || !selectedProject || !domainName.trim()}
              className="btn-primary text-sm inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Domain
            </button>
          </div>
        </form>
      </div>

      {/* Domains Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-700/80">
          <h2 className="text-base font-semibold text-surface-100">
            Configured Domains
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-surface-500">
            Loading domains...
          </div>
        ) : domains.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Globe}
              title="No domains configured"
              description="Connect a custom domain or subdomain to route traffic through Caddy."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-900/60 text-xs uppercase tracking-wider text-surface-400 border-b border-surface-700">
                <tr>
                  <th className="px-6 py-3 font-medium">Domain</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">SSL Status</th>
                  <th className="px-6 py-3 font-medium">Added</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                {domains.map((dom) => (
                  <tr
                    key={dom.id}
                    className="hover:bg-surface-700/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <a
                        href={`${dom.sslEnabled ? 'https' : 'http'}://${dom.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-surface-100 hover:text-zima-400 inline-flex items-center gap-1.5"
                      >
                        <Globe className="h-4 w-4 text-zima-500 flex-shrink-0" />
                        {dom.domain}
                        <ExternalLink className="h-3 w-3 text-surface-500" />
                      </a>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        to={`/projects/${dom.projectId}`}
                        className="text-surface-300 hover:text-zima-400 transition-colors font-medium"
                      >
                        {getProjectName(dom.projectId)}
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      {dom.sslEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full font-medium">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-surface-400 bg-surface-700/60 px-2.5 py-0.5 rounded-full font-medium">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          HTTP Only
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-surface-400">
                      {formatDate(dom.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteDomain(dom.id)}
                        className="p-1.5 text-surface-500 hover:text-red-400 transition-colors rounded hover:bg-surface-700"
                        title="Delete domain"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
