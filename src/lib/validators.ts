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
// Combined Form Validators (moved to separate file)
// ============================================================================

export {
  settingsFormSchema,
  configurationSaveSchema,
  configUpdateRequestSchema,
  configurationGetSchema,
  type SettingsForm,
  type ConfigurationSaveRequest,
  type ConfigurationUpdateRequest,
  type ConfigurationGetResponse,
} from "./validators/combined-forms.validator";

// ============================================================================
// WebSocket Message Types (moved to separate file)
// ============================================================================

export {
  modelStatusUpdateMessageSchema,
  type ModelStatusUpdateMessage,
} from "./validators/websocket-messages.validator";
