"use client";

import { Grid, Typography, Box } from "@mui/material";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SystemMetrics } from "@/types/monitoring";
import { type ChartHistory } from "@/lib/store/types";

interface MetricsGridProps {
  metrics?: SystemMetrics | undefined;
  activeModelsCount: number;
  totalTokens?: number;
  requestsPerMin?: number;
  avgResponseTime?: number;
  isDark: boolean;
  chartHistory?: ChartHistory;
}

const SECTION_STYLES = {
  mb: 3,
  pb: 1,
  borderBottom: "2px solid",
  borderColor: "divider",
};

function getSparklineColor(value: number, threshold: number): string {
  if (value > threshold) return "#ef4444";
  if (value > threshold * 0.7) return "#f59e0b";
  return "#10b981";
}

export function MetricsGrid({
  metrics,
  activeModelsCount,
  totalTokens = 0,
  requestsPerMin = 0,
  avgResponseTime = 0,
  isDark,
  chartHistory,
}: MetricsGridProps) {
  // Extract sparkline data from chart history
  const cpuSparkline = chartHistory?.cpu?.map(d => d.value ?? 0) ?? [];
  const memorySparkline = chartHistory?.memory?.map(d => d.value ?? 0) ?? [];
  const gpuSparkline = chartHistory?.gpuUtil?.map(d => d.value ?? 0) ?? [];
  const requestsSparkline = chartHistory?.requests?.map(d => d.value ?? 0) ?? [];

  return (
    <Box>
      <Box sx={SECTION_STYLES}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          System Resources
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="CPU"
              value={metrics?.cpu?.usage || 0}
              unit="%"
              icon="🖥️"
              isDark={isDark}
              threshold={90}
              showGauge={true}
              sparklineData={cpuSparkline}
              sparklineColor={getSparklineColor(metrics?.cpu?.usage || 0, 90)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Memory"
              value={metrics?.memory?.used || 0}
              unit="%"
              icon="💾"
              isDark={isDark}
              threshold={85}
              showGauge={true}
              sparklineData={memorySparkline}
              sparklineColor={getSparklineColor(metrics?.memory?.used || 0, 85)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="GPU"
              value={metrics?.gpu?.usage ?? 0}
              unit="%"
              icon="🎮"
              isDark={isDark}
              threshold={90}
              showGauge={true}
              sparklineData={gpuSparkline}
              sparklineColor={getSparklineColor(metrics?.gpu?.usage ?? 0, 90)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Storage"
              value={metrics?.disk?.used || 0}
              unit="%"
              icon="💿"
              isDark={isDark}
              threshold={95}
              showGauge={true}
            />
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Model Resources
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
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
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Total Tokens"
              value={totalTokens}
              unit=""
              icon="📝"
              isDark={isDark}
              threshold={1000000}
              showGauge={false}
              sparklineData={requestsSparkline}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Requests/min"
              value={requestsPerMin}
              unit="/min"
              icon="📊"
              isDark={isDark}
              threshold={100}
              showGauge={false}
              sparklineData={requestsSparkline}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Avg Response"
              value={avgResponseTime}
              unit="ms"
              icon="⏱️"
              isDark={isDark}
              threshold={500}
              showGauge={false}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
