"use client";

import { Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { memo, useMemo } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";

interface MonitoringMetricsProps {
  metrics: any;
  refreshTime: string;
  loading: boolean;
  error: string | null;
}

const MonitoringMetrics = memo(function MonitoringMetrics({
  metrics,
  refreshTime,
  loading,
  error
}: MonitoringMetricsProps) {
  // Memoize model metrics calculations
  const modelMetrics = useMemo(() => {
    if (!metrics?.models) return null;

    const runningModels = metrics.models.filter((m: any) => m.status === "running");
    const totalMemory = metrics.models.reduce((sum: number, m: any) => sum + (m.memory as number), 0);
    const totalRequests = metrics.models.reduce((sum: number, m: any) => sum + (m.requests as number), 0);

    return {
      runningCount: runningModels.length,
      totalMemory: totalMemory.toFixed(1),
      totalRequests: totalRequests.toString()
    };
  }, [metrics?.models]);

  // Memoize uptime format
  const formattedUptime = useMemo(() => {
    if (!metrics?.system?.uptime) return "0h 0m";
    const uptime = metrics.system.uptime;
    return `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
  }, [metrics?.system?.uptime]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <Typography>Loading metrics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ color: "error.main", display: "flex", justifyContent: "center", py: 4 }}>
        {error}
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ color: "error.main", display: "flex", justifyContent: "center", py: 4 }}>
        No monitoring data available
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, mb: 6 }}>
      {/* System Metrics */}
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
              <TableCell>{formattedUptime}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      {/* Model Performance */}
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
              <TableCell>{modelMetrics?.runningCount ?? 0}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total Memory</TableCell>
              <TableCell>{`${modelMetrics?.totalMemory ?? "0"} GB`}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total Requests</TableCell>
              <TableCell>{modelMetrics?.totalRequests ?? "0"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Uptime</TableCell>
              <TableCell>{formattedUptime}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      {/* Connection Status */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        <Box component="section" sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Last update: {refreshTime}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
});

MonitoringMetrics.displayName = "MonitoringMetrics";

export { MonitoringMetrics };
