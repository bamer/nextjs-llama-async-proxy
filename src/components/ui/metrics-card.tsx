"use client";

import { Card, CardContent, CardHeader, GridLegacy, Typography, LinearProgress } from "@mui/material";
import { useStore } from "@/lib/store";
import { m } from "framer-motion";
import MemoryIcon from '@mui/icons-material/Memory';
import TimerIcon from '@mui/icons-material/Timer';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';

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
      icon: <StorageIcon color="primary" />,
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
      icon: <DnsIcon color="success" />,
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
      icon: <DeviceHubIcon color="info" />,
      label: "Total Requests",
      value: metrics.totalRequests.toString(),
      progress: Math.min(metrics.totalRequests / 1000, 100), // Cap at 1000 requests
    },
  ];

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title="System Metrics" subheader="Real-time system performance" />
      <CardContent>
        <GridLegacy container spacing={3}>
          {metricsData.map((metric, index) => (
            <GridLegacy item key={index} xs={12} sm={6} md={4}>
              <m.div
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
              </m.div>
            </GridLegacy>
          ))}
        </GridLegacy>
      </CardContent>
    </Card>
  );
}