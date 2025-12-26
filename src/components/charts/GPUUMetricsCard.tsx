"use client";

import { Card, CardContent, Typography, Box, Grid, LinearProgress } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";

interface GPUMetricsCardProps {
  metrics: {
    gpuUsage?: number;
    gpuMemoryUsed?: number;
    gpuMemoryTotal?: number;
    gpuTemperature?: number;
    gpuName?: string;
  };
  isDark: boolean;
}

export function GPUMetricsCard({ metrics, isDark }: GPUMetricsCardProps) {
  const cardStyle = {
    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
  };

  const infoBoxStyle = {
    p: 2,
    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
    borderRadius: 2,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
  };

  if (!metrics || (metrics.gpuUsage === undefined && metrics.gpuName === undefined)) {
    return (
      <Card sx={cardStyle}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            GPU Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No GPU data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={cardStyle}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          GPU Information
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={infoBoxStyle}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                GPU Name
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {metrics.gpuName || 'No GPU detected'}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={infoBoxStyle}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Temperature
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {metrics.gpuTemperature !== undefined ? `${metrics.gpuTemperature.toFixed(0)}°C` : 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 2 }}>
          GPU Performance
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={infoBoxStyle}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                GPU Utilization
              </Typography>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                {metrics.gpuUsage !== undefined ? `${metrics.gpuUsage.toFixed(1)}%` : 'N/A'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.gpuUsage || 0}
                color="info"
                sx={{ height: '8px', borderRadius: '4px' }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={infoBoxStyle}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Memory Usage
              </Typography>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                {metrics.gpuMemoryUsed !== undefined && metrics.gpuMemoryTotal !== undefined
                  ? `${metrics.gpuMemoryUsed.toFixed(1)} / ${metrics.gpuMemoryTotal.toFixed(1)} GB`
                  : 'N/A'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(metrics.gpuMemoryUsed || 0) / (metrics.gpuMemoryTotal || 1) * 100}
                color="warning"
                sx={{ height: '8px', borderRadius: '4px' }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export function GPUUMetricsCard({ metrics, isDark }: GPUMetricsCardProps) {
  return <GPUMetricsCard metrics={metrics} isDark={isDark} />;
}
