"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function useChartHistory() {
  const metrics = useStore((state) => state.metrics);
  const chartHistory = useStore((state) => state.chartHistory);
  const addChartData = useStore((state) => state.addChartData);

  useEffect(() => {
    if (!metrics) return;

    addChartData("cpu", metrics.cpuUsage);
    addChartData("memory", metrics.memoryUsage);
    addChartData("requests", metrics.totalRequests);

    if (metrics.gpuUsage !== undefined) {
      addChartData("gpuUtil", metrics.gpuUsage);
    }

    if (metrics.gpuPowerUsage !== undefined) {
      addChartData("power", metrics.gpuPowerUsage);
    }
  }, [metrics, addChartData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!metrics) return;

      addChartData("cpu", metrics.cpuUsage);
      addChartData("memory", metrics.memoryUsage);
      addChartData("requests", metrics.totalRequests);

      if (metrics.gpuUsage !== undefined) {
        addChartData("gpuUtil", metrics.gpuUsage);
      }

      if (metrics.gpuPowerUsage !== undefined) {
        addChartData("power", metrics.gpuPowerUsage);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [metrics, addChartData]);

  return chartHistory;
}
