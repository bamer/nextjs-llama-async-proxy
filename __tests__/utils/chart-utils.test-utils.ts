import {
  toChartDataPoint,
  updateChartHistory,
  formatUptime,
  countActiveModels,
  type ChartDataPoint,
  type ChartHistory,
} from "@/utils/chart-utils";
import type { ModelConfig } from "@/types";

export const createMockChartDataPoint = (value: number | null, timestamp?: number): ChartDataPoint => ({
  timestamp: timestamp || Date.now(),
  value,
});

export const createMockChartHistory = (): ChartHistory => ({
  cpu: [],
  memory: [],
  requests: [],
  gpuUtil: [],
  power: [],
});

export const createMockMetrics = (
  cpu: number,
  memory: number,
  requests: number,
  gpuUtil: number,
  power: number
) => ({
  cpu,
  memory,
  requests,
  gpuUtil,
  power,
});

export const createMockModel = (
  id: string,
  name: string,
  status: ModelConfig["status"]
): ModelConfig => ({
  id,
  name,
  type: "llama",
  parameters: {},
  status,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const createMockModels = (
  count: number,
  runningCount: number
): ModelConfig[] =>
  Array.from({ length: count }, (_, i) =>
    createMockModel(`${i}`, `Model ${i}`, i < runningCount ? "running" : "idle")
  );
