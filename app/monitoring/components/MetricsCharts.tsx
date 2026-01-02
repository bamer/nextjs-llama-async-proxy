"use client";

import { PerformanceChart } from "@/components/charts/PerformanceChart";
import type { ChartHistory } from "@/lib/store";

interface MetricsChartsProps {
  isDark: boolean;
  chartHistory: ChartHistory;
}

export function MetricsCharts({ isDark, chartHistory }: MetricsChartsProps) {
  return (
    <PerformanceChart
      title="System Performance"
      description="CPU, Memory & Requests over time"
      datasets={[
        {
          dataKey: "cpu",
          label: "CPU %",
          colorDark: "#60a5fa",
          colorLight: "#2563eb",
          valueFormatter: (value) => (value !== null ? `${value.toFixed(1)}%` : "N/A"),
          yAxisLabel: "%",
          data: chartHistory.cpu,
        },
        {
          dataKey: "memory",
          label: "Memory %",
          colorDark: "#4ade80",
          colorLight: "#16a34a",
          valueFormatter: (value) => (value !== null ? `${value.toFixed(1)}%` : "N/A"),
          yAxisLabel: "%",
          data: chartHistory.memory,
        },
        {
          dataKey: "requests",
          label: "Requests/min",
          colorDark: "#facc15",
          colorLight: "#f59e0b",
          valueFormatter: (value) => (value !== null ? String(Math.round(value)) : "0"),
          data: chartHistory.requests,
        },
      ]}
      isDark={isDark}
      height={400}
      showAnimation={false}
      xAxisType="band"
    />
  );
}
