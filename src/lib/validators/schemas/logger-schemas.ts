// src/lib/validators/schemas/logger-schemas.ts

import { z } from "zod";

/**
 * Logger Configuration Schema
 * Validates Winston logger configuration
 */
export const loggerConfigSchema = z
  .object({
    consoleLevel: z
      .enum(["error", "warn", "info", "debug"])
      .describe("Console logging level"),
    fileLevel: z
      .enum(["error", "warn", "info", "debug"])
      .describe("File logging level"),
    errorLevel: z
      .enum(["error", "warn"])
      .describe("Error file logging level"),
    maxFileSize: z
      .string()
      .regex(/^\d+[kmg]$/i)
      .describe("Maximum log file size (e.g., '20m', '1g')"),
    maxFiles: z
      .string()
      .regex(/^\d+[dw]$/)
      .describe("Maximum number of log files (e.g., '30d', '14w')"),
    enableFileLogging: z
      .boolean()
      .describe("Enable file logging"),
    enableConsoleLogging: z
      .boolean()
      .describe("Enable console logging"),
  })
  .strict()
  .describe("Logger configuration settings");

/**
 * Logger Settings Schema
 * Validates logger configuration form
 */
export const loggerSettingsSchema = z
  .object({
    consoleLevel: z
      .enum(["error", "warn", "info", "debug"])
      .describe("Console log level"),
    fileLevel: z
      .enum(["error", "warn", "info", "debug"])
      .describe("File log level"),
    errorLevel: z
      .enum(["error", "warn"])
      .describe("Error file log level"),
    maxFileSize: z
      .string()
      .regex(/^\d+[kmg]$/i)
      .describe("Max file size (e.g., 20m)"),
    maxFiles: z
      .string()
      .regex(/^\d+[dw]$/)
      .describe("Max files (e.g., 30d)"),
    enableFileLogging: z
      .boolean()
      .describe("Enable file logging"),
    enableConsoleLogging: z
      .boolean()
      .describe("Enable console logging"),
  })
  .strict()
  .describe("Logger settings form data");

// Types
export type LoggerConfig = z.infer<typeof loggerConfigSchema>;
export type LoggerSettings = z.infer<typeof loggerSettingsSchema>;
