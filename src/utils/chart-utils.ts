import type { ModelConfig } from '@/types';

export type ChartDataPoint = {
  timestamp: number;
  value: number | null;
};

export type ChartHistory = {
  cpu: ChartDataPoint[];
  memory: ChartDataPoint[];
  requests: ChartDataPoint[];
  gpuUtil: ChartDataPoint[];
  power: ChartDataPoint[];
};

/**
 * Convert a data point to a chart data format
 */
export function toChartDataPoint(value: number | null, timestamp: number): ChartDataPoint {
  return {
    timestamp,
    value,
  };
}

/**
 * Update chart history with new metrics
 * Maintains max 60 data points per metric type
 */
export function updateChartHistory(
  history: ChartHistory,
  newMetrics: {
    cpu: number | null;
    memory: number | null;
    requests: number | null;
    gpuUtil: number | null;
    power: number | null;
  },
): ChartHistory {
  const timestamp = Date.now();

  const addToHistory = (existing: ChartDataPoint[], value: number | null) => {
    const updated = [...existing, toChartDataPoint(value, timestamp)];
    return updated.slice(-60); // Keep last 60 points
  };

  return {
    cpu: addToHistory(history.cpu, newMetrics.cpu),
    memory: addToHistory(history.memory, newMetrics.memory),
    requests: addToHistory(history.requests, newMetrics.requests),
    gpuUtil: addToHistory(history.gpuUtil, newMetrics.gpuUtil),
    power: addToHistory(history.power, newMetrics.power),
  };
}

/**
 * Format uptime seconds into human-readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}

/**
 * Count active models from models array
 */
export function countActiveModels(models: ModelConfig[]): number {
  return models.filter((m) => m.status === 'running').length;
}
