"use client";

import { Card, CardContent, CardHeader, Typography, Box, Grid, LinearProgress, Chip } from "@mui/material";
import { useStore } from "@/lib/store";
import { Computer, Storage, Speed, NetworkCheck, Memory } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";

export function OverviewMetricsCard() {
  const metrics = useStore((state) => state.metrics);
  const models = useStore((state) => state.models);
  const { isDark } = useTheme();

  if (!metrics) {
    return null;
  }

  const getStatusColor = (value: number, threshold: number = 80) => {
    if (value > threshold) return 'error';
    if (value > threshold * 0.7) return 'warning';
    return 'success';
  };

  const loadedModel = models.find(m => m.status === 'running');

  return (
    <Card sx={{ 
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
    }}>
      <CardHeader title="System Overview" />
      <CardContent>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(13, 158, 248, 0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Computer color="primary" sx={{ fontSize: '1.25rem' }} />
                <Typography variant="subtitle2" fontWeight="medium">CPU Usage</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" mb={1}>
                {metrics.cpuUsage.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate"
                value={metrics.cpuUsage}
                color={getStatusColor(metrics.cpuUsage, 90) as any}
                sx={{ height: '6px', borderRadius: '3px', mb: 1 }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(13, 158, 248, 0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Memory color="secondary" sx={{ fontSize: '1.25rem' }} />
                <Typography variant="subtitle2" fontWeight="medium">Memory Usage</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" mb={1}>
                {metrics.memoryUsage.toFixed(1)}%
              </Typography>
              <LinearProgress 
                variant="determinate"
                value={metrics.memoryUsage}
                color={getStatusColor(metrics.memoryUsage, 85) as any}
                sx={{ height: '6px', borderRadius: '3px', mb: 1 }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(22, 163, 74, 0.1)' : 'rgba(13, 158, 248, 0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Storage color="success" sx={{ fontSize: '1.25rem' }} />
                <Typography variant="subtitle2" fontWeight="medium">Active Requests</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" mb={1}>
                {metrics.totalRequests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requests processed
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(13, 158, 248, 0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <Speed color="warning" sx={{ fontSize: '1.25rem' }} />
                <Typography variant="subtitle2" fontWeight="medium">Response Time</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold" mb={1}>
                {metrics.avgResponseTime}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(13, 158, 248, 0.05)' }}>
              <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                System Status
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label={`${metrics.cpuUsage.toFixed(1)}% CPU`} size="small" color={getStatusColor(metrics.cpuUsage, 90) as any} />
                <Chip label={`${metrics.memoryUsage.toFixed(1)}% RAM`} size="small" color={getStatusColor(metrics.memoryUsage, 85) as any} />
                <Chip label={loadedModel ? loadedModel.name : 'No Model'} size="small" color={loadedModel ? 'success' : 'default'} />
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <Box sx={{ p: 2, borderRadius: 2, background: isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(13, 158, 248, 0.05)' }}>
              <Typography variant="subtitle2" fontWeight="medium" mb={1}>
                Uptime
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {metrics.uptime > 0 ? `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m` : 'Starting...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Server running time
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
