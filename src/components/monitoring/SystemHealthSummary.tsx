"use client";

import { Card, CardContent, Typography, Box, Grid, Divider } from "@mui/material";
import { Timer, NetworkCheck, CheckCircle, Warning, Info } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import type { SystemMetrics } from "@/types/monitoring";

interface SystemHealthSummaryProps {
  metrics: SystemMetrics | null;
  formatUptime: (seconds: number) => string;
}

export function SystemHealthSummary({ metrics, formatUptime }: SystemHealthSummaryProps) {
  const { isDark } = useTheme();

  return (
    <Card sx={{
      background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
      boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.1)'
    }}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" mb={3}>
          System Health Summary
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Timer color="success" sx={{ mr: 1, fontSize: '1.5rem' }} />
              <Typography variant="subtitle1" fontWeight="medium">System Uptime</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="success.main" mb={2}>
              {formatUptime(metrics?.uptime ?? 0)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="body2" color="text.secondary">
                System is running smoothly
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NetworkCheck color="info" sx={{ mr: 1, fontSize: '1.5rem' }} />
              <Typography variant="subtitle1" fontWeight="medium">Network Status</Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color="info.main" mb={2}>
              {((metrics?.network?.rx ?? 0) + (metrics?.network?.tx ?? 0)).toFixed(1)} MB/s
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="info" />
              <Typography variant="body2" color="text.secondary">
                RX: {(metrics?.network?.rx ?? 0).toFixed(1)} MB/s, TX: {(metrics?.network?.tx ?? 0).toFixed(1)} MB/s
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

        {/* Health Indicators */}
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Health Indicators
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {metrics?.memory?.used && (metrics.memory.used > 85) ? <Warning color="error" /> : <CheckCircle color="success" />}
              <Typography variant="body2">Memory: {metrics?.memory?.used ?? 0}%</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {metrics?.cpu?.usage && (metrics.cpu.usage > 90) ? <Warning color="error" /> : <CheckCircle color="success" />}
              <Typography variant="body2">CPU: {metrics?.cpu?.usage ?? 0}%</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {metrics?.disk?.used && (metrics.disk.used > 95) ? <Warning color="error" /> : <CheckCircle color="success" />}
              <Typography variant="body2">Disk: {metrics?.disk?.used ?? 0}%</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="body2">System: Healthy</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}