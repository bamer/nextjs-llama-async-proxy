"use client";

import { Grid } from '@mui/material';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SystemMetrics } from '@/types/monitoring';

interface MetricsGridProps {
  metrics?: SystemMetrics | undefined;
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
  return (
    <Grid container spacing={3} data-testid="grid">
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
        <MetricCard
          title="CPU Usage"
          value={metrics?.cpu?.usage || 0}
          unit="%"
          icon="🖥️"
          isDark={isDark}
          threshold={90}
          showGauge={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
        <MetricCard
          title="Memory Usage"
          value={metrics?.memory?.used || 0}
          unit="%"
          icon="💾"
          isDark={isDark}
          threshold={85}
          showGauge={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
        <MetricCard
          title="Disk Usage"
          value={metrics?.disk?.used || 0}
          unit="%"
          icon="💿"
          isDark={isDark}
          threshold={95}
          showGauge={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
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
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
        <MetricCard
          title="GPU Utilization"
          value={metrics?.gpu?.usage ?? 0}
          unit="%"
          icon="🎮"
          isDark={isDark}
          threshold={90}
          showGauge={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
        <MetricCard
          title="GPU Temperature"
          value={metrics?.gpu?.temperature ?? 0}
          unit="°C"
          icon="🌡️"
          isDark={isDark}
          threshold={85}
          showGauge={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
        <MetricCard
          title="GPU Memory Usage"
          value={
            metrics?.gpu?.memoryUsed && metrics?.gpu?.memoryTotal
              ? Math.round((metrics.gpu.memoryUsed / metrics.gpu.memoryTotal) * 100)
              : 0
          }
          unit="%"
          icon="💿"
          isDark={isDark}
          threshold={90}
          showGauge={true}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.5, xl: 1.5 }} data-testid="grid">
        <MetricCard
          title="GPU Power"
          value={metrics?.gpu?.powerUsage ?? 0}
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
