// src/lib/validators/api/logger.validator.ts

import { z } from "zod";

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

// Types
export type LoggerConfigRequest = z.infer<typeof loggerConfigRequestSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
