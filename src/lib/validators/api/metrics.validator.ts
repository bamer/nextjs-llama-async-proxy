// src/lib/validators/api/metrics.validator.ts

import { z } from "zod";

/**
 * System Metrics Schema
 */
export const systemMetricsSchema = z
  .object({
    cpuUsage: z.number().min(0).max(100).describe("CPU usage percentage"),
    memoryUsage: z.number().min(0).max(100).describe("Memory usage percentage"),
    diskUsage: z.number().min(0).max(100).describe("Disk usage percentage"),
    activeModels: z.number().int().nonnegative().describe("Number of active models"),
    totalRequests: z.number().int().nonnegative().describe("Total requests processed"),
    avgResponseTime: z.number().nonnegative().describe("Average response time (ms)"),
    uptime: z.number().nonnegative().describe("Server uptime (seconds)"),
    timestamp: z.string().datetime().describe("ISO timestamp"),
    gpuUsage: z.number().min(0).max(100).optional().describe("GPU usage percentage"),
    gpuMemoryUsage: z.number().min(0).max(100).optional().describe("GPU memory usage"),
    gpuMemoryTotal: z.number().nonnegative().optional().describe("Total GPU memory (bytes)"),
    gpuMemoryUsed: z.number().nonnegative().optional().describe("Used GPU memory (bytes)"),
    gpuPowerUsage: z.number().nonnegative().optional().describe("GPU power (watts)"),
    gpuPowerLimit: z.number().nonnegative().optional().describe("GPU power limit (watts)"),
    gpuTemperature: z.number().nonnegative().optional().describe("GPU temp (Celsius)"),
    gpuName: z.string().optional().describe("GPU device name"),
  })
  .strict()
  .describe("System monitoring metrics");

/**
 * Metrics Response Schema
 */
export const metricsResponseSchema = z
  .object({
    metrics: systemMetricsSchema.optional(),
    error: z.string().optional().describe("Error message if unavailable"),
    timestamp: z.string().datetime().describe("ISO timestamp of response"),
  })
  .strict()
  .describe("Response containing system metrics");

// Types
export type SystemMetrics = z.infer<typeof systemMetricsSchema>;
export type MetricsResponse = z.infer<typeof metricsResponseSchema>;
