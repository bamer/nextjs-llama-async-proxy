import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import { ModelConfig, SystemMetrics, LogEntry, ApiResponse } from "@/types";

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
    const response = await apiClient.get<SystemMetrics>(`${this.baseUrl}/metrics`);
    if (response.success && response.data) {
      useStore.getState().setMetrics(response.data);
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch metrics");
  }

  public async getMetricsHistory(params: { limit?: number; hours?: number }): Promise<SystemMetrics[]> {
    const response = await apiClient.get<SystemMetrics[]>(`${this.baseUrl}/metrics/history`, {
      params,
    });
    if (response.success && response.data) {
      return response.data;
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
  public async getSettings(): Promise<ApiResponse> {
    return await apiClient.get(`${this.baseUrl}/settings`);
  }

  public async updateSettings(settings: any): Promise<ApiResponse> {
    const response = await apiClient.put(`${this.baseUrl}/settings`, settings);
    if (response.success && response.data) {
      useStore.getState().updateSettings(response.data);
      return response;
    }
    throw new Error(response.error?.message || "Failed to update settings");
  }

  // System API
  public async getSystemInfo(): Promise<ApiResponse> {
    return await apiClient.get(`${this.baseUrl}/system/info`);
  }

  public async restartSystem(): Promise<ApiResponse> {
    return await apiClient.post(`${this.baseUrl}/system/restart`);
  }

  public async shutdownSystem(): Promise<ApiResponse> {
    return await apiClient.post(`${this.baseUrl}/system/shutdown`);
  }

  // Health check
  public async healthCheck(): Promise<ApiResponse> {
    return await apiClient.get(`${this.baseUrl}/health`);
  }

  // AI Generation methods
  public async generateText(data: { prompt: string; model?: string; max_tokens?: number }): Promise<ApiResponse> {
    return await apiClient.post(`${this.baseUrl}/generate`, data);
  }

  public async chat(data: { messages: any[]; model?: string; max_tokens?: number }): Promise<ApiResponse> {
    return await apiClient.post(`${this.baseUrl}/chat`, data);
  }

  // Model management
  public async loadModel(id: string, config?: any): Promise<ApiResponse> {
    return await apiClient.post(`${this.baseUrl}/models/${id}/load`, { config });
  }

  public async unloadModel(id: string): Promise<ApiResponse> {
    return await apiClient.post(`${this.baseUrl}/models/${id}/unload`);
  }

  // Configuration
  public async getConfig(): Promise<ApiResponse> {
    return await apiClient.get(`${this.baseUrl}/config`);
  }

  public async updateConfig(config: any): Promise<ApiResponse> {
    return await apiClient.put(`${this.baseUrl}/config`, config);
  }
}

export const apiService = new ApiService();
