'use client';

import { useState, useEffect, useEffectEvent as ReactUseEffectEvent } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useWebSocket } from "@/hooks/use-websocket";
import type { MonitoringEntry } from '@/types/monitoring';
import { MonitoringChartsTable } from './monitoring/MonitoringChartsTable';
import { MonitoringStatus } from './monitoring/MonitoringStatus';
import { MonitoringAlerts } from './monitoring/MonitoringAlerts';

const MonitoringPage = () => {
  const { isConnected } = useWebSocket();
  const [logs] = useState<any[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('Never');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoringData = ReactUseEffectEvent(async () => {
    try {
      const response = await fetch('/api/monitoring/latest');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: MonitoringEntry = await response.json();

      setMetrics(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch monitoring data:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (metrics) {
      setLoading(false);
      setError(null);
      return;
    }

    fetchMonitoringData();

    const interval = setInterval(fetchMonitoringData, 30000);

    const timer = setTimeout(() => {
      if (loading && !metrics) {
        setLoading(false);
        setError("No metrics data available. Please ensure metrics are being collected.");
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [metrics, loading, fetchMonitoringData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ color: 'error.main', display: 'flex', justifyContent: 'center', py: 4 }}>
        {error}
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ color: 'error.main', display: 'flex', justifyContent: 'center', py: 4 }}>
        No monitoring data available
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Real‑time Monitoring
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, mb: 6 }}>
        <MonitoringChartsTable metrics={metrics} />
        <MonitoringStatus isConnected={isConnected} lastUpdateTime={lastUpdateTime} />
        <MonitoringAlerts logs={logs} />
      </Box>
    </Box>
  );
};

export default MonitoringPage;
