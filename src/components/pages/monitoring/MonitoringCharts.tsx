"use client";

import { Box, Grid } from "@mui/material";
import { memo, useMemo } from "react";
import { PerformanceChart } from "@/components/charts/PerformanceChart";

interface ChartDataPoint {
  time: string;
  displayTime: string;
  value: number;
}

interface MonitoringChartsProps {
  cpuData: ChartDataPoint[];
  memoryData: ChartDataPoint[];
  requestData: ChartDataPoint[];
  gpuData: ChartDataPoint[];
  timeRange: string;
  isDark: boolean;
}

const MonitoringCharts = memo(function MonitoringCharts({
  cpuData,
  memoryData,
  requestData,
  gpuData,
  timeRange,
  isDark
}: MonitoringChartsProps) {
  // Memoize CPU dataset
  const cpuDataset = useMemo(() => {
    return [{
      dataKey: "cpu",
      label: "CPU Usage (%)",
      colorDark: "#ef4444",
      colorLight: "#dc2626",
      valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(1)}%` : "N/A",
      data: cpuData
    }];
  }, [cpuData]);

  // Memoize memory dataset
  const memoryDataset = useMemo(() => {
    return [{
      dataKey: "memory",
      label: "Memory Usage (GB)",
      colorDark: "#3b82f6",
      colorLight: "#2563eb",
      valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(1)} GB` : "N/A",
      data: memoryData
    }];
  }, [memoryData]);

  // Memoize request dataset
  const requestDataset = useMemo(() => {
    return [{
      dataKey: "requests",
      label: "Requests/min",
      colorDark: "#10b981",
      colorLight: "#059669",
      valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(0)}` : "N/A",
      data: requestData
    }];
  }, [requestData]);

  // Memoize GPU dataset
  const gpuDataset = useMemo(() => {
    return [{
      dataKey: "gpu",
      label: "GPU Usage (%)",
      colorDark: "#f59e0b",
      colorLight: "#d97706",
      valueFormatter: (value: number | null) => value !== null ? `${value.toFixed(1)}%` : "N/A",
      data: gpuData
    }];
  }, [gpuData]);

  // Memoize chart title
  const chartTitle = useMemo(() => {
    return `Performance Metrics (${timeRange})`;
  }, [timeRange]);

  return (
    <Box sx={{ mt: 6 }}>
      <Grid container spacing={3}>
        {/* CPU & Memory Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PerformanceChart
            title="CPU & Memory Usage"
            description="Real-time CPU and memory consumption over time"
            datasets={[...cpuDataset, ...memoryDataset]}
            isDark={isDark}
            height={300}
            xAxisType="band"
            showAnimation={true}
          />
        </Grid>

        {/* Requests Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PerformanceChart
            title="Request Rate"
            description="Number of requests per minute"
            datasets={requestDataset}
            isDark={isDark}
            height={300}
            xAxisType="band"
            showAnimation={true}
          />
        </Grid>

        {/* GPU Usage Chart */}
        <Grid size={{ xs: 12 }}>
          <PerformanceChart
            title={chartTitle}
            description="GPU utilization metrics across time"
            datasets={gpuDataset}
            isDark={isDark}
            height={350}
            xAxisType="band"
            showAnimation={true}
          />
        </Grid>
      </Grid>
    </Box>
  );
});

MonitoringCharts.displayName = "MonitoringCharts";

export { MonitoringCharts };
