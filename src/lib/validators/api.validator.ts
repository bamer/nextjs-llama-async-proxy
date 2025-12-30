// src/lib/validators/api.validator.ts

import { z } from "zod";

/**
 * Start Model Request Schema
 */
export const startModelRequestSchema = z
  .object({
    model: z.string().min(1).describe("Name or ID of model to start"),
    template: z.string().optional().describe("Optional prompt template"),
    messages: z.array(
      z.object({
        role: z.enum(["user", "assistant", "system", "tool"]),
        content: z.string(),
      })
    ).optional().describe("Optional initial messages"),
    max_tokens: z.number().int().positive().optional().describe("Max tokens to generate"),
  })
  .strict()
  .describe("Request to start/load a model");

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
 * Stop Model Request Schema
 */
export const stopModelRequestSchema = z
  .object({
    force: z.boolean().optional().default(false).describe("Force stop model process"),
  })
  .strict()
  .describe("Request to stop a model");

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

/**
 * Rescan Request Schema
 */
export const rescanRequestSchema = z
  .object({
    host: z.string().optional(),
    port: z.union([z.number().int(), z.string()]).optional(),
    modelsPath: z.string().optional(),
    llamaServerPath: z.string().optional(),
    ctx_size: z.number().int().optional(),
    batch_size: z.number().int().optional(),
    threads: z.number().int().optional(),
    gpu_layers: z.number().int().optional(),
  })
  .strict()
  .describe("Rescan models request");

/**
 * Logger Config Request Schema
 */
export const loggerConfigRequestSchema = z
  .object({
    level: z.enum(["error", "warn", "info", "debug"]).optional(),
    enableConsole: z.boolean().optional(),
    enableFile: z.boolean().optional(),
  })
  .strict()
  .describe("Logger configuration request");

/**
 * WebSocket Message Schema (Generic)
 */
export const websocketMessageSchema = z
  .object({
    type: z.string().min(1).describe("Message type identifier"),
    data: z.unknown().describe("Message payload"),
    timestamp: z.number().int().positive().describe("Unix timestamp"),
    requestId: z.string().uuid().optional().describe("Request ID for correlation"),
  })
  .strict()
  .describe("Generic WebSocket message");

/**
 * Metrics Message Schema
 */
export const metricsMessageSchema = websocketMessageSchema.extend({
  type: z.literal("metrics"),
  data: systemMetricsSchema,
}).describe("WebSocket metrics message");

/**
 * Log Level Schema
 */
export const logLevelSchema = z.enum(["info", "warn", "error", "debug"]).describe("Log level");

/**
 * Log Entry Schema
 */
export const logEntrySchema = z
  .object({
    id: z.string().uuid().describe("Unique log ID"),
    level: logLevelSchema,
    message: z.union([z.string(), z.record(z.string(), z.unknown())]).describe("Log message"),
    timestamp: z.string().datetime().describe("ISO timestamp"),
    source: z.string().optional().describe("Log source"),
    context: z.record(z.string(), z.unknown()).optional().describe("Additional context"),
  })
  .strict()
  .describe("Log entry");

/**
 * Log Message Schema
 */
export const logMessageSchema = websocketMessageSchema.extend({
  type: z.literal("log"),
  data: logEntrySchema,
}).describe("WebSocket log message");

/**
 * System Event Schema
 */
export const systemEventSchema = z
  .object({
    eventType: z.string().min(1).describe("Event type"),
    severity: z.enum(["info", "warning", "error", "critical"]).describe("Severity level"),
    message: z.string().min(1).describe("Event message"),
    details: z.record(z.string(), z.unknown()).optional().describe("Event details"),
    timestamp: z.string().datetime().describe("ISO timestamp"),
  })
  .strict()
  .describe("System event");

/**
 * System Event Message Schema
 */
export const systemEventMessageSchema = websocketMessageSchema.extend({
  type: z.literal("system_event"),
  data: systemEventSchema,
}).describe("WebSocket system event message");

/**
 * Legacy Config Schema
 * @deprecated Use specific config schemas instead
 */
export const configSchema = z.object({
  models: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      options: z.object({
        temperature: z.number().min(0).max(1),
        top_p: z.number().min(0).max(1),
      }),
    })
  ),
  parameters: z.array(
    z.object({
      category: z.string().min(1),
      paramName: z.string().min(1),
    })
  ),
}).strict().describe("Legacy config schema");

/**
 * Legacy Parameter Schema
 * @deprecated Use modelConfigSchema instead
 */
export const parameterSchema = z.object({
  category: z.string().min(1),
  paramName: z.string().min(1),
}).strict().describe("Legacy parameter schema");

/**
 * Legacy WebSocket Schema
 * @deprecated Use websocketMessageSchema instead
 */
export const websocketSchema = z.object({
  message: z.string().min(1),
  clientId: z.string().uuid(),
  timestamp: z.number().int(),
}).strict().describe("Legacy websocket schema");

// Types
export type StartModelRequest = z.infer<typeof startModelRequestSchema>;
export type StartModelResponse = z.infer<typeof startModelResponseSchema>;
export type StopModelRequest = z.infer<typeof stopModelRequestSchema>;
export type StopModelResponse = z.infer<typeof stopModelResponseSchema>;
export type SystemMetrics = z.infer<typeof systemMetricsSchema>;
export type MetricsResponse = z.infer<typeof metricsResponseSchema>;
export type WebSocketMessage<T = unknown> = z.infer<typeof websocketMessageSchema> & { data: T };
export type MetricsMessage = z.infer<typeof metricsMessageSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type LogMessage = z.infer<typeof logMessageSchema>;
export type SystemEvent = z.infer<typeof systemEventSchema>;
export type SystemEventMessage = z.infer<typeof systemEventMessageSchema>;
export type Config = z.infer<typeof configSchema>;
export type Parameter = z.infer<typeof parameterSchema>;
export type LegacyWebSocket = z.infer<typeof websocketSchema>;
export type RescanRequest = z.infer<typeof rescanRequestSchema>;
export type LoggerConfigRequest = z.infer<typeof loggerConfigRequestSchema>;

// Utility Functions
export function parseStartModelRequest(data: unknown): StartModelRequest {
  return startModelRequestSchema.parse(data);
}

export function parseStopModelRequest(data: unknown): StopModelRequest {
  return stopModelRequestSchema.parse(data);
}

export function parseSystemMetrics(data: unknown): SystemMetrics {
  return systemMetricsSchema.parse(data);
}

export function parseLogEntry(data: unknown): LogEntry {
  return logEntrySchema.parse(data);
}

export function safeParseSystemMetrics(data: unknown) {
  return systemMetricsSchema.safeParse(data);
}
