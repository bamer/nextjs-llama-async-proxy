import { apiClient } from "@/utils/api-client";
import { ApiResponse } from "@/types";

class GenerationApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

  public async generateText(data: { prompt: string; model?: string; max_tokens?: number }): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/generate`, data);
  }

  public async chat(data: { messages: any[]; model?: string; max_tokens?: number }): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/chat`, data);
  }
}

export const generationApiService = new GenerationApiService();