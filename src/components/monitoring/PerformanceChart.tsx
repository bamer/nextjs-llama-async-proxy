"use client";

import { PerformanceChart as BasePerformanceChart } from '@/components/charts/PerformanceChart';
import { useChartHistory } from '@/hooks/useChartHistory';
import { useTheme } from "@/contexts/ThemeContext";

interface MonitoringPerformanceChartProps {
  isDark?: boolean;
  height?: number;
  showAnimation?: boolean;
}

export function MonitoringPerformanceChart({
  isDark,
  height = 400,
  showAnimation = false
}: MonitoringPerformanceChartProps) {
  const chartHistory = useChartHistory();
  const { isDark: themeIsDark } = useTheme();
  const actualIsDark = isDark ?? themeIsDark;

  return (
    <BasePerformanceChart
      title="System Performance"
      description="CPU, Memory & Requests over time"
      datasets={[
        {
          dataKey: 'cpu',
          label: 'CPU %',
          colorDark: '#60a5fa',
          colorLight: '#2563eb',
          valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
          yAxisLabel: '%',
          data: chartHistory.cpu,
        },
        {
          dataKey: 'memory',
          label: 'Memory %',
          colorDark: '#4ade80',
          colorLight: '#16a34a',
          valueFormatter: (value) => value !== null ? `${value.toFixed(1)}%` : 'N/A',
          yAxisLabel: '%',
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
      isDark={actualIsDark}
      height={height}
      showAnimation={showAnimation}
      xAxisType="band"
    />
  );
}
