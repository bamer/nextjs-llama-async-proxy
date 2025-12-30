// src/lib/validators/server-config.validator.ts

import { z } from "zod";

/**
 * Llama Server Configuration Schema
 * Validates the llama-server configuration from llama-server-config.json
 */
export const llamaServerConfigSchema = z
  .object({
    host: z
      .string()
      .min(1)
      .max(253)
      .describe("Server hostname or IP address"),
    port: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .describe("Server port number (1-65535)"),
    basePath: z
      .string()
      .min(1)
      .describe("Base path where models are stored"),
    serverPath: z
      .string()
      .min(1)
      .describe("Full path to llama-server binary"),
    ctx_size: z
      .number()
      .int()
      .min(0)
      .describe("Context size in tokens (0 for auto)"),
    batch_size: z
      .number()
      .int()
      .min(1)
      .max(8192)
      .describe("Batch size for prompt processing"),
    threads: z
      .number()
      .int()
      .min(-1)
      .default(-1)
      .describe("Number of threads (-1 for auto)"),
    gpu_layers: z
      .number()
      .int()
      .min(-1)
      .default(-1)
      .describe("Number of GPU layers (-1 for all)"),
  })
  .strict()
  .describe("Llama server configuration settings");

/**
 * Extended Llama Server Configuration Schema
 * Full configuration with all optional parameters from LlamaService
 */
export const llamaServerConfigExtendedSchema = z
  .object({
    host: z.string().min(1).max(253),
    port: z.number().int().min(1).max(65535),
    modelPath: z.string().optional().describe("Optional specific model file path"),
    basePath: z.string().optional().describe("Path where models are stored for discovery"),
    serverPath: z.string().optional().describe("Full path to llama-server binary"),
    serverArgs: z.array(z.string()).optional().describe("Additional server arguments"),
    ctx_size: z.number().int().min(0).optional(),
    batch_size: z.number().int().min(1).max(8192).optional(),
    ubatch_size: z.number().int().min(1).optional(),
    threads: z.number().int().min(-1).optional(),
    threads_batch: z.number().int().min(-1).optional(),
    gpu_layers: z.number().int().min(-1).optional(),
    main_gpu: z.number().int().min(0).optional(),
    flash_attn: z.enum(["on", "off", "auto"]).optional(),
    n_predict: z.number().int().min(-1).optional(),
    temperature: z.number().min(0).optional(),
    top_k: z.number().int().min(0).optional(),
    top_p: z.number().min(0).max(1).optional(),
    repeat_penalty: z.number().min(0).optional(),
    seed: z.number().int().min(-1).optional(),
    verbose: z.boolean().optional(),
    embedding: z.boolean().optional(),
    cache_type_k: z.string().optional(),
    cache_type_v: z.string().optional(),
  })
  .passthrough()
  .describe("Extended llama server configuration with all optional parameters");

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
 * Llama Server Settings Schema
 * Validates llama-server configuration form
 */
export const llamaServerSettingsSchema = z
  .object({
    host: z
      .string()
      .min(1)
      .max(253)
      .describe("Server hostname or IP"),
    port: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .describe("Server port"),
    basePath: z
      .string()
      .min(1)
      .describe("Models base path"),
    serverPath: z
      .string()
      .min(1)
      .describe("Server binary path"),
    ctx_size: z
      .number()
      .int()
      .min(0)
      .describe("Context size in tokens"),
    batch_size: z
      .number()
      .int()
      .min(1)
      .max(8192)
      .describe("Batch size"),
    threads: z
      .number()
      .int()
      .min(-1)
      .describe("Number of threads"),
    gpu_layers: z
      .number()
      .int()
      .min(-1)
      .describe("GPU layers"),
  })
  .strict()
  .describe("Llama server settings form data");

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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse and validate Llama server configuration
 * @param data - Raw server configuration data
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseLlamaServerConfig(data: unknown): LlamaServerConfig {
  return llamaServerConfigSchema.parse(data);
}

/**
 * Safe parse Llama server configuration
 * @param data - Raw server configuration data
 * @returns Zod parse result
 */
export function safeParseLlamaServerConfig(data: unknown) {
  return llamaServerConfigSchema.safeParse(data);
}

/**
 * Parse and validate extended Llama server configuration
 * @param data - Raw server configuration data
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseLlamaServerConfigExtended(data: unknown): LlamaServerConfigExtended {
  return llamaServerConfigExtendedSchema.parse(data);
}

/**
 * Parse and validate logger configuration
 * @param data - Raw logger configuration data
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseLoggerConfig(data: unknown): LoggerConfig {
  return loggerConfigSchema.parse(data);
}

/**
 * Safe parse logger configuration
 * @param data - Raw logger configuration data
 * @returns Zod parse result
 */
export function safeParseLoggerConfig(data: unknown) {
  return loggerConfigSchema.safeParse(data);
}

// ============================================================================
// Types
// ============================================================================

export type LlamaServerConfig = z.infer<typeof llamaServerConfigSchema>;
export type LlamaServerConfigExtended = z.infer<typeof llamaServerConfigExtendedSchema>;
export type LoggerConfig = z.infer<typeof loggerConfigSchema>;
export type LlamaServerSettings = z.infer<typeof llamaServerSettingsSchema>;
export type LoggerSettings = z.infer<typeof loggerSettingsSchema>;
