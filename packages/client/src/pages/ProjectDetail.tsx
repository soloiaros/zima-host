import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play,
  Square,
  RotateCw,
  Rocket,
  Trash2,
  Globe,
  Terminal,
  Settings as SettingsIcon,
  Info,
  ExternalLink,
  Plus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getProject,
  updateProject,
  deleteProject,
  deployProject,
  startProject,
  stopProject,
  restartProject,
  getProjectLogs,
  listDomains,
  createDomain,
  deleteDomain,
} from '../api/client';
import type { Project, Domain, LogEntry } from '@zima-host/shared';
import StatusBadge from '../components/common/StatusBadge';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { formatDate } from '../utils/format';

type Tab = 'overview' | 'domains' | 'logs' | 'settings';

interface EnvVarRow {
  key: string;
  value: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Domains
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [sslEnabled, setSslEnabled] = useState(true);
  const [domainSubmitting, setDomainSubmitting] = useState(false);

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Settings tab form state
  const [branch, setBranch] = useState('');
  const [envVars, setEnvVars] = useState<EnvVarRow[]>([]);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchProjectData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getProject(id);
      if (res.success && res.data) {
        setProject(res.data);
        setBranch(res.data.branch || 'main');
        if (res.data.envVars) {
          setEnvVars(
            Object.entries(res.data.envVars).map(([key, value]) => ({
              key,
              value,
            })),
          );
        } else {
          setEnvVars([]);
        }
      } else {
        setError(res.error || 'Project not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading project');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDomains = async () => {
    if (!id) return;
    try {
      const res = await listDomains();
      if (res.success && res.data) {
        setDomains(res.data.filter((d) => d.projectId === id));
      }
    } catch {
      // silent
    }
  };

  const fetchLogs = async () => {
    if (!id) return;
    try {
      setLogsLoading(true);
      const res = await getProjectLogs(id, 200);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch {
      // silent
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    fetchProjectDomains();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
      const interval = setInterval(fetchLogs, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'deploy') => {
    if (!id) return;
    try {
      setActionLoading(true);
      setError(null);
      let res;
      if (action === 'start') res = await startProject(id);
      else if (action === 'stop') res = await stopProject(id);
      else if (action === 'restart') res = await restartProject(id);
      else if (action === 'deploy') res = await deployProject(id);

      if (res?.success && res.data) {
        setProject(res.data);
      } else if (res?.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} project`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newDomain.trim()) return;
    try {
      setDomainSubmitting(true);
      const res = await createDomain({
        projectId: id,
        domain: newDomain.trim(),
        sslEnabled,
      });
      if (res.success && res.data) {
        setDomains((prev) => [...prev, res.data!]);
        setNewDomain('');
      } else {
        setError(res.error || 'Failed to add domain');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding domain');
    } finally {
      setDomainSubmitting(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      const res = await deleteDomain(domainId);
      if (res.success) {
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting domain');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      setSettingsSuccess(null);
      const envDict: Record<string, string> = {};
      envVars.forEach((ev) => {
        if (ev.key.trim()) envDict[ev.key.trim()] = ev.value;
      });

      const res = await updateProject(id, {
        branch: branch.trim() || undefined,
        envVars: envDict,
      });

      if (res.success && res.data) {
        setProject(res.data);
        setSettingsSuccess('Settings saved successfully!');
        setTimeout(() => setSettingsSuccess(null), 3500);
      } else {
        setError(res.error || 'Failed to update settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating settings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await deleteProject(id);
      if (res.success) {
        navigate('/projects');
      } else {
        setError(res.error || 'Failed to delete project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting project');
    } finally {
      setActionLoading(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded bg-surface-800 animate-pulse" />
        <div className="card h-64 animate-pulse bg-surface-800" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-surface-100">Project Not Found</h2>
        <p className="text-sm text-surface-400 mt-1">
          The requested project does not exist or was deleted.
        </p>
        <Link to="/projects" className="btn-primary inline-flex text-sm mt-4">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-100">{project.name}</h1>
            <StatusBadge status={project.status} />
            <Badge variant={project.type === 'node' ? 'purple' : 'blue'}>
              {project.type === 'node' ? 'Node.js' : 'Static Site'}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {project.status === 'running' ? (
              <button
                type="button"
                onClick={() => handleAction('stop')}
                disabled={actionLoading}
                className="btn-secondary text-xs inline-flex items-center gap-1.5 py-1.5"
              >
                <Square className="h-3.5 w-3.5 text-red-400" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleAction('start')}
                disabled={actionLoading}
                className="btn-secondary text-xs inline-flex items-center gap-1.5 py-1.5"
              >
                <Play className="h-3.5 w-3.5 text-green-400" />
                Start
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAction('restart')}
              disabled={actionLoading}
              className="btn-secondary text-xs inline-flex items-center gap-1.5 py-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Restart
            </button>

            <button
              type="button"
              onClick={() => handleAction('deploy')}
              disabled={actionLoading}
              className="btn-primary text-xs inline-flex items-center gap-1.5 py-1.5"
            >
              <Rocket className="h-3.5 w-3.5" />
              Redeploy
            </button>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="btn-ghost text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 inline-flex items-center gap-1.5 py-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-surface-700">
        <nav className="flex space-x-6">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'domains', label: 'Domains', icon: Globe },
              { id: 'logs', label: 'Logs', icon: Terminal },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ] as const
          ).map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tabId
                  ? 'border-zima-600 text-zima-400'
                  : 'border-transparent text-surface-400 hover:text-surface-200 hover:border-surface-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {tabId === 'domains' && domains.length > 0 && (
                <span className="ml-1 rounded-full bg-surface-700 px-2 py-0.5 text-xs text-surface-300">
                  {domains.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info Card */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-base text-surface-100">
                Project Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1.5 border-b border-surface-700/60">
                  <span className="text-surface-400">Project Type</span>
                  <span className="text-surface-200 capitalize">{project.type}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-700/60">
                  <span className="text-surface-400">Source Type</span>
                  <span className="text-surface-200 capitalize">
                    {project.sourceType}
                  </span>
                </div>
                {project.sourceUrl && (
                  <div className="flex justify-between py-1.5 border-b border-surface-700/60">
                    <span className="text-surface-400">Git Repository</span>
                    <a
                      href={project.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zima-400 hover:underline inline-flex items-center gap-1 max-w-xs truncate"
                    >
                      {project.sourceUrl}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {project.branch && (
                  <div className="flex justify-between py-1.5 border-b border-surface-700/60">
                    <span className="text-surface-400">Branch</span>
                    <span className="font-mono text-xs text-surface-200">
                      {project.branch}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-surface-700/60">
                  <span className="text-surface-400">Internal Port</span>
                  <span className="font-mono text-xs text-surface-200">
                    {project.port ?? 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-surface-700/60">
                  <span className="text-surface-400">Container ID</span>
                  <span className="font-mono text-xs text-surface-200 truncate max-w-[200px]">
                    {project.containerId || 'Not running'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-surface-400">Created Date</span>
                  <span className="text-surface-200">
                    {formatDate(project.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Domains preview */}
            <div className="space-y-6">
              <div className="card space-y-4">
                <h3 className="font-semibold text-base text-surface-100">
                  Public Access & Routing
                </h3>
                {domains.length > 0 ? (
                  <div className="space-y-2">
                    {domains.map((d) => (
                      <a
                        key={d.id}
                        href={`${d.sslEnabled ? 'https' : 'http'}://${d.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-900 border border-surface-700 hover:border-zima-600 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-zima-400" />
                          <span className="text-sm font-medium text-surface-200 group-hover:text-zima-400">
                            {d.domain}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.sslEnabled && (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              SSL
                            </span>
                          )}
                          <ExternalLink className="h-4 w-4 text-surface-500" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-surface-900/60 border border-surface-700 text-center">
                    <p className="text-sm text-surface-400">
                      No domains attached to this project yet.
                    </p>
                    <button
                      onClick={() => setActiveTab('domains')}
                      className="btn-secondary text-xs mt-3 inline-flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Attach Custom Domain
                    </button>
                  </div>
                )}
              </div>

              {/* Status summary */}
              <div className="card space-y-3">
                <h3 className="font-semibold text-base text-surface-100">
                  Health & Runtime Status
                </h3>
                <div className="flex items-center gap-3">
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-surface-400">
                    {project.status === 'running'
                      ? 'Service is running normally in Docker container.'
                      : project.status === 'building'
                      ? 'Building image and preparing container.'
                      : project.status === 'stopped'
                      ? 'Container is stopped. Start it to resume serving.'
                      : 'An error occurred. Check the logs tab for details.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          {/* Add domain form */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-base text-surface-100">
              Attach Domain
            </h3>
            <form
              onSubmit={handleAddDomain}
              className="flex flex-col sm:flex-row items-end gap-3"
            >
              <div className="flex-1 w-full">
                <label className="label">Domain or Subdomain</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. app.example.com or mysite.local"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={sslEnabled}
                  onChange={(e) => setSslEnabled(e.target.checked)}
                  className="rounded border-surface-700 bg-surface-900 text-zima-600 focus:ring-zima-600 h-4 w-4"
                />
                <label htmlFor="ssl" className="text-xs text-surface-300 select-none">
                  Enable SSL (Caddy HTTPS)
                </label>
              </div>

              <button
                type="submit"
                disabled={domainSubmitting || !newDomain.trim()}
                className="btn-primary text-sm whitespace-nowrap inline-flex items-center gap-1.5 w-full sm:w-auto justify-center"
              >
                <Plus className="h-4 w-4" />
                Add Domain
              </button>
            </form>
          </div>

          {/* Attached domains list */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-base text-surface-100">
              Connected Domains
            </h3>
            {domains.length === 0 ? (
              <p className="text-sm text-surface-500 py-4 text-center">
                No custom domains connected to this project.
              </p>
            ) : (
              <div className="divide-y divide-surface-700/60">
                {domains.map((dom) => (
                  <div
                    key={dom.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-zima-400" />
                      <div>
                        <a
                          href={`${dom.sslEnabled ? 'https' : 'http'}://${dom.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-sm text-surface-100 hover:text-zima-400 inline-flex items-center gap-1.5"
                        >
                          {dom.domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-surface-500">
                          Added {formatDate(dom.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {dom.sslEnabled ? (
                        <span className="text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          SSL Active
                        </span>
                      ) : (
                        <span className="text-xs text-surface-400 bg-surface-700 px-2.5 py-1 rounded-full">
                          HTTP Only
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteDomain(dom.id)}
                        className="p-1.5 text-surface-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="btn-secondary text-xs inline-flex items-center gap-1.5 py-1"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${logsLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
              <span className="text-xs text-surface-500">
                Showing last {logs.length} entries
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-surface-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-surface-700 bg-surface-900 text-zima-600 focus:ring-zima-600 h-3.5 w-3.5"
              />
              Auto-scroll
            </label>
          </div>

          <div className="bg-surface-950 border border-surface-800 rounded-lg p-4 font-mono text-xs h-[480px] overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-surface-500 italic">No logs available for container.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-surface-600 select-none flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={
                      log.stream === 'stderr'
                        ? 'text-red-400 break-all'
                        : 'text-surface-300 break-all'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsSuccess && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {settingsSuccess}
            </div>
          )}

          {/* Git Branch */}
          {project.sourceType === 'git' && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-base text-surface-100">
                Source Repository Settings
              </h3>
              <div>
                <label className="label">Branch</label>
                <input
                  type="text"
                  className="input max-w-sm"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Environment Variables */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-surface-100">
                  Environment Variables
                </h3>
                <p className="text-xs text-surface-400">
                  Container runtime environment variables
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnvVars((prev) => [...prev, { key: '', value: '' }])}
                className="btn-secondary text-xs inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variable
              </button>
            </div>

            <div className="space-y-2">
              {envVars.length === 0 ? (
                <p className="text-xs text-surface-500 italic">
                  No environment variables defined.
                </p>
              ) : (
                envVars.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="input font-mono text-xs flex-1"
                      placeholder="KEY"
                      value={item.key}
                      onChange={(e) => {
                        const copy = [...envVars];
                        copy[index].key = e.target.value;
                        setEnvVars(copy);
                      }}
                    />
                    <input
                      type="text"
                      className="input font-mono text-xs flex-1"
                      placeholder="VALUE"
                      value={item.value}
                      onChange={(e) => {
                        const copy = [...envVars];
                        copy[index].value = e.target.value;
                        setEnvVars(copy);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEnvVars((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="p-2 text-surface-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary text-sm"
            >
              Save Changes
            </button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-5 space-y-3">
            <h4 className="text-base font-semibold text-red-400">Danger Zone</h4>
            <p className="text-xs text-surface-400">
              Permanently delete this project, stopping its Docker container, removing its image and clearing all project files and domain mappings.
            </p>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="btn-danger text-xs inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Project
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Project"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteProject}
              disabled={actionLoading}
              className="btn-danger text-sm inline-flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Confirm Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-surface-300">
          Are you sure you want to delete{' '}
          <strong className="text-surface-100">{project.name}</strong>? This action
          cannot be undone. The container will be stopped and removed immediately.
        </p>
      </Modal>
    </div>
  );
}
