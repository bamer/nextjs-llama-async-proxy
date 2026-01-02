'use client';

import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import { useMemo } from 'react';

interface MetricsData {
  system: {
    cpu: { usage: number };
    memory: { used: number };
    disk: { used: number };
    network: { rx: number; tx: number };
    uptime: number;
  };
  models: Array<{
    status: string;
    memory: number;
    requests: number;
  }>;
}

interface MonitoringChartsProps {
  metrics: MetricsData;
}

export const MonitoringChartsTable = ({ metrics }: MonitoringChartsProps) => {
  const modelMetrics = useMemo(() => {
    const runningModels = metrics.models.filter((m) => m.status === 'running');
    const totalMemory = metrics.models.reduce((sum: number, m) => sum + (m.memory), 0);
    const totalRequests = metrics.models.reduce((sum: number, m) => sum + (m.requests), 0);

    return {
      runningCount: runningModels.length,
      totalMemory: totalMemory.toFixed(1),
      totalRequests: totalRequests.toString()
    };
  }, [metrics.models]);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, mb: 6 }}>
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
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
              <TableCell>{`${metrics.system.cpu.usage.toFixed(1)}%`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Memory Used</TableCell>
              <TableCell>{`${metrics.system.memory.used} GB`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Disk Usage</TableCell>
              <TableCell>{`${metrics.system.disk.used} GB`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Network RX</TableCell>
              <TableCell>{`${(metrics.system.network.rx / 1000000).toFixed(2)} MB`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Network TX</TableCell>
              <TableCell>{`${(metrics.system.network.tx / 1000000).toFixed(2)} MB`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Uptime</TableCell>
              <TableCell>{`${Math.floor(metrics.system.uptime / 3600)}h ${Math.floor((metrics.system.uptime % 3600) / 60)}m`}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
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
    </Box>
  );
};
