/**
 * Store action implementations
 */

import { ChartDataPoint, ChartHistory } from './types';
import { initialState } from './initial-state';
import { SystemMetrics } from '@/types/monitoring';

/**
 * Create a chart data point with current timestamp
 */
export function createChartDataPoint(value: number): ChartDataPoint {
  const now = new Date();
  const displayTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    time: now.toISOString(),
    displayTime,
    value,
  };
}

/**
 * Rebuild chart history from current metrics
 */
export function rebuildChartHistoryFromMetrics(metrics: SystemMetrics): ChartHistory {
  return {
    cpu: metrics.cpu?.usage !== undefined ? [createChartDataPoint(metrics.cpu.usage)] : [],
    memory: metrics.memory?.used !== undefined ? [createChartDataPoint(metrics.memory.used)] : [],
    requests: [], // Not available in new format
    gpuUtil: [], // Not available in new format
    power: [], // Not available in new format
  };
}

/**
 * Add a single data point to chart history
 */
export function addChartDataPoint(history: ChartHistory, type: keyof ChartHistory, value: number): ChartHistory {
  const newHistory = { ...history };
  const newPoint = createChartDataPoint(value);
  newHistory[type].push(newPoint);

  // Limit to 60 points per chart
  if (newHistory[type].length > 60) {
    newHistory[type].shift();
  }

  return newHistory;
}

/**
 * Trim chart data to specified max points
 */
export function trimChartDataPoints(history: ChartHistory, maxPoints: number = 200): ChartHistory {
  const trimmed = { ...history };

  (Object.keys(trimmed) as Array<keyof ChartHistory>).forEach((key) => {
    if (maxPoints <= 0) {
      trimmed[key] = [];
    } else {
      trimmed[key] = trimmed[key].slice(0, maxPoints);
    }
  });

  return trimmed;
}

/**
 * Create empty chart history
 */
export function createEmptyChartHistory(): ChartHistory {
  return {
    cpu: [],
    memory: [],
    requests: [],
    gpuUtil: [],
    power: [],
  };
}

/**
 * Get initial status state
 */
export function getInitialStatus() {
  return { ...initialState.status, error: null };
}
