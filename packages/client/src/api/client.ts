import type {
  ApiResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  Domain,
  CreateDomainRequest,
  SystemStats,
  LogEntry,
} from '@zima-host/shared';

const BASE = '/api';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json() as Promise<ApiResponse<T>>;
}

// ─── Projects ────────────────────────────────────────────────────

export async function listProjects() {
  return request<Project[]>('/projects');
}

export async function getProject(id: string) {
  return request<Project>(`/projects/${id}`);
}

export async function createProject(data: CreateProjectRequest) {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: UpdateProjectRequest) {
  return request<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string) {
  return request<void>(`/projects/${id}`, { method: 'DELETE' });
}

export async function deployProject(id: string) {
  return request<Project>(`/projects/${id}/deploy`, { method: 'POST' });
}

export async function startProject(id: string) {
  return request<Project>(`/projects/${id}/start`, { method: 'POST' });
}

export async function stopProject(id: string) {
  return request<Project>(`/projects/${id}/stop`, { method: 'POST' });
}

export async function restartProject(id: string) {
  return request<Project>(`/projects/${id}/restart`, { method: 'POST' });
}

export async function getProjectLogs(id: string, tail = 100) {
  return request<LogEntry[]>(`/projects/${id}/logs?tail=${tail}`);
}

// ─── Domains ─────────────────────────────────────────────────────

export async function listDomains() {
  return request<Domain[]>('/domains');
}

export async function createDomain(data: CreateDomainRequest) {
  return request<Domain>('/domains', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteDomain(id: string) {
  return request<void>(`/domains/${id}`, { method: 'DELETE' });
}

// ─── System ──────────────────────────────────────────────────────

export async function getSystemStats() {
  return request<SystemStats>('/system/stats');
}

export async function getSystemInfo() {
  return request<Record<string, string>>('/system/info');
}
