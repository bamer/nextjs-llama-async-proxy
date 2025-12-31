"use client";

import { Card, CardContent, CardHeader, Grid, Typography, LinearProgress, Box } from "@mui/material";
import { useStore } from "@/lib/store";
import { m } from "framer-motion";
import MemoryIcon from '@mui/icons-material/Memory';
import TimerIcon from '@mui/icons-material/Timer';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import { useTheme } from "@/contexts/ThemeContext";
import type { AppStore } from "@/lib/store/types";

export function MetricsCard() {
  const metrics = useStore((state: AppStore) => state.metrics);
  const { isDark } = useTheme();

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
      value: `${metrics.cpu?.usage.toFixed(1) ?? 0}%`,
      progress: metrics.cpu?.usage ?? 0,
      color: "primary",
    },
    {
      icon: <MemoryIcon color="secondary" />,
      label: "Memory Usage",
      value: `${metrics.memory?.used.toFixed(1) ?? 0}%`,
      progress: metrics.memory?.used ?? 0,
      color: "secondary",
    },
    {
      icon: <DnsIcon color="success" />,
      label: "Disk Usage",
      value: `${metrics.disk?.used.toFixed(1) ?? 0}%`,
      progress: metrics.disk?.used ?? 0,
      color: "success",
    },
    {
      icon: <TimerIcon color="warning" />,
      label: "Uptime",
      value: `${Math.floor(metrics.uptime / 3600)}h`,
      progress: Math.min((metrics.uptime / 86400) * 100, 100),
      color: "warning",
    },
    {
      icon: <DeviceHubIcon color="info" />,
      label: "Network",
      value: `${((metrics.network?.rx ?? 0) + (metrics.network?.tx ?? 0)).toFixed(1)} MB/s`,
      progress: Math.min(((metrics.network?.rx ?? 0) / 1000) * 100, 100),
      color: "info",
    },
  ];

  return (
    <Card
      sx={{ 
        height: "100%",
        background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
      }}
    >
      <CardHeader 
        title="System Metrics"
        subheader="Real-time system performance"
        titleTypographyProps={{ fontWeight: 'bold', fontSize: '1.5rem' }}
      />
      <CardContent>
        <Grid container spacing={3}>
          {metricsData.map((metric, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    {metric.icon}
                    <Typography variant="subtitle2" ml={1} color="text.secondary" fontWeight="medium">
                      {metric.label}
                    </Typography>
                  </div>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {metric.value}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metric.progress}
                    color={metric.progress > 80 ? "error" : metric.progress > 60 ? "warning" : "primary"}
                    sx={{ 
                      mt: 1, 
                      height: "6px", 
                      borderRadius: "3px",
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    {metric.progress.toFixed(1)}%
                  </Typography>
                </Box>
              </m.div>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
