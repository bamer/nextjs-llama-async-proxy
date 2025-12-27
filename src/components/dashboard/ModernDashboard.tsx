"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useChartHistory } from '@/hooks/useChartHistory';
import { Box, Grid, Typography, LinearProgress, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';
import { Refresh, Settings as SettingsIcon, Download } from '@mui/icons-material';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ModelsListCard } from '@/components/dashboard/ModelsListCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { GPUMetricsSection } from '@/components/dashboard/GPUMetricsSection';
import { Loading, SkeletonMetricCard } from '@/components/ui';
import { useRouter } from 'next/navigation';

export default function ModernDashboard() {
  const { isConnected, connectionState, sendMessage, reconnectionAttempts } = useWebSocket();
  const models = useStore((state) => state.models);
  const rawMetrics = useStore((state) => state.metrics);
  const safeMetrics = rawMetrics ? rawMetrics : undefined;
  const [loading, setLoading] = useState(true);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const chartHistory = useChartHistory();
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    sendMessage('request_metrics', {});
    sendMessage('request_models', {});

    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [sendMessage, isConnected]);

  const handleRefresh = async () => {
    setRefreshing(true);
    sendMessage('request_metrics', {});
    sendMessage('request_models', {});
    // Simulate brief loading for better UX
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleDownloadLogs = () => {
    setDownloading(true);
    sendMessage('download_logs', {});
    setTimeout(() => setDownloading(false), 800);
  };

  const handleRestartServer = () => {
    setServerLoading(true);
    sendMessage('restart_server', {});
    setTimeout(() => {
      setServerRunning(true);
      setServerLoading(false);
    }, 2000);
  };

  const handleStartServer = () => {
    setServerLoading(true);
    sendMessage('start_llama_server', {});
    setTimeout(() => {
      setServerRunning(true);
      setServerLoading(false);
    }, 2000);
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
      <Box sx={{ p: 4, maxWidth: 1600, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Dashboard Overview
          </Typography>
          <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SkeletonMetricCard icon="🖥️" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SkeletonMetricCard icon="💾" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SkeletonMetricCard icon="💿" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SkeletonMetricCard icon="🤖" />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box data-testid="modern-dashboard" sx={{ p: 4, maxWidth: 1600, mx: 'auto' }}>
      <DashboardHeader
        isConnected={isConnected}
        connectionState={connectionState}
        reconnectionAttempts={reconnectionAttempts}
        metrics={safeMetrics}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

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
            value={models.filter(m => m.status === 'running').length}
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
            onDownloadLogs={handleDownloadLogs}
            onRestartServer={handleRestartServer}
            onStartServer={handleStartServer}
            serverRunning={serverRunning}
            serverLoading={serverLoading}
            downloading={downloading}
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

        {/* GPU Metrics Section - Reusable component showing both card and chart */}
        <GPUMetricsSection
          metrics={safeMetrics}
          chartHistory={chartHistory}
          isDark={isDark}
        />
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
