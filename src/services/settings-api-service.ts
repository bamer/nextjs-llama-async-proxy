import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import { ApiResponse } from "@/types";
import { LoggerConfig } from "@/types/api-service-types";

class SettingsApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

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

export const settingsApiService = new SettingsApiService();