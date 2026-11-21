import { useState, useEffect } from 'react';
import type { SystemStats } from '@zima-host/shared';
import { getSystemStats } from '../api/client';

export function useSystemStats(intervalMs = 5000) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const res = await getSystemStats();
        if (!mounted) return;
        if (res.success && res.data) {
          setStats(res.data);
          setError(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      }
    };

    fetchStats();
    const id = setInterval(fetchStats, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { stats, error };
}
