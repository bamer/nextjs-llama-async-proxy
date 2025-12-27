"use client";

import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { GPUUMetricsCard } from '@/components/charts/GPUUMetricsCard';

interface GPUMetricsSectionProps {
  metrics: any;
  chartHistory: any;
  isDark: boolean;
}

export function GPUMetricsSection({ metrics, chartHistory, isDark }: GPUMetricsSectionProps) {
  const hasGPUData = 
    metrics?.gpuUsage !== undefined || 
    metrics?.gpuPowerUsage !== undefined || 
    metrics?.gpuMemoryUsed !== undefined;

  if (!hasGPUData) {
    return (
      <Grid size={{ xs: 12, md: 6 }}>
        <GPUUMetricsCard metrics={metrics} isDark={isDark} />
      </Grid>
    );
  }

  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Card sx={{
        background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            GPU Metrics
          </Typography>

          <Grid container spacing={2} sx={{ flex: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <GPUUMetricsCard metrics={metrics} isDark={isDark} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
                    data: chartHistory.gpuUtil,
                  },
                  {
                    dataKey: 'power',
                    label: 'Power (W)',
                    colorDark: '#fb923c',
                    colorLight: '#f97316',
                    valueFormatter: (value) => value !== null ? `${value.toFixed(1)}W` : 'N/A',
                    yAxisLabel: 'W',
                    data: chartHistory.power,
                  },
                ]}
                isDark={isDark}
                height={350}
                showAnimation={false}
                xAxisType="band"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
}
