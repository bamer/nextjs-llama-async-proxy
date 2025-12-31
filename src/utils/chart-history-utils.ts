/**
 * Chart history utilities for useChartHistory hook
 * Extracted to keep hook under 200 lines
 */

import { useStore } from "@/lib/store";

export interface ChartDataPoint {
  time: string;
  displayTime: string;
  value: number;
}

export interface AccumulatedUpdates {
  cpu: number | null;
  memory: number | null;
  requests: number | null;
  gpuUtil: number | null;
  power: number | null;
}

/**
 * Load chart history from database API
 * Ensures charts have data on cold launch/refresh
 */
export async function loadChartHistoryFromDatabase(
  setChartData: (data: {
    cpu: ChartDataPoint[];
    memory: ChartDataPoint[];
    requests: ChartDataPoint[];
    gpuUtil: ChartDataPoint[];
    power: ChartDataPoint[];
  }) => void
): Promise<void> {
  try {
    const response = await fetch("/api/monitoring/history");

    if (!response.ok) {
      console.error("[chart-history] Failed to load history:", response.status);
      setChartData({
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      });
      return;
    }

    const result = await response.json();

    if (result.success && result.data && result.data.cpu?.length > 0) {
      setChartData(result.data);
      console.log("[chart-history] Loaded chart history:", {
        cpu: result.data.cpu.length,
        memory: result.data.memory.length,
        requests: result.data.requests.length,
      });
    } else {
      setChartData({
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      });
    }
  } catch (error) {
    console.error("[chart-history] Error loading history:", error);
    setChartData({
      cpu: [],
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    });
  }
}

/**
 * Create a chart data point with current timestamp
 */
export function createChartDataPoint(value: number): ChartDataPoint {
  const now = new Date();
  const displayTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { time: now.toISOString(), displayTime, value };
}

/**
 * Flush accumulated updates to store in a single transaction
 * This batches all chart updates to prevent multiple setState calls
 */
export function flushAccumulatedUpdates(
  accumulatedUpdates: AccumulatedUpdates,
  chartHistory: {
    cpu: ChartDataPoint[];
    memory: ChartDataPoint[];
    requests: ChartDataPoint[];
    gpuUtil: ChartDataPoint[];
    power: ChartDataPoint[];
  },
  setChartData: (data: {
    cpu: ChartDataPoint[];
    memory: ChartDataPoint[];
    requests: ChartDataPoint[];
    gpuUtil: ChartDataPoint[];
    power: ChartDataPoint[];
  }) => void
): void {
  const dataPoint = createChartDataPoint(0); // Create for reuse with correct values

  const completeChartData = {
    cpu: accumulatedUpdates.cpu !== null
      ? [...chartHistory.cpu, { ...dataPoint, value: accumulatedUpdates.cpu }].slice(
          -60
        )
      : chartHistory.cpu,
    memory: accumulatedUpdates.memory !== null
      ? [...chartHistory.memory, { ...dataPoint, value: accumulatedUpdates.memory }].slice(
          -60
        )
      : chartHistory.memory,
    requests: accumulatedUpdates.requests !== null
      ? [...chartHistory.requests, { ...dataPoint, value: accumulatedUpdates.requests }].slice(
          -60
        )
      : chartHistory.requests,
    gpuUtil: accumulatedUpdates.gpuUtil !== null
      ? [...chartHistory.gpuUtil, { ...dataPoint, value: accumulatedUpdates.gpuUtil }].slice(
          -60
        )
      : chartHistory.gpuUtil,
    power: accumulatedUpdates.power !== null
      ? [...chartHistory.power, { ...dataPoint, value: accumulatedUpdates.power }].slice(
          -60
        )
      : chartHistory.power,
  };

  setChartData(completeChartData);
}

/**
 * Process metrics and update accumulated updates
 * Returns true if updates should be flushed, false otherwise
 */
export function processMetricsForChart(
  lastUpdateTime: number,
  debounceMs: number
): AccumulatedUpdates | null {
  const currentMetrics = useStore.getState().metrics;
  if (!currentMetrics) return null;

  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTime;

  // Only update if debounce time has passed
  if (timeSinceLastUpdate < debounceMs) {
    return null;
  }

  return {
    cpu: currentMetrics.cpu?.usage ?? null,
    memory: currentMetrics.memory?.used ?? null,
    requests: null, // Not available in new SystemMetrics structure
    gpuUtil: 0, // Not available in new SystemMetrics structure
    power: 0, // Not available in new SystemMetrics structure
  };
}
