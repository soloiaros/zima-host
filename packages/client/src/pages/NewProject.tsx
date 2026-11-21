import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileCode,
  Server,
  GitBranch,
  Upload,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { createProject, deployProject } from '../api/client';
import type { ProjectType, ProjectSourceType } from '@zima-host/shared';

interface EnvVarItem {
  key: string;
  value: string;
}

export default function NewProject() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('static');
  const [sourceType, setSourceType] = useState<ProjectSourceType>('git');
  const [sourceUrl, setSourceUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [envVars, setEnvVars] = useState<EnvVarItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '' }]);
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
    setEnvVars((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const removeEnvVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name');
      return;
    }

    if (sourceType === 'git' && !sourceUrl.trim()) {
      setError('Please provide a Git repository URL');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStatusMessage('Creating project...');

      const envDict: Record<string, string> = {};
      envVars.forEach((item) => {
        if (item.key.trim()) {
          envDict[item.key.trim()] = item.value;
        }
      });

      const res = await createProject({
        name: name.trim(),
        type,
        sourceType,
        sourceUrl: sourceType === 'git' ? sourceUrl.trim() : undefined,
        branch: sourceType === 'git' ? branch.trim() || 'main' : undefined,
        envVars: Object.keys(envDict).length > 0 ? envDict : undefined,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to create project');
      }

      const created = res.data;
      setStatusMessage('Building and deploying container...');

      // Trigger deploy
      await deployProject(created.id);

      navigate(`/projects/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-200 transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="text-2xl font-bold text-surface-100">Create New Project</h1>
        <p className="text-sm text-surface-400 mt-1">
          Deploy a static website or a containerized Node.js application
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div className="card space-y-4">
          <div>
            <label className="label">Project Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. my-awesome-website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <p className="text-xs text-surface-500 mt-1">
              Used to identify your project and internal container name
            </p>
          </div>
        </div>

        {/* Project Type */}
        <div className="card space-y-3">
          <label className="label">Application Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('static')}
              className={`p-4 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                type === 'static'
                  ? 'border-zima-600 bg-zima-600/10 text-surface-100'
                  : 'border-surface-700 bg-surface-900/60 text-surface-400 hover:border-surface-600'
              }`}
            >
              <div
                className={`p-2 rounded-md ${
                  type === 'static' ? 'bg-zima-600 text-white' : 'bg-surface-800 text-surface-400'
                }`}
              >
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-surface-200">Static Website</h4>
                <p className="text-xs text-surface-400 mt-0.5">
                  HTML, CSS, JS, React/Vite builds served via fast Nginx container
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType('node')}
              className={`p-4 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                type === 'node'
                  ? 'border-zima-600 bg-zima-600/10 text-surface-100'
                  : 'border-surface-700 bg-surface-900/60 text-surface-400 hover:border-surface-600'
              }`}
            >
              <div
                className={`p-2 rounded-md ${
                  type === 'node' ? 'bg-purple-600 text-white' : 'bg-surface-800 text-surface-400'
                }`}
              >
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-surface-200">Node.js App</h4>
                <p className="text-xs text-surface-400 mt-0.5">
                  Node.js backend, Express, Next.js or fullstack service with package.json
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Source Selection */}
        <div className="card space-y-4">
          <label className="label">Deployment Source</label>
          <div className="flex rounded-lg bg-surface-900 p-1 border border-surface-700 w-fit">
            <button
              type="button"
              onClick={() => setSourceType('git')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                sourceType === 'git'
                  ? 'bg-zima-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Git Repository
            </button>
            <button
              type="button"
              onClick={() => setSourceType('upload')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                sourceType === 'upload'
                  ? 'bg-zima-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Direct Upload
            </button>
          </div>

          {sourceType === 'git' ? (
            <div className="space-y-4 pt-2">
              <div>
                <label className="label">Git Repository URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://github.com/username/repository.git"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  required={sourceType === 'git'}
                />
              </div>

              <div>
                <label className="label">Branch</label>
                <input
                  type="text"
                  className="input"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <div className="border-2 border-dashed border-surface-700 rounded-lg p-8 text-center bg-surface-900/50">
                <Upload className="h-8 w-8 text-surface-500 mx-auto mb-2" />
                <p className="text-sm text-surface-300 font-medium">
                  Upload archive or files
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  ZIP archives supported. Project files will be extracted directly into your container.
                </p>
                <button
                  type="button"
                  className="btn-secondary text-xs mt-4 inline-flex items-center gap-1.5"
                  onClick={() => alert('File upload will be processed upon project initialization')}
                >
                  Select File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Environment Variables */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-surface-200">
                Environment Variables
              </h3>
              <p className="text-xs text-surface-500">
                Variables passed directly to the container runtime
              </p>
            </div>
            <button
              type="button"
              onClick={addEnvVar}
              className="btn-secondary text-xs inline-flex items-center gap-1 py-1 px-2.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variable
            </button>
          </div>

          {envVars.length === 0 ? (
            <p className="text-xs text-surface-500 italic">
              No environment variables configured.
            </p>
          ) : (
            <div className="space-y-2">
              {envVars.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input font-mono text-xs flex-1"
                    placeholder="KEY (e.g. PORT, NODE_ENV)"
                    value={item.key}
                    onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    className="input font-mono text-xs flex-1"
                    placeholder="VALUE"
                    value={item.value}
                    onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeEnvVar(index)}
                    className="p-2 text-surface-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/projects" className="btn-secondary text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{statusMessage || 'Deploying...'}</span>
              </>
            ) : (
              'Create & Deploy Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
