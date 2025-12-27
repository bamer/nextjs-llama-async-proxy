// src/lib/validators.ts

import { z } from "zod";

// ============================================================================
// 1. Configuration Schemas
// ============================================================================

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

// ============================================================================
// 2. Model State Schemas
// ============================================================================

/**
 * Model Status Enum
 * Valid status values for model state
 */
export const modelStatusSchema = z.enum([
  "idle",
  "loading",
  "running",
  "stopping",
  "error",
]).describe("Current status of a model");

/**
 * Llama Model Schema
 * Validates model information from llama-server
 */
export const llamaModelSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Unique identifier for the model"),
    name: z
      .string()
      .min(1)
      .describe("Human-readable model name"),
    size: z
      .number()
      .nonnegative()
      .describe("Model file size in bytes"),
    type: z
      .string()
      .min(1)
      .describe("Model type (e.g., 'gguf', 'bin')"),
    modified_at: z
      .number()
      .int()
      .describe("Unix timestamp of last modification"),
    path: z
      .string()
      .min(1)
      .describe("Full file path to the model"),
    availableTemplates: z
      .array(z.string())
      .optional()
      .describe("List of available prompt templates"),
    template: z
      .string()
      .optional()
      .describe("Currently selected template"),
  })
  .strict()
  .describe("Llama model information");

/**
 * Model Configuration Schema
 * Validates full model configuration
 */
export const modelConfigSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Unique model identifier"),
    name: z
      .string()
      .min(1)
      .describe("Model name"),
    type: z
      .enum(["llama", "mistral", "other"])
      .describe("Model architecture type"),
      parameters: z
      .record(z.string(), z.unknown())
      .describe("Model-specific parameters"),
    status: modelStatusSchema,
    createdAt: z
      .string()
      .datetime()
      .describe("ISO timestamp of model creation"),
    updatedAt: z
      .string()
      .datetime()
      .describe("ISO timestamp of last update"),
    template: z
      .string()
      .optional()
      .describe("Selected prompt template"),
    availableTemplates: z
      .array(z.string())
      .optional()
      .describe("Available templates for this model"),
  })
  .strict()
  .describe("Complete model configuration");

// ============================================================================
// 3. API Request/Response Schemas
// ============================================================================

/**
 * Start Model Request Schema
 * Validates requests to load/start a model
 */
export const startModelRequestSchema = z
  .object({
    model: z
      .string()
      .min(1)
      .describe("Name or ID of the model to start"),
    template: z
      .string()
      .optional()
      .describe("Optional prompt template to use"),
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant", "system", "tool"]),
          content: z.string(),
        })
      )
      .optional()
      .describe("Optional initial messages"),
    max_tokens: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Maximum tokens to generate"),
  })
  .strict()
  .describe("Request to start/load a model");

/**
 * Start Model Response Schema
 * Validates API responses for model start operations
 */
export const startModelResponseSchema = z
  .object({
    model: z
      .string()
      .describe("Name of the model"),
    status: z
      .enum(["loaded", "loading", "error", "not_found"])
      .describe("Current status of the model"),
    message: z
      .string()
      .optional()
      .describe("Human-readable status message"),
    data: z
      .unknown()
      .optional()
      .describe("Additional response data from llama-server"),
  })
  .strict()
  .describe("Response from model start operation");

/**
 * Stop Model Request Schema
 * Validates requests to stop a model
 */
export const stopModelRequestSchema = z
  .object({
    force: z
      .boolean()
      .optional()
      .default(false)
      .describe("Force stop the model process"),
  })
  .strict()
  .describe("Request to stop a model");

/**
 * Stop Model Response Schema
 * Validates API responses for model stop operations
 */
export const stopModelResponseSchema = z
  .object({
    model: z
      .string()
      .describe("Name of the model"),
    status: z
      .enum(["stopped", "note", "error"])
      .describe("Status of the stop operation"),
    message: z
      .string()
      .optional()
      .describe("Human-readable status message"),
    info: z
      .string()
      .optional()
      .describe("Additional information"),
  })
  .strict()
  .describe("Response from model stop operation");

/**
 * System Metrics Schema
 * Validates system monitoring metrics
 */
export const systemMetricsSchema = z
  .object({
    cpuUsage: z
      .number()
      .min(0)
      .max(100)
      .describe("CPU usage percentage"),
    memoryUsage: z
      .number()
      .min(0)
      .max(100)
      .describe("Memory usage percentage"),
    diskUsage: z
      .number()
      .min(0)
      .max(100)
      .describe("Disk usage percentage"),
    activeModels: z
      .number()
      .int()
      .nonnegative()
      .describe("Number of active models"),
    totalRequests: z
      .number()
      .int()
      .nonnegative()
      .describe("Total number of requests processed"),
    avgResponseTime: z
      .number()
      .nonnegative()
      .describe("Average response time in milliseconds"),
    uptime: z
      .number()
      .nonnegative()
      .describe("Server uptime in seconds"),
    timestamp: z
      .string()
      .datetime()
      .describe("ISO timestamp of metrics collection"),
    gpuUsage: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("GPU usage percentage if available"),
    gpuMemoryUsage: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .describe("GPU memory usage percentage"),
    gpuMemoryTotal: z
      .number()
      .nonnegative()
      .optional()
      .describe("Total GPU memory in bytes"),
    gpuMemoryUsed: z
      .number()
      .nonnegative()
      .optional()
      .describe("Used GPU memory in bytes"),
    gpuPowerUsage: z
      .number()
      .nonnegative()
      .optional()
      .describe("GPU power usage in watts"),
    gpuPowerLimit: z
      .number()
      .nonnegative()
      .optional()
      .describe("GPU power limit in watts"),
    gpuTemperature: z
      .number()
      .nonnegative()
      .optional()
      .describe("GPU temperature in Celsius"),
    gpuName: z
      .string()
      .optional()
      .describe("GPU device name"),
  })
  .strict()
  .describe("System monitoring metrics");

/**
 * Metrics Response Schema
 * Validates API response containing system metrics
 */
export const metricsResponseSchema = z
  .object({
    metrics: systemMetricsSchema.optional(),
    error: z
      .string()
      .optional()
      .describe("Error message if metrics unavailable"),
    timestamp: z
      .string()
      .datetime()
      .describe("ISO timestamp of response"),
  })
  .strict()
  .describe("Response containing system metrics");

// ============================================================================
// 4. WebSocket Message Schemas
// ============================================================================

/**
 * WebSocket Message Schema (Generic)
 * Base schema for all WebSocket messages
 */
export const websocketMessageSchema = z
  .object({
    type: z
      .string()
      .min(1)
      .describe("Message type identifier"),
    data: z
      .unknown()
      .describe("Message payload data"),
    timestamp: z
      .number()
      .int()
      .positive()
      .describe("Unix timestamp of message"),
    requestId: z
      .string()
      .uuid()
      .optional()
      .describe("Optional request ID for correlation"),
  })
  .strict()
  .describe("Generic WebSocket message structure");

/**
 * Metrics Message Schema
 * Validates WebSocket messages containing system metrics
 */
export const metricsMessageSchema = websocketMessageSchema.extend({
  type: z.literal("metrics"),
  data: systemMetricsSchema,
}).describe("WebSocket message containing system metrics");

/**
 * Log Level Schema
 * Valid log levels
 */
export const logLevelSchema = z.enum(["info", "warn", "error", "debug"]).describe("Log level");

/**
 * Log Entry Schema
 * Validates log entry structures
 */
export const logEntrySchema = z
  .object({
    id: z
      .string()
      .uuid()
      .describe("Unique log entry identifier"),
    level: logLevelSchema,
    message: z
      .union([
        z.string(),
        z.record(z.string(), z.unknown())
      ])
      .describe("Log message or structured data"),
    timestamp: z
      .string()
      .datetime()
      .describe("ISO timestamp of log entry"),
    source: z
      .string()
      .optional()
      .describe("Source of the log entry"),
    context: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Additional context information"),
  })
  .strict()
  .describe("Log entry structure");

/**
 * Log Message Schema
 * Validates WebSocket messages containing log entries
 */
export const logMessageSchema = websocketMessageSchema.extend({
  type: z.literal("log"),
  data: logEntrySchema,
}).describe("WebSocket message containing log entry");

/**
 * System Event Schema
 * Validates system event data
 */
export const systemEventSchema = z
  .object({
    eventType: z
      .string()
      .min(1)
      .describe("Type of system event"),
    severity: z
      .enum(["info", "warning", "error", "critical"])
      .describe("Event severity level"),
    message: z
      .string()
      .min(1)
      .describe("Event message"),
    details: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Additional event details"),
    timestamp: z
      .string()
      .datetime()
      .describe("ISO timestamp of event"),
  })
  .strict()
  .describe("System event structure");

/**
 * System Event Message Schema
 * Validates WebSocket messages containing system events
 */
export const systemEventMessageSchema = websocketMessageSchema.extend({
  type: z.literal("system_event"),
  data: systemEventSchema,
}).describe("WebSocket message containing system event");

/**
 * Model Status Update Schema
 * Validates model status change events
 */
export const modelStatusUpdateSchema = z
  .object({
    modelId: z
      .string()
      .min(1)
      .describe("Model identifier"),
    oldStatus: modelStatusSchema,
    newStatus: modelStatusSchema,
    timestamp: z
      .string()
      .datetime()
      .describe("ISO timestamp of status change"),
    error: z
      .string()
      .optional()
      .describe("Error message if status is 'error'"),
  })
  .strict()
  .describe("Model status update event");

/**
 * Model Status Update Message Schema
 * Validates WebSocket messages for model status changes
 */
export const modelStatusUpdateMessageSchema = websocketMessageSchema.extend({
  type: z.literal("model_status_update"),
  data: modelStatusUpdateSchema,
}).describe("WebSocket message containing model status update");

// ============================================================================
// 5. Form Validation Schemas
// ============================================================================

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

/**
 * Rescan Request Schema
 * Validates requests to rescan for models
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
 * Validates logger configuration requests
 */
export const loggerConfigRequestSchema = z
  .object({
    level: z.enum(["error", "warn", "info", "debug"]).optional(),
    enableConsole: z.boolean().optional(),
    enableFile: z.boolean().optional(),
  })
  .strict()
  .describe("Logger configuration request");

// ============================================================================
// 6. Legacy/Utility Schemas (Maintained for backward compatibility)
// ============================================================================

/**
 * Legacy Config Schema
 * Kept for backward compatibility with existing code
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
}).strict().describe("Legacy config schema - use specific schemas");

/**
 * Legacy Parameter Schema
 * Kept for backward compatibility
 * @deprecated Use modelConfigSchema instead
 */
export const parameterSchema = z.object({
  category: z.string().min(1),
  paramName: z.string().min(1),
}).strict().describe("Legacy parameter schema");

/**
 * Legacy WebSocket Schema
 * Kept for backward compatibility
 * @deprecated Use websocketMessageSchema instead
 */
export const websocketSchema = z.object({
  message: z.string().min(1),
  clientId: z.string().uuid(),
  timestamp: z.number().int(),
}).strict().describe("Legacy websocket schema - use websocketMessageSchema");

/**
 * Model Template Schema
 * Validates individual model template entries
 */
export const modelTemplateSchema = z
  .object({
    name: z.string().min(1).describe("Template name identifier"),
    template: z.string().min(1).describe("Template value/pattern"),
  })
  .strict()
  .describe("Individual model template");

/**
 * Model Templates Configuration Schema
 * Validates the complete model templates configuration structure
 */
export const modelTemplatesConfigSchema = z
  .object({
    model_templates: z.record(z.string(), z.string().min(1)).describe("Record of model templates"),
    default_model: z.string().nullable().optional().describe("Default model template"),
  })
  .strict()
  .describe("Model templates configuration");

/**
 * Model Template Save Request Schema
 * Validates requests to save model templates
 */
export const modelTemplateSaveRequestSchema = z
  .object({
    model_templates: z.record(z.string(), z.string().min(1)).describe("Templates to save"),
  })
  .strict()
  .describe("Request to save model templates");

/**
 * Model Template Response Schema
 * Validates API responses containing model templates
 */
export const modelTemplateResponseSchema = z
  .object({
    model_templates: z.record(z.string(), z.string().min(1)).describe("Loaded templates"),
    message: z.string().optional().describe("Response message"),
  })
  .strict()
  .describe("Response containing model templates");

// ============================================================================
// 7. Inferred Types (TypeScript types from schemas)
// ============================================================================

// Configuration Types
export type AppConfig = z.infer<typeof appConfigSchema>;
export type LlamaServerConfig = z.infer<typeof llamaServerConfigSchema>;
export type LlamaServerConfigExtended = z.infer<typeof llamaServerConfigExtendedSchema>;
export type LoggerConfig = z.infer<typeof loggerConfigSchema>;

// Model State Types
export type ModelStatus = z.infer<typeof modelStatusSchema>;
export type LlamaModel = z.infer<typeof llamaModelSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;

// API Request/Response Types
export type StartModelRequest = z.infer<typeof startModelRequestSchema>;
export type StartModelResponse = z.infer<typeof startModelResponseSchema>;
export type StopModelRequest = z.infer<typeof stopModelRequestSchema>;
export type StopModelResponse = z.infer<typeof stopModelResponseSchema>;
export type SystemMetrics = z.infer<typeof systemMetricsSchema>;
export type MetricsResponse = z.infer<typeof metricsResponseSchema>;

// WebSocket Message Types
export type WebSocketMessage<T = unknown> = z.infer<typeof websocketMessageSchema> & { data: T };
export type MetricsMessage = z.infer<typeof metricsMessageSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type LogMessage = z.infer<typeof logMessageSchema>;
export type SystemEvent = z.infer<typeof systemEventSchema>;
export type SystemEventMessage = z.infer<typeof systemEventMessageSchema>;
export type ModelStatusUpdate = z.infer<typeof modelStatusUpdateSchema>;
export type ModelStatusUpdateMessage = z.infer<typeof modelStatusUpdateMessageSchema>;

// Form Validation Types
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type LlamaServerSettings = z.infer<typeof llamaServerSettingsSchema>;
export type LoggerSettings = z.infer<typeof loggerSettingsSchema>;
export type SettingsForm = z.infer<typeof settingsFormSchema>;
export type ConfigurationSaveRequest = z.infer<typeof configurationSaveSchema>;
export type ConfigurationUpdateRequest = z.infer<typeof configUpdateRequestSchema>;
export type ConfigurationGetResponse = z.infer<typeof configurationGetSchema>;
export type RescanRequest = z.infer<typeof rescanRequestSchema>;
export type LoggerConfigRequest = z.infer<typeof loggerConfigRequestSchema>;

// Legacy Types (for backward compatibility)
export type Config = z.infer<typeof configSchema>;
export type Parameter = z.infer<typeof parameterSchema>;
export type LegacyWebSocket = z.infer<typeof websocketSchema>;

// Model Template Types
export type ModelTemplate = z.infer<typeof modelTemplateSchema>;
export type ModelTemplatesConfig = z.infer<typeof modelTemplatesConfigSchema>;
export type ModelTemplateSaveRequest = z.infer<typeof modelTemplateSaveRequestSchema>;
export type ModelTemplateResponse = z.infer<typeof modelTemplateResponseSchema>;

// ============================================================================
// 8. Utility Functions
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
 * Parse and validate Llama server configuration
 * @param data - Raw server configuration data
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseLlamaServerConfig(data: unknown): LlamaServerConfig {
  return llamaServerConfigSchema.parse(data);
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
 * Parse and validate model data
 * @param data - Raw model data
 * @returns Parsed and validated model
 * @throws ZodError if validation fails
 */
export function parseLlamaModel(data: unknown): LlamaModel {
  return llamaModelSchema.parse(data);
}

/**
 * Parse and validate system metrics
 * @param data - Raw metrics data
 * @returns Parsed and validated metrics
 * @throws ZodError if validation fails
 */
export function parseSystemMetrics(data: unknown): SystemMetrics {
  return systemMetricsSchema.parse(data);
}

/**
 * Parse and validate log entry
 * @param data - Raw log entry data
 * @returns Parsed and validated log entry
 * @throws ZodError if validation fails
 */
export function parseLogEntry(data: unknown): LogEntry {
  return logEntrySchema.parse(data);
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
 * Parse and validate start model request
 * @param data - Raw request data
 * @returns Parsed and validated request
 * @throws ZodError if validation fails
 */
export function parseStartModelRequest(data: unknown): StartModelRequest {
  return startModelRequestSchema.parse(data);
}

/**
 * Parse and validate stop model request
 * @param data - Raw request data
 * @returns Parsed and validated request
 * @throws ZodError if validation fails
 */
export function parseStopModelRequest(data: unknown): StopModelRequest {
  return stopModelRequestSchema.parse(data);
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
 * Safe parse Llama server configuration
 * @param data - Raw server configuration data
 * @returns Zod parse result
 */
export function safeParseLlamaServerConfig(data: unknown) {
  return llamaServerConfigSchema.safeParse(data);
}

/**
 * Safe parse logger configuration
 * @param data - Raw logger configuration data
 * @returns Zod parse result
 */
export function safeParseLoggerConfig(data: unknown) {
  return loggerConfigSchema.safeParse(data);
}

/**
 * Safe parse settings form data
 * @param data - Raw form data
 * @returns Zod parse result
 */
export function safeParseSettingsForm(data: unknown) {
  return settingsFormSchema.safeParse(data);
}

/**
 * Safe parse system metrics
 * @param data - Raw metrics data
 * @returns Zod parse result
 */
export function safeParseSystemMetrics(data: unknown) {
  return systemMetricsSchema.safeParse(data);
}

/**
 * Parse and validate model template
 * @param data - Raw model template data
 * @returns Parsed and validated template
 * @throws ZodError if validation fails
 */
export function parseModelTemplate(data: unknown): ModelTemplate {
  return modelTemplateSchema.parse(data);
}

/**
 * Parse and validate model templates configuration
 * @param data - Raw templates configuration data
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseModelTemplatesConfig(data: unknown): ModelTemplatesConfig {
  return modelTemplatesConfigSchema.parse(data);
}

/**
 * Parse and validate model template save request
 * @param data - Raw save request data
 * @returns Parsed and validated request
 * @throws ZodError if validation fails
 */
export function parseModelTemplateSaveRequest(data: unknown): ModelTemplateSaveRequest {
  return modelTemplateSaveRequestSchema.parse(data);
}

/**
 * Parse and validate model template response
 * @param data - Raw response data
 * @returns Parsed and validated response
 * @throws ZodError if validation fails
 */
export function parseModelTemplateResponse(data: unknown): ModelTemplateResponse {
  return modelTemplateResponseSchema.parse(data);
}

/**
 * Safe parse model templates configuration
 * @param data - Raw templates configuration data
 * @returns Zod parse result
 */
export function safeParseModelTemplatesConfig(data: unknown) {
  return modelTemplatesConfigSchema.safeParse(data);
}

/**
 * Safe parse model template save request
 * @param data - Raw save request data
 * @returns Zod parse result
 */
export function safeParseModelTemplateSaveRequest(data: unknown) {
  return modelTemplateSaveRequestSchema.safeParse(data);
}
