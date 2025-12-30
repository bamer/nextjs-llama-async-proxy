"use client";

import { Grid } from '@mui/material';
import { MetricCard } from '@/components/dashboard/MetricCard';

interface MetricsGridProps {
  metrics?: {
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    gpuUsage?: number;
    gpuTemperature?: number;
    gpuMemoryUsed?: number;
    gpuMemoryTotal?: number;
    gpuPowerUsage?: number;
  };
  activeModelsCount: number;
  isDark: boolean;
}

/**
 * MetricsGrid - Display 8 MetricCards in responsive grid
 */
export function MetricsGrid({
  metrics,
  activeModelsCount,
  isDark,
}: MetricsGridProps) {
  const gpuMemoryPercent =
    (metrics?.gpuMemoryUsed || 0) / (metrics?.gpuMemoryTotal || 1) * 100;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
        <MetricCard
          title="CPU Usage"
          value={metrics?.cpuUsage || 0}
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
          value={metrics?.memoryUsage || 0}
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
          value={metrics?.diskUsage || 0}
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
          value={activeModelsCount}
          unit="/10"
          icon="🤖"
          isDark={isDark}
          threshold={10}
          showGauge={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }}>
        <MetricCard
          title="GPU Utilization"
          value={metrics?.gpuUsage || 0}
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
          value={metrics?.gpuTemperature || 0}
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
          value={gpuMemoryPercent}
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
          value={metrics?.gpuPowerUsage || 0}
          unit="W"
          icon="⚡"
          isDark={isDark}
          threshold={300}
          showGauge={true}
        />
      </Grid>
    </Grid>
  );
}
