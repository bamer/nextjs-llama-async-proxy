'use client';

import { useEffect, useState } from 'react';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  uptime: number;
  cpuCores: number;
  loadAverage?: number[];
  timestamp: number;
}

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/system/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Poll every 30 seconds as backup for WebSocket metrics
    // WebSocket provides real-time updates, this ensures data is available if WebSocket fails
    const interval = setInterval(fetchMetrics, 30000); // Changed from 2000 to 30000

    return () => clearInterval(interval);
  }, []);

  return { metrics, error, loading };
}
