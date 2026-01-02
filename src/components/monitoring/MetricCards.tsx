"use client";

import { Card, CardContent, Typography, Box, Grid, LinearProgress, Chip } from "@mui/material";
import { Memory, Computer, Storage, NetworkCheck } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import type { SystemMetrics } from "@/types/monitoring";

interface MetricCardsProps {
  metrics: SystemMetrics | null;
  getStatusColor: (value: number, threshold?: number) => string;
}

export function MetricCards({ metrics, getStatusColor }: MetricCardsProps) {
  const { isDark } = useTheme();

  const cardSx = {
    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
  };

  return (
    <Grid container spacing={3} mb={4}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={cardSx}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Memory color="primary" sx={{ mr: 1, fontSize: '2rem' }} />
              <Typography variant="h6" fontWeight="bold">Memory Usage</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" mb={1}>
              {metrics?.memory?.used ?? 0}%
            </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics?.memory?.used ?? 0}
                  color={getStatusColor(metrics?.memory?.used ?? 0, 85) as "error" | "warning" | "success"}
                  sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
                />
                <Chip
                  label={(metrics?.memory?.used ?? 0) > 85 ? 'High' : (metrics?.memory?.used ?? 0) > 70 ? 'Medium' : 'Normal'}
                  color={getStatusColor(metrics?.memory?.used ?? 0, 85) as "error" | "warning" | "success"}
                  size="small"
                />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={cardSx}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Computer color="secondary" sx={{ mr: 1, fontSize: '2rem' }} />
              <Typography variant="h6" fontWeight="bold">CPU Usage</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" mb={1}>
              {metrics?.cpu?.usage ?? 0}%
            </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics?.cpu?.usage ?? 0}
                  color={getStatusColor(metrics?.cpu?.usage ?? 0, 90) as "error" | "warning" | "success"}
                  sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
                />
                <Chip
                  label={(metrics?.cpu?.usage ?? 0) > 90 ? 'High' : (metrics?.cpu?.usage ?? 0) > 60 ? 'Medium' : 'Normal'}
                  color={getStatusColor(metrics?.cpu?.usage ?? 0, 90) as "error" | "warning" | "success"}
                  size="small"
                />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={cardSx}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Storage color="success" sx={{ mr: 1, fontSize: '2rem' }} />
              <Typography variant="h6" fontWeight="bold">Disk Usage</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" mb={1}>
              {metrics?.disk?.used ?? 0}%
            </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics?.disk?.used ?? 0}
                  color={getStatusColor(metrics?.disk?.used ?? 0, 95) as "error" | "warning" | "success"}
                  sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
                />
                <Chip
                  label={(metrics?.disk?.used ?? 0) > 95 ? 'Critical' : (metrics?.disk?.used ?? 0) > 80 ? 'High' : 'Normal'}
                  color={getStatusColor(metrics?.disk?.used ?? 0, 95) as "error" | "warning" | "success"}
                  size="small"
                />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={cardSx}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <NetworkCheck color="info" sx={{ mr: 1, fontSize: '2rem' }} />
              <Typography variant="h6" fontWeight="bold">Network RX</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold" mb={1}>
              {(metrics?.network?.rx ?? 0).toFixed(1)} MB/s
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, ((metrics?.network?.rx ?? 0) / 1000) * 100)}
              color="info"
              sx={{ height: '8px', borderRadius: '4px', mb: 1 }}
            />
            <Chip
              label="Network throughput"
              color="info"
              size="small"
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}