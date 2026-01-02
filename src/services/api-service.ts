import { ModelConfig, SystemMetrics, LogEntry, ApiResponse } from "@/types";
import {
  FitParamsAnalysis,
  ModelTemplatesConfig,
  LlamaServerConfig,
  LoggerConfig,
  ChartHistoryData,
  ServerConfig,
} from "@/types/api-service-types";
import { modelsApiService } from "./models-api-service";
import { metricsApiService } from "./metrics-api-service";
import { logsApiService } from "./logs-api-service";
import { settingsApiService } from "./settings-api-service";
import { systemApiService } from "./system-api-service";
import { llamaApiService } from "./llama-api-service";
import { generationApiService } from "./generation-api-service";

/**
 * API Service Facade
 * Provides unified interface to all specialized API services
 */
class ApiService {
  // Models API
  public async getModels(): Promise<ModelConfig[]> {
    return modelsApiService.getModels();
  }
  public async getModel(id: string): Promise<ModelConfig> {
    return modelsApiService.getModel(id);
  }
  public async createModel(model: Omit<ModelConfig, "id" | "createdAt" | "updatedAt">): Promise<ModelConfig> {
    return modelsApiService.createModel(model);
  }
  public async updateModel(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig> {
    return modelsApiService.updateModel(id, updates);
  }
  public async deleteModel(id: string): Promise<void> {
    return modelsApiService.deleteModel(id);
  }
  public async startModel(id: string): Promise<ModelConfig> {
    return modelsApiService.startModel(id);
  }
  public async stopModel(id: string): Promise<ModelConfig> {
    return modelsApiService.stopModel(id);
  }
  public async loadModel(id: string, config?: any): Promise<ApiResponse<any>> {
    return modelsApiService.loadModel(id, config);
  }
  public async unloadModel(id: string): Promise<ApiResponse<any>> {
    return modelsApiService.unloadModel(id);
  }
  public async discoverModels(paths: string[]): Promise<ApiResponse<{ discovered: ModelConfig[] }>> {
    return modelsApiService.discoverModels(paths);
  }
  public async analyzeFitParams(modelName: string): Promise<ApiResponse<{ model: ModelConfig; fitParams: FitParamsAnalysis | null }>> {
    return modelsApiService.analyzeFitParams(modelName);
  }
  public async getFitParams(modelName: string): Promise<ApiResponse<{ model: ModelConfig; fitParams: FitParamsAnalysis | null }>> {
    return modelsApiService.getFitParams(modelName);
  }
  public async getModelTemplates(): Promise<ApiResponse<ModelTemplatesConfig>> {
    return modelsApiService.getModelTemplates();
  }
  public async saveModelTemplates(modelTemplates: Record<string, unknown>): Promise<ApiResponse<ModelTemplatesConfig>> {
    return modelsApiService.saveModelTemplates(modelTemplates);
  }
  public async getLlamaModels(): Promise<ApiResponse<{ models: ModelConfig[] }>> {
    return modelsApiService.getLlamaModels();
  }

  // Metrics API
  public async getMetrics(): Promise<SystemMetrics> {
    return metricsApiService.getMetrics();
  }
  public async getMetricsHistory(params: { limit?: number; hours?: number }): Promise<SystemMetrics[]> {
    return metricsApiService.getMetricsHistory(params);
  }
  public async getMonitoringHistory(params?: { minutes?: number }): Promise<ApiResponse<ChartHistoryData>> {
    return metricsApiService.getMonitoringHistory(params);
  }
  public async getLatestMonitoring(): Promise<ApiResponse<any>> {
    return metricsApiService.getLatestMonitoring();
  }
  public async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    return metricsApiService.getSystemMetrics();
  }

  // Logs API
  public async getLogs(params: { limit?: number; level?: string }): Promise<LogEntry[]> {
    return logsApiService.getLogs(params);
  }
  public async clearLogs(): Promise<void> {
    return logsApiService.clearLogs();
  }
  public async getLoggerConfig(): Promise<ApiResponse<LoggerConfig>> {
    return logsApiService.getLoggerConfig();
  }
  public async updateLoggerConfig(config: LoggerConfig): Promise<ApiResponse<LoggerConfig>> {
    return logsApiService.updateLoggerConfig(config);
  }

  // Settings API
  public async getSettings(): Promise<ApiResponse<any>> {
    return settingsApiService.getSettings();
  }
  public async updateSettings(settings: any): Promise<ApiResponse<any>> {
    return settingsApiService.updateSettings(settings);
  }

  // System API
  public async getSystemInfo(): Promise<ApiResponse<any>> {
    return systemApiService.getSystemInfo();
  }
  public async restartSystem(): Promise<ApiResponse<void>> {
    return systemApiService.restartSystem();
  }
  public async shutdownSystem(): Promise<ApiResponse<void>> {
    return systemApiService.shutdownSystem();
  }
  public async healthCheck(): Promise<ApiResponse<any>> {
    return systemApiService.healthCheck();
  }
  public async getConfig(): Promise<ApiResponse<ServerConfig>> {
    return systemApiService.getConfig();
  }
  public async updateConfig(config: ServerConfig): Promise<ApiResponse<ServerConfig>> {
    return systemApiService.updateConfig(config);
  }

  // Llama API
  public async rescanModels(config?: Partial<LlamaServerConfig>): Promise<ApiResponse<{ message: string; config: LlamaServerConfig }>> {
    return llamaApiService.rescanModels(config);
  }

  // Generation API
  public async generateText(data: { prompt: string; model?: string; max_tokens?: number }): Promise<ApiResponse<any>> {
    return generationApiService.generateText(data);
  }
  public async chat(data: { messages: any[]; model?: string; max_tokens?: number }): Promise<ApiResponse<any>> {
    return generationApiService.chat(data);
  }
}

export const apiService = new ApiService();
