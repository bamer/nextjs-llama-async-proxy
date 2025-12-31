import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import { ModelConfig, SystemMetrics, LogEntry, ApiResponse, LegacySystemMetrics } from "@/types";
import { transformMetrics } from "@/utils/metrics-transformer";

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

class ApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

  // Models API
  public async getModels(): Promise<ModelConfig[]> {
    const response = await apiClient.get<ModelConfig[]>(`${this.baseUrl}/models`);
    if (response.success && response.data) {
      useStore.getState().setModels(response.data);
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch models");
  }

  public async getModel(id: string): Promise<ModelConfig> {
    const response = await apiClient.get<ModelConfig>(`${this.baseUrl}/models/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || `Failed to fetch model ${id}`);
  }

  public async createModel(model: Omit<ModelConfig, "id" | "createdAt" | "updatedAt">): Promise<ModelConfig> {
    const response = await apiClient.post<ModelConfig>(`${this.baseUrl}/models`, model);
    if (response.success && response.data) {
      useStore.getState().addModel(response.data);
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to create model");
  }

  public async updateModel(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig> {
    const response = await apiClient.put<ModelConfig>(`${this.baseUrl}/models/${id}`, updates);
    if (response.success && response.data) {
      useStore.getState().updateModel(id, response.data);
      return response.data;
    }
    throw new Error(response.error?.message || `Failed to update model ${id}`);
  }

  public async deleteModel(id: string): Promise<void> {
    const response = await apiClient.delete(`${this.baseUrl}/models/${id}`);
    if (response.success) {
      useStore.getState().removeModel(id);
      return;
    }
    throw new Error(response.error?.message || `Failed to delete model ${id}`);
  }

  public async startModel(id: string): Promise<ModelConfig> {
    const response = await apiClient.post<ModelConfig>(`${this.baseUrl}/models/${id}/start`);
    if (response.success && response.data) {
      useStore.getState().updateModel(id, { status: "running" });
      return response.data;
    }
    throw new Error(response.error?.message || `Failed to start model ${id}`);
  }

  public async stopModel(id: string): Promise<ModelConfig> {
    const response = await apiClient.post<ModelConfig>(`${this.baseUrl}/models/${id}/stop`);
    if (response.success && response.data) {
      useStore.getState().updateModel(id, { status: "idle" });
      return response.data;
    }
    throw new Error(response.error?.message || `Failed to stop model ${id}`);
  }

  // Metrics API
  public async getMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get<LegacySystemMetrics>(`${this.baseUrl}/metrics`);
    if (response.success && response.data) {
      const transformedMetrics = transformMetrics(response.data);
      useStore.getState().setMetrics(transformedMetrics);
      return transformedMetrics;
    }
    throw new Error(response.error?.message || "Failed to fetch metrics");
  }

  public async getMetricsHistory(params: { limit?: number; hours?: number }): Promise<SystemMetrics[]> {
    const response = await apiClient.get<LegacySystemMetrics[]>(`${this.baseUrl}/metrics/history`, {
      params,
    });
    if (response.success && response.data) {
      return response.data.map((m) => transformMetrics(m));
    }
    throw new Error(response.error?.message || "Failed to fetch metrics history");
  }

  // Logs API
  public async getLogs(params: { limit?: number; level?: string }): Promise<LogEntry[]> {
    const response = await apiClient.get<LogEntry[]>(`${this.baseUrl}/logs`, { params });
    if (response.success && response.data) {
      useStore.getState().setLogs(response.data);
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch logs");
  }

  public async clearLogs(): Promise<void> {
    const response = await apiClient.delete(`${this.baseUrl}/logs`);
    if (response.success) {
      useStore.getState().clearLogs();
      return;
    }
    throw new Error(response.error?.message || "Failed to clear logs");
  }

  // Settings API
  public async getSettings(): Promise<ApiResponse<any>> {
    return await apiClient.get(`${this.baseUrl}/settings`);
  }

  public async updateSettings(settings: any): Promise<ApiResponse<any>> {
    const response = await apiClient.put(`${this.baseUrl}/settings`, settings);
    if (response.success && response.data) {
      useStore.getState().updateSettings(response.data);
      return response;
    }
    throw new Error(response.error?.message || "Failed to update settings");
  }

  // System API
  public async getSystemInfo(): Promise<ApiResponse<any>> {
    return await apiClient.get(`${this.baseUrl}/system/info`);
  }

  public async restartSystem(): Promise<ApiResponse<void>> {
    return await apiClient.post(`${this.baseUrl}/system/restart`);
  }

  public async shutdownSystem(): Promise<ApiResponse<void>> {
    return await apiClient.post(`${this.baseUrl}/system/shutdown`);
  }

  // Health check
  public async healthCheck(): Promise<ApiResponse<any>> {
    return await apiClient.get(`${this.baseUrl}/health`);
  }

  // AI Generation methods
  public async generateText(data: { prompt: string; model?: string; max_tokens?: number }): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/generate`, data);
  }

  public async chat(data: { messages: any[]; model?: string; max_tokens?: number }): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/chat`, data);
  }

  // Model management
  public async loadModel(id: string, config?: any): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/models/${id}/load`, { config });
  }

  public async unloadModel(id: string): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/models/${id}/unload`);
  }

  // Configuration
  public async getConfig(): Promise<ApiResponse<ServerConfig>> {
    return await apiClient.get<ServerConfig>(`${this.baseUrl}/config`);
  }

  public async updateConfig(config: ServerConfig): Promise<ApiResponse<ServerConfig>> {
    const response = await apiClient.post<ServerConfig>(`${this.baseUrl}/config`, config);
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to update config");
  }

  // Model Discovery
  public async discoverModels(paths: string[]): Promise<ApiResponse<{ discovered: ModelConfig[] }>> {
    const response = await apiClient.post<{ discovered: ModelConfig[] }>(
      `${this.baseUrl}/models/discover`,
      { paths }
    );
    if (response.success && response.data) {
      // Add discovered models to store
      response.data.discovered.forEach((model) => {
        useStore.getState().addModel(model);
      });
      return response;
    }
    throw new Error(response.error?.message || "Failed to discover models");
  }

  // Model Analysis (Fit Params)
  public async analyzeFitParams(modelName: string): Promise<ApiResponse<{ model: ModelConfig; fitParams: FitParamsAnalysis | null }>> {
    const response = await apiClient.post<{ model: ModelConfig; fitParams: FitParamsAnalysis | null }>(
      `${this.baseUrl}/models/${modelName}/analyze`
    );
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to analyze model fit params");
  }

  public async getFitParams(modelName: string): Promise<ApiResponse<{ model: ModelConfig; fitParams: FitParamsAnalysis | null }>> {
    const response = await apiClient.get<{ model: ModelConfig; fitParams: FitParamsAnalysis | null }>(
      `${this.baseUrl}/models/${modelName}/analyze`
    );
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to get model fit params");
  }

  // Model Templates
  public async getModelTemplates(): Promise<ApiResponse<ModelTemplatesConfig>> {
    return await apiClient.get<ModelTemplatesConfig>(`${this.baseUrl}/model-templates`);
  }

  public async saveModelTemplates(modelTemplates: Record<string, unknown>): Promise<ApiResponse<ModelTemplatesConfig>> {
    const response = await apiClient.post<ModelTemplatesConfig>(`${this.baseUrl}/model-templates`, {
      model_templates: modelTemplates,
    });
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to save model templates");
  }

  // Llama Server
  public async rescanModels(config?: Partial<LlamaServerConfig>): Promise<ApiResponse<{ message: string; config: LlamaServerConfig }>> {
    const response = await apiClient.post<{ message: string; config: LlamaServerConfig }>(
      `${this.baseUrl}/llama-server/rescan`,
      config || {}
    );
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to rescan models");
  }

  // Monitoring
  public async getMonitoringHistory(params?: { minutes?: number }): Promise<ApiResponse<ChartHistoryData>> {
    const response = await apiClient.get<ChartHistoryData>(`${this.baseUrl}/monitoring/history`, { params });
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to fetch monitoring history");
  }

  public async getLatestMonitoring(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<any>(`${this.baseUrl}/monitoring/latest`);
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to fetch latest monitoring data");
  }

  public async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    const response = await apiClient.get<LegacySystemMetrics>(`${this.baseUrl}/system/metrics`);
    if (response.success && response.data) {
      const transformedMetrics = transformMetrics(response.data);
      useStore.getState().setMetrics(transformedMetrics);
      return { ...response, data: transformedMetrics };
    }
    throw new Error(response.error?.message || "Failed to fetch system metrics");
  }

  // Logger Configuration
  public async getLoggerConfig(): Promise<ApiResponse<LoggerConfig>> {
    const response = await apiClient.get<LoggerConfig>(`${this.baseUrl}/logger/config`);
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to fetch logger config");
  }

  public async updateLoggerConfig(config: LoggerConfig): Promise<ApiResponse<LoggerConfig>> {
    const response = await apiClient.post<LoggerConfig>(`${this.baseUrl}/logger/config`, config);
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to update logger config");
  }

  // Models list from Llama Service
  public async getLlamaModels(): Promise<ApiResponse<{ models: ModelConfig[] }>> {
    const response = await apiClient.get<{ models: ModelConfig[] }>(`${this.baseUrl}/models`);
    if (response.success && response.data) {
      useStore.getState().setModels(response.data.models);
      return response;
    }
    throw new Error(response.error?.message || "Failed to fetch llama models");
  }
}

export const apiService = new ApiService();
