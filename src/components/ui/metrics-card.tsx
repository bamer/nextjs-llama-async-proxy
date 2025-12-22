"use client";

import { Card, CardContent, CardHeader, Grid, Typography, LinearProgress } from "@mui/material";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import CpuIcon from '@mui/icons-material/Cpu';
import MemoryIcon from '@mui/icons-material/Memory';
import DatabaseIcon from '@mui/icons-material/Database';
import TimerIcon from '@mui/icons-material/Timer';
import NetworkIcon from '@mui/icons-material/Network';

export function MetricsCard() {
  const metrics = useStore((state) => state.metrics);

  if (!metrics) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardHeader title="System Metrics" subheader="Real-time system performance" />
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">
            Loading metrics...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const metricsData = [
    {
      icon: <CpuIcon color="primary" />,
      label: "CPU Usage",
      value: `${metrics.cpuUsage.toFixed(1)}%`,
      progress: metrics.cpuUsage,
    },
    {
      icon: <MemoryIcon color="secondary" />,
      label: "Memory Usage",
      value: `${metrics.memoryUsage.toFixed(1)}%`,
      progress: metrics.memoryUsage,
    },
    {
      icon: <DatabaseIcon color="success" />,
      label: "Active Models",
      value: metrics.activeModels.toString(),
      progress: (metrics.activeModels / 10) * 100, // Assuming max 10 models
    },
    {
      icon: <TimerIcon color="warning" />,
      label: "Avg Response",
      value: `${metrics.avgResponseTime}ms`,
      progress: Math.min(metrics.avgResponseTime / 1000, 100), // Cap at 1000ms
    },
    {
      icon: <NetworkIcon color="info" />,
      label: "Total Requests",
      value: metrics.totalRequests.toString(),
      progress: Math.min(metrics.totalRequests / 1000, 100), // Cap at 1000 requests
    },
  ];

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="System Metrics" subheader="Real-time system performance" />
      <CardContent>
        <Grid container spacing={3}>
          {metricsData.map((metric, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                  {metric.icon}
                  <Typography variant="subtitle2" ml={1} color="text.secondary">
                    {metric.label}
                  </Typography>
                </div>
                <Typography variant="h5" fontWeight="bold">
                  {metric.value}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metric.progress}
                  color={
                    metric.progress > 80 ? "error" : metric.progress > 60 ? "warning" : "primary"
                  }
                  sx={{ mt: 1, height: "6px", borderRadius: "3px" }}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}