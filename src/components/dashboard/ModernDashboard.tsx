"use client";

import { useEffect, useState, lazy, Suspense, useMemo, useDeferredValue, useTransition, useEffectEvent as ReactUseEffectEvent } from 'react';
import { useModels, useMetrics } from '@/lib/store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useChartHistory } from '@/hooks/useChartHistory';
import { Box, Grid, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SkeletonMetricCard } from '@/components/ui';

// Lazy load heavy components
const PerformanceChart = lazy(() =>
  import('@/components/charts/PerformanceChart').then(module => ({
    default: module.PerformanceChart,
  })),
);

const ModelsListCard = lazy(() =>
  import('@/components/dashboard/ModelsListCard').then(module => ({
    default: module.ModelsListCard
  }))
);


// Loading fallback component for charts
const ChartLoadingFallback = ({ isDark }: { isDark: boolean }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: 350,
      background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
      borderRadius: 2,
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      Loading chart...
    </Typography>
  </Box>
);

export default function ModernDashboard () {
  // ✅ Get WebSocket connection state - this is the SINGLE source of truth
  const { isConnected, connectionState, sendMessage } = useWebSocket();
  
  // Using optimized shallow selectors - prevents re-renders when data hasn't changed
  // These hooks use shallow comparison from Zustand, so components only re-render
  // when their specific data's reference changes, not when ANY store state changes
  const models = useModels();
  const metrics = useMetrics();
  const safeMetrics = metrics || undefined;
  const [loading, setLoading] = useState(true);
  const [serverLoading, setServerLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);

  // React 19.2: useTransition for non-blocking operations
  const [isPending, startTransition] = useTransition();

  const chartHistory = useChartHistory();

  // React 19.2: Defer heavy computations to prevent UI blocking
  const deferredModels = useDeferredValue(models);
  const deferredChartHistory = useDeferredValue(chartHistory);

  const { isDark } = useTheme();

  useEffect(() => {
    // Set loading to false after initial load
    // Data requests are now handled by useWebSocket hook when connection is established
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []); // No dependencies - only run once on mount

  // React 19.2: Use useEffectEvent for stable event handlers
  const handleRefresh = ReactUseEffectEvent(() => {
    setRefreshing(true);

    // React 19.2: Use startTransition for non-blocking operations
    startTransition(() => {
      sendMessage('request_metrics', {});
      sendMessage('request_models', {});
    });

    // Simulate brief loading for better UX
    setTimeout(() => setRefreshing(false), 800);
  });

  const handleDownloadLogs = ReactUseEffectEvent(() => {
    setDownloading(true);

    // React 19.2: Non-blocking download operation
    startTransition(() => {
      sendMessage('download_logs', {});
    });

    setTimeout(() => setDownloading(false), 800);
  });

  const handleRestartServer = ReactUseEffectEvent(() => {
    setServerLoading(true);

    // React 19.2: Non-blocking restart operation
    startTransition(() => {
      sendMessage('restart_server', {});
    });

    setTimeout(() => {
      setServerRunning(true);
      setServerLoading(false);
    }, 2000);
  });

  const handleStartServer = ReactUseEffectEvent(() => {
    setServerLoading(true);

    // React 19.2: Non-blocking start operation
    startTransition(() => {
      sendMessage('start_llama_server', {});
    });

    setTimeout(() => {
      setServerRunning(true);
      setServerLoading(false);
    }, 2000);
  });

  const handleToggleModel = ReactUseEffectEvent((modelId: string) => {
    // React 19.2: Non-blocking model toggle
    startTransition(() => {
      sendMessage('toggle_model', { modelId });
    });
  });

  // React 19.2: Memoize expensive computations
  const activeModelsCount = useMemo(() => {
    return deferredModels.filter((m: ModelConfig) => m.status === 'running').length;
  }, [deferredModels]);

  const formattedUptime = useMemo(() => {
    if (!safeMetrics?.uptime) return 'N/A';
    const days = Math.floor(safeMetrics.uptime / 86400);
    const hours = Math.floor((safeMetrics.uptime % 86400) / 3600);
    const mins = Math.floor((safeMetrics.uptime % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  }, [safeMetrics]);

  // React 19.2: Memoize chart datasets with deferred values
  const chartDatasets = useMemo(() => [
    {
      dataKey: 'cpu',
      label: 'CPU %',
      colorDark: '#60a5fa',
      colorLight: '#2563eb',
      valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
      data: deferredChartHistory.cpu,
    },
    {
      dataKey: 'memory',
      label: 'Memory %',
      colorDark: '#4ade80',
      colorLight: '#16a34a',
      valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
      data: deferredChartHistory.memory,
    },
    {
      dataKey: 'requests',
      label: 'Requests/min',
      colorDark: '#facc15',
      colorLight: '#f59e0b',
      valueFormatter: (value: number | null) => value !== null ? String(Math.round(value)) : '0',
      data: deferredChartHistory.requests,
    },
  ], [deferredChartHistory.cpu, deferredChartHistory.memory, deferredChartHistory.requests]);

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
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="🖥️" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="💾" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="💿" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="🤖" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="🎮" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="🌡️" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="💿" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
            <SkeletonMetricCard icon="⚡" />
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
        reconnectionAttempts={0}
        metrics={safeMetrics}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onRestartServer={handleRestartServer}
        onStartServer={handleStartServer}
        serverRunning={serverRunning}
        serverLoading={serverLoading}
      />

      {/* React 19.2: Show loading state during transitions */}
      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
            Processing...
          </Typography>
        </Box>
      )}

      <Typography variant="h5" fontWeight="bold" sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="CPU Usage"
            value={safeMetrics?.cpuUsage || 0}
            unit="%"
            icon="🖥️"
            isDark={isDark}
            threshold={90}
            showGauge={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="Memory Usage"
            value={safeMetrics?.memoryUsage || 0}
            unit="%"
            icon="💾"
            isDark={isDark}
            threshold={85}
            showGauge={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="Disk Usage"
            value={safeMetrics?.diskUsage || 0}
            unit="%"
            icon="💿"
            isDark={isDark}
            threshold={95}
            showGauge={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="Active Models"
            // React 19.2: Use memoized active models count
            value={activeModelsCount}
            unit="/10"
            icon="🤖"
            isDark={isDark}
            threshold={10}
            showGauge={true}
          />
        </Grid>
        {/* GPU Metric Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="GPU Utilization"
            value={safeMetrics?.gpuUsage || 0}
            unit="%"
            icon="🎮"
            isDark={isDark}
            threshold={90}
            showGauge={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="GPU Temperature"
            value={safeMetrics?.gpuTemperature || 0}
            unit="°C"
            icon="🌡️"
            isDark={isDark}
            threshold={85}
            showGauge={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="GPU Memory Usage"
            value={(safeMetrics?.gpuMemoryUsed || 0) / (safeMetrics?.gpuMemoryTotal || 1) * 100}
            unit="%"
            icon="💿"
            isDark={isDark}
            threshold={90}
            showGauge={true}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
          <MetricCard
            title="GPU Power"
            value={safeMetrics?.gpuPowerUsage || 0}
            unit="W"
            icon="⚡"
            isDark={isDark}
            threshold={300}
            showGauge={true}
          />
        </Grid>
      </Grid>

      {/* Middle Section: Performance Chart + GPU Metrics Graph (50% each) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Suspense fallback={<ChartLoadingFallback isDark={isDark} />}>
            <PerformanceChart
              title="Performance Metrics"
              description="Real-time CPU, memory, and request metrics"
              datasets={chartDatasets}
              isDark={isDark}
            />
          </Suspense>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Suspense fallback={<CircularProgress />}>
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
                  yAxisLabel: '%',
                  data: deferredChartHistory.gpuUtil,
                },
                {
                  dataKey: 'power',
                  label: 'Power (W)',
                  colorDark: '#fb923c',
                  colorLight: '#f97316',
                  valueFormatter: (value) => value !== null ? `${value.toFixed(1)}W` : 'N/A',
                  yAxisLabel: 'W',
                  data: deferredChartHistory.power,
                },
              ]}
              isDark={isDark}
              height={350}
              showAnimation={false}
              xAxisType="band"
            />
          </Suspense>
        </Grid>
      </Grid>

      {/* Bottom Section: Models List (full width) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <Suspense fallback={<CircularProgress />}>
            {/* React 19.2: Pass deferred models to prevent blocking */}
            <ModelsListCard
              models={deferredModels}
              isDark={isDark}
              onToggleModel={handleToggleModel}
            />
          </Suspense>
        </Grid>
      </Grid>
    </Box>
  );
}
