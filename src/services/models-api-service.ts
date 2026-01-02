import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import { ModelConfig, ApiResponse } from "@/types";
import {
  FitParamsAnalysis,
  ModelTemplatesConfig,
} from "@/types/api-service-types";

class ModelsApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

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

  public async loadModel(id: string, config?: any): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/models/${id}/load`, { config });
  }

  public async unloadModel(id: string): Promise<ApiResponse<any>> {
    return await apiClient.post(`${this.baseUrl}/models/${id}/unload`);
  }

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

  public async getLlamaModels(): Promise<ApiResponse<{ models: ModelConfig[] }>> {
    const response = await apiClient.get<{ models: ModelConfig[] }>(`${this.baseUrl}/models`);
    if (response.success && response.data) {
      useStore.getState().setModels(response.data.models);
      return response;
    }
    throw new Error(response.error?.message || "Failed to fetch llama models");
  }
}

export const modelsApiService = new ModelsApiService();