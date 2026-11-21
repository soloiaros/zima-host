import { useState, useEffect, useCallback } from 'react';
import type { Project } from '@zima-host/shared';
import { listProjects } from '../api/client';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listProjects();
      if (res.success && res.data) {
        setProjects(res.data);
        setError(null);
      } else {
        setError(res.error ?? 'Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { projects, loading, error, refetch: fetch };
}
