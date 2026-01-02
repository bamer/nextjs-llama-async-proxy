"use client";

import { useMemo } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import type { MonitoringEntry, ModelMetrics } from "@/types/monitoring";

interface MetricsSectionProps {
  metrics: MonitoringEntry;
}

const MetricsSection = ({ metrics }: MetricsSectionProps) => {
  const modelMetrics = useMemo(() => {
    const runningModels = metrics.models.filter((m: ModelMetrics) => m.status === "running");
    const totalMemory = metrics.models.reduce((sum: number, m: ModelMetrics) => sum + m.memory, 0);
    const totalRequests = metrics.models.reduce((sum: number, m: ModelMetrics) => sum + m.requests, 0);

    return {
      runningCount: runningModels.length,
      totalMemory: totalMemory.toFixed(1),
      totalRequests: totalRequests.toString()
    };
  }, [metrics.models]);

  const uptimeHours = Math.floor(metrics.system.uptime / 3600);
  const uptimeMinutes = Math.floor((metrics.system.uptime % 3600) / 60);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
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
              <TableCell>{`${uptimeHours}h ${uptimeMinutes}m`}</TableCell>
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
              <TableCell>{`${uptimeHours}h ${uptimeMinutes}m`}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default MetricsSection;
