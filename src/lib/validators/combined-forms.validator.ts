import { z } from "zod";
import { appConfigSchema } from "./app-config.validator";
import { llamaServerConfigSchema } from "./server-config.validator";
import { generalSettingsSchema } from "./app-config.validator";
import { loggerSettingsSchema } from "./server-config.validator";

/**
 * Settings Form Schema
 * Complete form validation for the Settings page
 */
export const settingsFormSchema = z
  .object({
    appConfig: appConfigSchema.partial().optional(),
    serverConfig: llamaServerConfigSchema.partial().optional(),
    general: generalSettingsSchema.partial().optional(),
    logger: loggerSettingsSchema.partial().optional(),
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

/**
 * Configuration Save Request Schema
 * Validates requests to save configuration
 */
export const configurationSaveSchema = z
  .object({
    appConfig: appConfigSchema.partial().optional(),
    serverConfig: llamaServerConfigSchema.partial().optional(),
  })
  .strict()
  .describe("Configuration save request");

export type ConfigurationSaveRequest = z.infer<typeof configurationSaveSchema>;

/**
 * Configuration Update Request Schema
 * Validates configuration update requests with validation
 */
export const configUpdateRequestSchema = configurationSaveSchema.refine(
  (data) => data.appConfig !== undefined || data.serverConfig !== undefined,
  {
    message: "At least one of appConfig or serverConfig must be provided",
  }
);

export type ConfigurationUpdateRequest = z.infer<typeof configUpdateRequestSchema>;

/**
 * Configuration Get Response Schema
 * Validates configuration API responses
 */
export const configurationGetSchema = z
  .object({
    serverConfig: llamaServerConfigSchema.optional(),
    appConfig: appConfigSchema.optional(),
    message: z.string().optional(),
  })
  .strict()
  .describe("Configuration get response");

export type ConfigurationGetResponse = z.infer<typeof configurationGetSchema>;
