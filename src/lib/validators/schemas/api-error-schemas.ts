// src/lib/validators/schemas/api-error-schemas.ts

import { z } from "zod";

/**
 * Generic WebSocket Message Schema
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
export type WebSocketMessage<T = unknown> = z.infer<typeof websocketMessageSchema> & { data: T };
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type LogMessage = z.infer<typeof logMessageSchema>;
export type SystemEvent = z.infer<typeof systemEventSchema>;
export type SystemEventMessage = z.infer<typeof systemEventMessageSchema>;
export type Config = z.infer<typeof configSchema>;
export type Parameter = z.infer<typeof parameterSchema>;
export type LegacyWebSocket = z.infer<typeof websocketSchema>;

// Parser Functions
export function parseLogEntry(data: unknown): LogEntry {
  return logEntrySchema.parse(data);
}
