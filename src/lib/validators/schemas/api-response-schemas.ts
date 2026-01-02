// src/lib/validators/schemas/api-response-schemas.ts

import { z } from "zod";
import { websocketMessageSchema } from "./api-error-schemas";

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
 * Metrics Message Schema
 */
export const metricsMessageSchema = websocketMessageSchema.extend({
  type: z.literal("metrics"),
  data: systemMetricsSchema,
}).describe("WebSocket metrics message");

/**
 * Start Model Response Schema
 */
export const startModelResponseSchema = z
  .object({
    model: z.string().describe("Name of the model"),
    status: z.enum(["loaded", "loading", "error", "not_found"]).describe("Current model status"),
    message: z.string().optional().describe("Human-readable status message"),
    data: z.unknown().optional().describe("Additional response data"),
  })
  .strict()
  .describe("Response from model start operation");

/**
 * Stop Model Response Schema
 */
export const stopModelResponseSchema = z
  .object({
    model: z.string().describe("Name of the model"),
    status: z.enum(["stopped", "note", "error"]).describe("Stop operation status"),
    message: z.string().optional().describe("Human-readable status message"),
    info: z.string().optional().describe("Additional information"),
  })
  .strict()
  .describe("Response from model stop operation");

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
export type StartModelResponse = z.infer<typeof startModelResponseSchema>;
export type StopModelResponse = z.infer<typeof stopModelResponseSchema>;
export type MetricsResponse = z.infer<typeof metricsResponseSchema>;
export type MetricsMessage = z.infer<typeof metricsMessageSchema>;

// Parser Functions
export function parseSystemMetrics(data: unknown): SystemMetrics {
  return systemMetricsSchema.parse(data);
}

export function safeParseSystemMetrics(data: unknown) {
  return systemMetricsSchema.safeParse(data);
}
