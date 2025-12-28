'use client';

import { useState, useEffect, useMemo, useEffectEvent as ReactUseEffectEvent } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useWebSocket } from "@/hooks/use-websocket";
import type { MonitoringEntry } from '@/types/monitoring';

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
    // Check if metrics are already available
    if (metrics) {
      setLoading(false);
      setError(null);
      return;
    }

    // Fetch metrics data
    fetchMonitoringData();

    // Set up polling interval
    const interval = setInterval(fetchMonitoringData, 30000);

    // Fallback timeout in case data never arrives
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

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-foreground';
    }
  };

  // Memoize model metrics calculations to prevent unnecessary re-renders
  const modelMetrics = useMemo(() => {
    const runningModels = metrics.models.filter((m: any) => m.status === 'running');
    const totalMemory = metrics.models.reduce((sum: number, m: any) => sum + (m.memory as number), 0);
    const totalRequests = metrics.models.reduce((sum: number, m: any) => sum + (m.requests as number), 0);

    return {
      runningCount: runningModels.length,
      totalMemory: totalMemory.toFixed(1),
      totalRequests: totalRequests.toString()
    };
  }, [metrics.models]);

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


      <Box sx={{ display: 'grid', gridTemplateColumns: '1 fr 1 fr 1 fr', gap: 6, mb: 6 }}>
        {/* System Metrics */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }} 
          >
            <Typography variant="h6" gutterBottom>
              System Metrics
            </Typography>
            <Table sx={{ minWidth: 0 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>CPU Usage</TableCell>
                  <TableCell>{`${(metrics.system.cpu.usage as number).toFixed(1)}%`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Memory Used</TableCell>
                  <TableCell>{`${metrics.system.memory.used as number} GB`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Disk Usage</TableCell>
                  <TableCell>{`${metrics.system.disk.used as number} GB`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Network RX</TableCell>
                  <TableCell>{`${(metrics.system.network.rx as number / 1000000).toFixed(2)} MB`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Network TX</TableCell>
                  <TableCell>{`${(metrics.system.network.tx as number / 1000000).toFixed(2)} MB`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Uptime</TableCell>
                  <TableCell>{`${Math.floor(metrics.system.uptime / 3600)}h ${Math.floor((metrics.system.uptime % 3600) / 60)}m`}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

        {/* Model Performance */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }} 
          >
            <Typography variant="h6" gutterBottom>
              Model Performance
            </Typography>
            <Table sx={{ minWidth: 0 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Metric</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                   <TableCell>Available Models</TableCell>
                   <TableCell>{modelMetrics.runningCount}</TableCell>
                 </TableRow>
                <TableRow>
                  <TableCell>Total Memory</TableCell>
                  <TableCell>{`${modelMetrics.totalMemory} GB`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Requests</TableCell>
                  <TableCell>{modelMetrics.totalRequests}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Uptime</TableCell>
                  <TableCell>{`${Math.floor(metrics.system.uptime / 3600)}h ${Math.floor((metrics.system.uptime % 3600) / 60)}m`}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

        {/* Connection Status */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }} 
          >
            <Typography variant="h6" gutterBottom>
              Connection Status
            </Typography>
            <Box component="section" sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
              <CircularProgress
                size={20}
                variant="determinate"
                sx={{ color: isConnected ? 'success.main' : 'error.main' }}
              />
              <Chip label={isConnected ? 'Connected' : 'Disconnected'} color={isConnected ? 'success' : 'error'} size="small" />
              <Typography component="span" color="textSecondary">
                Last update: {lastUpdateTime}
              </Typography>
            </Box>
          </Paper>

        {/* Live Logs */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }} 
          >
            <Typography variant="h6" gutterBottom>
              Live Logs
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', p: 2, borderRadius: 2, backgroundColor: 'background.paper' }}>
              {logs.length === 0 ? (
                <Typography>No logs available...</Typography>
              ) : (
                logs.map((log: any, index: number) => (
                  <Box key={index} sx={{ mb: 1, display: 'flex', gap: 1 }}>
                    <Typography component="span" color={getLogLevelColor(log.level)}>
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </Typography>
                    <Typography>{log.message}</Typography>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>

    </Box>
  );
};

export default MonitoringPage;
