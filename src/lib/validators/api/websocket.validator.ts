// src/lib/validators/api/websocket.validator.ts

import { z } from "zod";
import { systemMetricsSchema } from "./metrics.validator";
import { logLevelSchema, logEntrySchema } from "./logger.validator";
import { systemEventSchema } from "./system-event.validator";

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
 * Log Message Schema
 */
export const logMessageSchema = websocketMessageSchema.extend({
  type: z.literal("log"),
  data: logEntrySchema,
}).describe("WebSocket log message");

/**
 * System Event Message Schema
 */
export const systemEventMessageSchema = websocketMessageSchema.extend({
  type: z.literal("system_event"),
  data: systemEventSchema,
}).describe("WebSocket system event message");

// Types
export type WebSocketMessage<T = unknown> = z.infer<typeof websocketMessageSchema> & {
  data: T;
};
export type MetricsMessage = z.infer<typeof metricsMessageSchema>;
export type LogMessage = z.infer<typeof logMessageSchema>;
export type SystemEventMessage = z.infer<typeof systemEventMessageSchema>;
