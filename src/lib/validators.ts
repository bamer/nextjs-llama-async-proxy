// src/lib/validators.ts

// ============================================================================
// Public API - Re-exports from domain-specific validator files
// ============================================================================

// App Config Validators
export {
  appConfigSchema,
  generalSettingsSchema,
  parseAppConfig,
  safeParseAppConfig,
  parseSettingsForm,
  safeParseSettingsForm,
  type AppConfig,
  type GeneralSettings,
  type SettingsForm as AppSettingsForm,
} from "./validators/app-config.validator";

// Server Config Validators
export {
  llamaServerConfigSchema,
  llamaServerConfigExtendedSchema,
  loggerConfigSchema,
  llamaServerSettingsSchema,
  loggerSettingsSchema,
  parseLlamaServerConfig,
  safeParseLlamaServerConfig,
  parseLlamaServerConfigExtended,
  parseLoggerConfig,
  safeParseLoggerConfig,
  type LlamaServerConfig,
  type LlamaServerConfigExtended,
  type LoggerConfig,
  type LlamaServerSettings,
  type LoggerSettings,
} from "./validators/server-config.validator";

// Model Config Validators
export {
  modelStatusSchema,
  llamaModelSchema,
  modelConfigSchema,
  modelTemplateSchema,
  modelTemplatesConfigSchema,
  modelTemplateSaveRequestSchema,
  modelTemplateResponseSchema,
  modelStatusUpdateSchema,
  parseLlamaModel,
  parseModelTemplate,
  parseModelTemplatesConfig,
  parseModelTemplateSaveRequest,
  parseModelTemplateResponse,
  safeParseModelTemplatesConfig,
  safeParseModelTemplateSaveRequest,
  type ModelStatus,
  type LlamaModel,
  type ModelConfig,
  type ModelTemplate,
  type ModelTemplatesConfig,
  type ModelTemplateSaveRequest,
  type ModelTemplateResponse,
  type ModelStatusUpdate,
} from "./validators/model-config.validator";

// API Validators
export {
  startModelRequestSchema,
  startModelResponseSchema,
  stopModelRequestSchema,
  stopModelResponseSchema,
  systemMetricsSchema,
  metricsResponseSchema,
  rescanRequestSchema,
  loggerConfigRequestSchema,
  websocketMessageSchema,
  metricsMessageSchema,
  logLevelSchema,
  logEntrySchema,
  logMessageSchema,
  systemEventSchema,
  systemEventMessageSchema,
  configSchema,
  parameterSchema,
  websocketSchema,
  parseStartModelRequest,
  parseStopModelRequest,
  parseSystemMetrics,
  parseLogEntry,
  safeParseSystemMetrics,
  type StartModelRequest,
  type StartModelResponse,
  type StopModelRequest,
  type StopModelResponse,
  type SystemMetrics,
  type MetricsResponse,
  type WebSocketMessage,
  type MetricsMessage,
  type LogLevel,
  type LogEntry,
  type LogMessage,
  type SystemEvent,
  type SystemEventMessage,
  type Config,
  type Parameter,
  type LegacyWebSocket,
  type RescanRequest,
  type LoggerConfigRequest,
} from "./validators/api.validator";

// ============================================================================
// Combined Form Validators
// ============================================================================

import { z } from "zod";
import { appConfigSchema } from "./validators/app-config.validator";
import { llamaServerConfigSchema } from "./validators/server-config.validator";
import { generalSettingsSchema } from "./validators/app-config.validator";
import { loggerSettingsSchema } from "./validators/server-config.validator";

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

// ============================================================================
// WebSocket Message Types (Combined from all domains)
// ============================================================================

import {
  websocketMessageSchema as wsMessageSchema,
} from "./validators/api.validator";
import { modelStatusUpdateSchema } from "./validators/model-config.validator";

/**
 * Model Status Update Message Schema
 * Validates WebSocket messages for model status changes
 */
export const modelStatusUpdateMessageSchema = wsMessageSchema.extend({
  type: z.literal("model_status_update"),
  data: modelStatusUpdateSchema,
}).describe("WebSocket message containing model status update");

export type ModelStatusUpdateMessage = z.infer<typeof modelStatusUpdateMessageSchema>;
