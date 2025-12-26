"use client";

import { Card, CardContent, Typography, Box, Grid, Chip, LinearProgress } from "@mui/material";
import { Memory, Computer, Storage, Speed, Router } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

interface SystemStatusCardProps {
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    uptime?: number;
    totalRequests?: number;
    avgResponseTime?: number;
  } | undefined;
  isDark: boolean;
}

export function SystemStatusCard({ metrics, isDark }: SystemStatusCardProps) {
  const getStatusColor = (value: number, threshold: number = 80): string => {
    if (value > threshold) return 'error';
    if (value > threshold * 0.7) return 'warning';
    return 'success';
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const statusItems = [
    {
      icon: <Computer />,
      label: 'CPU Usage',
      value: metrics?.cpuUsage || 0,
      unit: '%',
      threshold: 90,
      color: getStatusColor(metrics?.cpuUsage || 0, 90),
    },
    {
      icon: <Memory />,
      label: 'Memory Usage',
      value: metrics?.memoryUsage || 0,
      unit: '%',
      threshold: 85,
      color: getStatusColor(metrics?.memoryUsage || 0, 85),
    },
    {
      icon: <Storage />,
      label: 'Disk Usage',
      value: metrics?.diskUsage || 0,
      unit: '%',
      threshold: 95,
      color: getStatusColor(metrics?.diskUsage || 0, 95),
    },
  ];

  return (
    <Card sx={{
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      height: '100%',
    }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          System Status
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {statusItems.map((item, index) => (
            <Grid size={{ xs: 12, sm: 4 }} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  {item.icon}
                  <Typography variant="body2" fontWeight="medium">
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {item.value.toFixed(1)}
                    {item.unit}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={item.value}
                    color={item.color as any}
                    sx={{
                      height: '6px',
                      borderRadius: '3px',
                      mt: 1,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          pt: 2,
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        }}>
          <Chip
            icon={<Router />}
            label={`Uptime: ${formatUptime(metrics?.uptime)}`}
            color="info"
            variant="outlined"
          />
          <Chip
            icon={<Speed />}
            label={`Requests: ${metrics?.totalRequests || 0}`}
            color="info"
            variant="outlined"
          />
          <Chip
            icon={<Speed />}
            label={`Avg Response: ${metrics?.avgResponseTime || 0}ms`}
            color={metrics?.avgResponseTime && metrics.avgResponseTime < 100 ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
}
