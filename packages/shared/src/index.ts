// ─── Project Types ───────────────────────────────────────────────

export type ProjectType = 'static' | 'node';
export type ProjectSourceType = 'git' | 'upload';
export type ProjectStatus = 'running' | 'stopped' | 'building' | 'error';

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  sourceType: ProjectSourceType;
  sourceUrl?: string;
  branch?: string;
  port?: number;
  containerId?: string;
  status: ProjectStatus;
  envVars?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  type: ProjectType;
  sourceType: ProjectSourceType;
  sourceUrl?: string;
  branch?: string;
  envVars?: Record<string, string>;
}

export interface UpdateProjectRequest {
  name?: string;
  envVars?: Record<string, string>;
  branch?: string;
}

// ─── Domain Types ────────────────────────────────────────────────

export interface Domain {
  id: string;
  projectId: string;
  domain: string;
  sslEnabled: boolean;
  createdAt: string;
}

export interface CreateDomainRequest {
  projectId: string;
  domain: string;
  sslEnabled?: boolean;
}

// ─── System Types ────────────────────────────────────────────────

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

export interface ContainerStats {
  containerId: string;
  name: string;
  cpu: number;
  memory: {
    used: number;
    limit: number;
  };
  network: {
    rx: number;
    tx: number;
  };
}

// ─── API Response Types ──────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ─── Container Log Types ─────────────────────────────────────────

export interface LogEntry {
  timestamp: string;
  stream: 'stdout' | 'stderr';
  message: string;
}

// ─── WebSocket Event Types ───────────────────────────────────────

export type WsEventType =
  | 'project:status'
  | 'project:logs'
  | 'project:build'
  | 'system:stats'
  | 'container:stats';

export interface WsMessage<T = unknown> {
  event: WsEventType;
  data: T;
  timestamp: string;
}
