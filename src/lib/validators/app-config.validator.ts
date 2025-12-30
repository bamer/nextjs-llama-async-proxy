// src/lib/validators/app-config.validator.ts

import { z } from "zod";

/**
 * Application Configuration Schema
 * Validates the main application settings from app-config.json
 */
export const appConfigSchema = z
  .object({
    maxConcurrentModels: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe("Maximum number of concurrent models (1-10)"),
    logLevel: z
      .enum(["error", "warn", "info", "debug", "verbose"])
      .describe("Logging level for the application"),
    autoUpdate: z
      .boolean()
      .describe("Enable automatic updates for models and configuration"),
    notificationsEnabled: z
      .boolean()
      .describe("Enable system notifications"),
  })
  .strict()
  .describe("Application configuration settings");

/**
 * General Settings Schema
 * Validates general application settings form
 */
export const generalSettingsSchema = z
  .object({
    basePath: z
      .string()
      .min(1)
      .describe("Base path for models"),
    logLevel: z
      .enum(["error", "warn", "info", "debug"])
      .describe("Application log level"),
    maxConcurrentModels: z
      .number()
      .int()
      .min(1)
      .max(10)
      .describe("Maximum concurrent models"),
    autoUpdate: z
      .boolean()
      .describe("Enable auto updates"),
    notificationsEnabled: z
      .boolean()
      .describe("Enable notifications"),
    llamaServerPath: z
      .string()
      .min(1)
      .describe("Path to llama-server binary"),
  })
  .strict()
  .describe("General settings form data");

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse and validate application configuration
 * @param data - Raw configuration data
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseAppConfig(data: unknown): AppConfig {
  return appConfigSchema.parse(data);
}

/**
 * Safe parse application configuration (returns result instead of throwing)
 * @param data - Raw configuration data
 * @returns Zod parse result
 */
export function safeParseAppConfig(data: unknown) {
  return appConfigSchema.safeParse(data);
}

/**
 * Parse and validate settings form data
 * @param data - Raw form data
 * @returns Parsed and validated form data
 * @throws ZodError if validation fails
 */
export function parseSettingsForm(data: unknown): SettingsForm {
  return settingsFormSchema.parse(data);
}

/**
 * Safe parse settings form data
 * @param data - Raw form data
 * @returns Zod parse result
 */
export function safeParseSettingsForm(data: unknown) {
  return settingsFormSchema.safeParse(data);
}

// ============================================================================
// Types
// ============================================================================

export type AppConfig = z.infer<typeof appConfigSchema>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;

/**
 * Settings Form Schema
 * Complete form validation for the Settings page
 */
const settingsFormSchema = z
  .object({
    appConfig: appConfigSchema.partial().optional(),
    serverConfig: z.any().optional(),
    general: generalSettingsSchema.partial().optional(),
    logger: z.any().optional(),
    modelDefaults: z
      .object({
        ctx_size: z.number().int().min(0).optional(),
        batch_size: z.number().int().min(1).optional(),
        ubatch_size: z.number().int().min(1).optional(),
        threads: z.number().int().min(-1).optional(),
        gpu_layers: z.number().int().min(-1).optional(),
        main_gpu: z.number().int().min(0).optional(),
        temperature: z.number().min(0).optional(),
        top_k: z.number().int().min(0).optional(),
        top_p: z.number().min(0).max(1).optional(),
      })
      .optional()
      .describe("Default model parameters"),
  })
  .strict()
  .describe("Complete settings form data");

export type SettingsForm = z.infer<typeof settingsFormSchema>;
