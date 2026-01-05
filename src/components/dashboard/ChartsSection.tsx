"use client";

import { lazy, Suspense, useState, useMemo, memo } from 'react';
import { Grid, Box, Typography, CircularProgress, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { type Dataset } from '@/components/charts/ChartContainer';

const PerformanceChart = lazy(() =>
  import('@/components/charts/PerformanceChart').then((module) => ({
    default: module.PerformanceChart,
  })),
);

export type TimeRange = '1h' | '6h' | '24h' | '7d';

interface ChartsSectionProps {
  datasets: Dataset[];
  gpuDatasets: Dataset[];
  isDark: boolean;
  onTimeRangeChange?: (range: TimeRange) => void;
  currentTimeRange?: TimeRange;
}

const ChartLoadingFallback = memo(function ChartLoadingFallback({ isDark }: { isDark: boolean }) {
  return (
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
});

// Legend component for datasets
const ChartLegend = memo(function ChartLegend({ datasets, isDark }: { datasets: Dataset[]; isDark: boolean }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2, mb: 1 }}>
      {datasets.map((dataset) => (
        <Box
          key={dataset.dataKey}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '2px',
              backgroundColor: isDark ? dataset.colorDark : dataset.colorLight,
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {dataset.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

/**
 * ChartsSection - Display 2 PerformanceChart instances with controls
 */
export function ChartsSection({
  datasets,
  gpuDatasets,
  isDark,
  onTimeRangeChange,
  currentTimeRange = '24h',
}: ChartsSectionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(currentTimeRange);

  const handleTimeRangeChange = (_: React.MouseEvent<HTMLElement>, newRange: TimeRange | null) => {
    if (newRange) {
      setTimeRange(newRange);
      onTimeRangeChange?.(newRange);
    }
  };

  const chartTypeSx = useMemo(() => ({
    '& .MuiToggleButton-root': {
      px: 2,
      py: 0.5,
      fontSize: '0.75rem',
      textTransform: 'none',
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      '&.Mui-selected': {
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        color: '#3b82f6',
        '&:hover': {
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
        },
      },
      '&:hover': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      },
    },
  }), [isDark]);

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
        {/* Time range selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Time Range:
          </Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
            sx={chartTypeSx}
          >
            <ToggleButton value="1h">1h</ToggleButton>
            <ToggleButton value="6h">6h</ToggleButton>
            <ToggleButton value="24h">24h</ToggleButton>
            <ToggleButton value="7d">7d</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Charts grid */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Performance Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time CPU, memory, and request metrics
            </Typography>
            <ChartLegend datasets={datasets} isDark={isDark} />
          </Box>
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
          <Box sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              GPU Utilization & Power
            </Typography>
            <Typography variant="body2" color="text.secondary">
              GPU percentage and power consumption over time
            </Typography>
            <ChartLegend datasets={gpuDatasets} isDark={isDark} />
          </Box>
          <Suspense fallback={<ChartLoadingFallback isDark={isDark} />}>
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
    </Box>
  );
}
