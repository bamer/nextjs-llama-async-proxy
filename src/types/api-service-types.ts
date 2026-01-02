import { ApiResponse } from "@/types";

// Logger configuration interface
export interface LoggerConfig {
  consoleLevel: "error" | "warn" | "info" | "debug";
  fileLevel: "error" | "warn" | "info" | "debug";
  errorLevel: "error" | "warn";
  maxFileSize: string;
  maxFiles: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}

// Chart history data interface
export interface ChartHistoryData {
  cpu: Array<{ time: string; displayTime: string; value: number }>;
  memory: Array<{ time: string; displayTime: string; value: number }>;
  requests: Array<{ time: string; displayTime: string; value: number }>;
  gpuUtil: Array<{ time: string; displayTime: string; value: number }>;
  power: Array<{ time: string; displayTime: string; value: number }>;
}

// Fit params analysis result interface
export interface FitParamsAnalysis {
  recommended_ctx_size: number;
  recommended_gpu_layers: number;
  recommended_tensor_split: string | null;
  file_size_bytes: number;
  quantization_type: string | null;
  parameter_count: number;
  architecture: string | null;
  context_window: number;
  fit_params_analyzed_at: number;
  fit_params_success: number;
  fit_params_error: string | null;
  fit_params_raw_output: string | null;
  projected_cpu_memory_mb: number;
  projected_gpu_memory_mb: number;
}

// Model templates configuration interface
export interface ModelTemplatesConfig {
  model_templates: Record<string, unknown>;
  default_model: string | null;
}

// Llama server configuration interface
export interface LlamaServerConfig {
  host: string;
  port: number;
  basePath: string;
  serverPath: string;
  ctx_size: number;
  batch_size: number;
  threads: number;
  gpu_layers: number;
}

// App configuration interface
export interface AppConfig {
  basePath?: string;
  logLevel?: string;
  maxConcurrentModels?: number;
  autoUpdate?: boolean;
  notificationsEnabled?: boolean;
  llamaServerPath?: string;
}

// Full configuration interface
export interface ServerConfig {
  serverConfig: LlamaServerConfig;
  appConfig: AppConfig;
}