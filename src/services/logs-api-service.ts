import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import { LogEntry, ApiResponse } from "@/types";
import { LoggerConfig } from "@/types/api-service-types";

class LogsApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

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
}

export const logsApiService = new LogsApiService();