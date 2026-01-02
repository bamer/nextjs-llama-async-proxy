import { apiClient } from "@/utils/api-client";
import { ApiResponse } from "@/types";
import { LlamaServerConfig } from "@/types/api-service-types";

class LlamaApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

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
}

export const llamaApiService = new LlamaApiService();