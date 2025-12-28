"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

const DEBOUNCE_MS = 5000; // 5 seconds minimum between updates

export function useChartHistory() {
  const metrics = useStore((state) => state.metrics);
  const chartHistory = useStore((state) => state.chartHistory);
  const addChartData = useStore((state) => state.addChartData);

  // Track last update time for debouncing
  const lastUpdateRef = useRef<number>(0);

  // Process metrics and add to chart history with debouncing
  const processMetrics = useCallback(() => {
    if (!metrics) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Only update if at least 5 seconds have passed
    if (timeSinceLastUpdate < DEBOUNCE_MS) {
      return;
    }

    // Add all chart data
    addChartData("cpu", metrics.cpuUsage);
    addChartData("memory", metrics.memoryUsage);
    addChartData("requests", metrics.totalRequests);

    if (metrics.gpuUsage !== undefined) {
      addChartData("gpuUtil", metrics.gpuUsage);
    }

    if (metrics.gpuPowerUsage !== undefined) {
      addChartData("power", metrics.gpuPowerUsage);
    }

    // Update last update time
    lastUpdateRef.current = now;
  }, [metrics, addChartData]);

  // Process metrics whenever metrics data changes
  useEffect(() => {
    processMetrics();
  }, [processMetrics]);

  return chartHistory;
}
