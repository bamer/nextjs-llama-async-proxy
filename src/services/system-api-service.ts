import { apiClient } from "@/utils/api-client";
import { ApiResponse } from "@/types";
import { ServerConfig } from "@/types/api-service-types";

class SystemApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

  public async getSystemInfo(): Promise<ApiResponse<unknown>> {
    return await apiClient.get(`${this.baseUrl}/system/info`);
  }

  public async restartSystem(): Promise<ApiResponse<void>> {
    return await apiClient.post(`${this.baseUrl}/system/restart`);
  }

  public async shutdownSystem(): Promise<ApiResponse<void>> {
    return await apiClient.post(`${this.baseUrl}/system/shutdown`);
  }

  public async healthCheck(): Promise<ApiResponse<unknown>> {
    return await apiClient.get(`${this.baseUrl}/health`);
  }

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
}

export const systemApiService = new SystemApiService();