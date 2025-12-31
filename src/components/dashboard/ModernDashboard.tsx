"use client";

import { useEffect, useState, lazy, Suspense, useMemo, useDeferredValue, useTransition, useEffectEvent as ReactUseEffectEvent } from 'react';
import { useModels, useMetrics } from '@/lib/store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useChartHistory } from '@/hooks/useChartHistory';
import { Box, Grid, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { SkeletonMetricCard } from '@/components/ui';
import { formatUptime, countActiveModels } from '@/utils/chart-utils';

const ModelsListCard = lazy(() =>
  import('@/components/dashboard/ModelsListCard').then((module) => ({
    default: module.ModelsListCard,
  })),
);

// Memoized chart configuration
const CHART_CONFIG = {
  cpu: { dataKey: 'cpu', label: 'CPU %', colorDark: '#60a5fa', colorLight: '#2563eb' },
  memory: { dataKey: 'memory', label: 'Memory %', colorDark: '#4ade80', colorLight: '#16a34a' },
  requests: { dataKey: 'requests', label: 'Requests/min', colorDark: '#facc15', colorLight: '#f59e0b' },
  gpuUtil: { dataKey: 'gpuUtil', label: 'GPU Utilization %', colorDark: '#f472b6', colorLight: '#dc2626', yAxisLabel: '%' },
  power: { dataKey: 'power', label: 'Power (W)', colorDark: '#fb923c', colorLight: '#f97316', yAxisLabel: 'W' },
};

export default function ModernDashboard() {
  const { isConnected, connectionState, sendMessage } = useWebSocket();
  const models = useModels();
  const metrics = useMetrics();
  const safeMetrics = metrics === null ? undefined : metrics;
  const [loading, setLoading] = useState(true);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [isPending, startTransition] = useTransition();

  const chartHistory = useChartHistory();
  const deferredModels = useDeferredValue(models);
  const deferredChartHistory = useDeferredValue(chartHistory);
  const { isDark } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (models.length === 0 && isConnected) {
      console.log('[Dashboard] Models store is empty, requesting load from database...');
      sendMessage('load_models', {});
    }
  }, [models.length, isConnected, sendMessage]);

  const handleRefresh = ReactUseEffectEvent(() => {
    startTransition(() => {
      sendMessage('request_metrics', {});
      sendMessage('request_models', {});
    });
  });

  const handleRestartServer = ReactUseEffectEvent(() => {
    setServerLoading(true);
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
    startTransition(() => {
      sendMessage('start_llama_server', {});
    });
    setTimeout(() => {
      setServerRunning(true);
      setServerLoading(false);
    }, 2000);
  });

  const handleDownloadLogs = ReactUseEffectEvent(() => {
    startTransition(() => {
      sendMessage('download_logs', {});
    });
  });

  const handleToggleModel = ReactUseEffectEvent((modelId: string) => {
    startTransition(() => {
      sendMessage('toggle_model', { modelId });
    });
  });

  const activeModelsCount = useMemo(() => countActiveModels(deferredModels), [deferredModels]);
  const formattedUptime = useMemo(
    () => (safeMetrics?.uptime ? formatUptime(safeMetrics.uptime) : 'N/A'),
    [safeMetrics],
  );

  const chartDatasets = useMemo(
    () => Object.entries(CHART_CONFIG).slice(0, 3).map(([key, config]) => ({
      ...config,
      valueFormatter: (value: number | null) =>
        key === 'requests' ? (value !== null ? String(Math.round(value)) : '0') : (value !== null ? `${value.toFixed(1)}%` : 'N/A'),
      data: deferredChartHistory[key as keyof typeof deferredChartHistory],
    })),
    [deferredChartHistory],
  );

  const gpuDatasets = useMemo(
    () => Object.entries(CHART_CONFIG).slice(3, 5).map(([key, config]) => ({
      ...config,
      valueFormatter: (value: number | null) => (value !== null ? `${value.toFixed(1)}${(config as any).yAxisLabel || '%'}` : 'N/A'),
      data: deferredChartHistory[key as keyof typeof deferredChartHistory],
    })),
    [deferredChartHistory],
  );

  if (loading && !safeMetrics) {
    return (
      <Box sx={{ p: 4, maxWidth: 1600, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Dashboard Overview
          </Typography>
          <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
        </Box>
        <Grid container spacing={3}>
          {[...Array(8)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
              <SkeletonMetricCard icon="📊" />
            </Grid>
          ))}
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
        refreshing={false}
        onRestartServer={handleRestartServer}
        onStartServer={handleStartServer}
        serverRunning={serverRunning}
        serverLoading={serverLoading}
      />

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

      <MetricsGrid metrics={safeMetrics} activeModelsCount={activeModelsCount} isDark={isDark} />

      <Box sx={{ mb: 4 }} />

      <ChartsSection
        datasets={chartDatasets}
        gpuDatasets={gpuDatasets}
        isDark={isDark}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <Suspense fallback={<CircularProgress />}>
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
