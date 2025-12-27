"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useChartHistory } from '@/hooks/useChartHistory';
import { Box, Grid, Typography, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';
import { Refresh, Settings as SettingsIcon } from '@mui/icons-material';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ModelsListCard } from '@/components/dashboard/ModelsListCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';
import { useRouter } from 'next/navigation';

export default function ModernDashboard() {
  const { isConnected, sendMessage } = useWebSocket();
  const models = useStore((state) => state.models);
  const rawMetrics = useStore((state) => state.metrics);
  const safeMetrics = rawMetrics ? rawMetrics : undefined;
  const [loading, setLoading] = useState(true);
  const chartHistory = useChartHistory();
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    sendMessage('request_metrics', {});
    sendMessage('request_models', {});

    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [sendMessage]);

  const handleRefresh = () => {
    sendMessage('request_metrics', {});
    sendMessage('request_models', {});
  };

  const handleDownloadLogs = () => {
    sendMessage('download_logs', {});
  };

  const handleRestartServer = () => {
    sendMessage('restart_server', {});
  };

  const handleStartServer = () => {
    sendMessage('start_llama_server', {});
  };

  const handleOpenSettings = () => {
    router.push('/settings');
  };

  const handleToggleModel = (modelId: string) => {
    sendMessage('toggle_model', { modelId });
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  if (loading && !safeMetrics) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
          Loading Dashboard...
        </Typography>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box data-testid="modern-dashboard" sx={{ p: 4, maxWidth: 1600, mx: 'auto' }}>
      <DashboardHeader isConnected={isConnected} metrics={safeMetrics} onRefresh={handleRefresh} />

      <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="CPU Usage"
            value={safeMetrics?.cpuUsage || 0}
            unit="%"
            icon="🖥️"
            isDark={isDark}
            threshold={90}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Memory Usage"
            value={safeMetrics?.memoryUsage || 0}
            unit="%"
            icon="💾"
            isDark={isDark}
            threshold={85}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Disk Usage"
            value={safeMetrics?.diskUsage || 0}
            unit="%"
            icon="💿"
            isDark={isDark}
            threshold={95}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Active Models"
            value={safeMetrics?.activeModels || 0}
            unit="/10"
            icon="🤖"
            isDark={isDark}
            threshold={10}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ModelsListCard
            models={models}
            isDark={isDark}
            onToggleModel={handleToggleModel}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <QuickActionsCard
            isDark={isDark}
            onRestartServer={handleRestartServer}
            onStartServer={handleStartServer}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PerformanceChart
            title="System Performance"
            description="CPU, Memory & Requests over time"
            datasets={[
              {
                dataKey: 'cpu',
                label: 'CPU %',
                colorDark: '#60a5fa',
                colorLight: '#2563eb',
                valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
                data: chartHistory.cpu,
              },
              {
                dataKey: 'memory',
                label: 'Memory %',
                colorDark: '#4ade80',
                colorLight: '#16a34a',
                valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
                data: chartHistory.memory,
              },
              {
                dataKey: 'requests',
                label: 'Requests/min',
                colorDark: '#facc15',
                colorLight: '#f59e0b',
                valueFormatter: (value) => value !== null ? String(Math.round(value)) : '0',
                data: chartHistory.requests,
              },
            ]}
            isDark={isDark}
            height={350}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {safeMetrics?.gpuUsage ? (
            <PerformanceChart
              title="GPU Utilization & Power"
              description="GPU percentage and power consumption over time"
              datasets={[
                {
                  dataKey: 'gpuUtil',
                  label: 'GPU Utilization %',
                  colorDark: '#f472b6',
                  colorLight: '#dc2626',
                  valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
                  data: chartHistory.gpuUtil,
                },
                {
                  dataKey: 'power',
                  label: 'Power (W)',
                  colorDark: '#fb923c',
                  colorLight: '#f97316',
                  valueFormatter: (value) => value !== null ? `${value.toFixed(1)}W` : 'N/A',
                  data: chartHistory.power,
                },
              ]}
              isDark={isDark}
              height={350}
            />
          ) : (
            <GPUUMetricsCard metrics={safeMetrics} isDark={isDark} />
          )}
        </Grid>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box sx={{
          p: 3,
          background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
        }}>
          <Typography variant="body2" color="text.secondary">
            Uptime
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {formatUptime(safeMetrics?.uptime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Requests
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {safeMetrics?.totalRequests || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avg Response Time
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {safeMetrics?.avgResponseTime || 0}ms
          </Typography>
        </Box>
      </Grid>
    </Box>
  );
}
