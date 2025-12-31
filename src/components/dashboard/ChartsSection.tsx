"use client";

import { lazy, Suspense } from 'react';
import { Grid, Box, Typography, CircularProgress } from '@mui/material';
import { type ChartDataPoint, type Dataset } from '@/components/charts/ChartContainer';

const PerformanceChart = lazy(() =>
  import('@/components/charts/PerformanceChart').then((module) => ({
    default: module.PerformanceChart,
  })),
);

interface ChartsSectionProps {
  datasets: Dataset[];
  gpuDatasets: Dataset[];
  isDark: boolean;
}

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

/**
 * ChartsSection - Display 2 PerformanceChart instances
 */
export function ChartsSection({
  datasets,
  gpuDatasets,
  isDark,
}: ChartsSectionProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Suspense fallback={<ChartLoadingFallback isDark={isDark} />}>
          <PerformanceChart
            title="Performance Metrics"
            description="Real-time CPU, memory, and request metrics"
            datasets={datasets}
            isDark={isDark}
          />
        </Suspense>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Suspense fallback={<CircularProgress />}>
          <PerformanceChart
            title="GPU Utilization & Power"
            description="GPU percentage and power consumption over time"
            datasets={gpuDatasets}
            isDark={isDark}
            height={350}
            showAnimation={false}
            xAxisType="band"
          />
        </Suspense>
      </Grid>
    </Grid>
  );
}
