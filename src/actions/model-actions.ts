"use server";

import {
  getModels,
  getModelById,
  getModelSamplingConfig,
  getModelMemoryConfig,
  getModelGpuConfig,
  getModelAdvancedConfig,
  getModelLoraConfig,
  getModelMultimodalConfig,
  saveModel,
  saveModelSamplingConfig,
  saveModelMemoryConfig,
  saveModelGpuConfig,
  saveModelAdvancedConfig,
  saveModelLoraConfig,
  saveModelMultimodalConfig,
  updateModel,
  deleteModel,
  type ModelConfig,
  type ModelSamplingConfig,
  type ModelMemoryConfig,
  type ModelGpuConfig,
  type ModelAdvancedConfig,
  type ModelLoraConfig,
  type ModelMultimodalConfig,
} from "@/lib/database";

/**
 * Server Action: Get all models
 */
export async function getModelsAction(
  filters?: Partial<Pick<ModelConfig, "status" | "type" | "name">>
): Promise<ModelConfig[]> {
  return getModels(filters);
}

/**
 * Server Action: Get model by ID
 */
export async function getModelByIdAction(id: number): Promise<ModelConfig | null> {
  return getModelById(id);
}

/**
 * Server Action: Get model sampling config
 */
export async function getModelSamplingConfigAction(
  modelId: number
): Promise<ModelSamplingConfig | null> {
  return getModelSamplingConfig(modelId);
}

/**
 * Server Action: Get model memory config
 */
export async function getModelMemoryConfigAction(
  modelId: number
): Promise<ModelMemoryConfig | null> {
  return getModelMemoryConfig(modelId);
}

/**
 * Server Action: Get model GPU config
 */
export async function getModelGpuConfigAction(
  modelId: number
): Promise<ModelGpuConfig | null> {
  return getModelGpuConfig(modelId);
}

/**
 * Server Action: Get model advanced config
 */
export async function getModelAdvancedConfigAction(
  modelId: number
): Promise<ModelAdvancedConfig | null> {
  return getModelAdvancedConfig(modelId);
}

/**
 * Server Action: Get model LoRA config
 */
export async function getModelLoraConfigAction(
  modelId: number
): Promise<ModelLoraConfig | null> {
  return getModelLoraConfig(modelId);
}

/**
 * Server Action: Get model multimodal config
 */
export async function getModelMultimodalConfigAction(
  modelId: number
): Promise<ModelMultimodalConfig | null> {
  return getModelMultimodalConfig(modelId);
}

/**
 * Server Action: Save new model
 */
export async function saveModelAction(
  config: Omit<ModelConfig, "id" | "created_at" | "updated_at">
): Promise<number> {
  return saveModel(config);
}

/**
 * Server Action: Save model sampling config
 */
export async function saveModelSamplingConfigAction(
  modelId: number,
  config: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at">
): Promise<number> {
  return saveModelSamplingConfig(modelId, config);
}

/**
 * Server Action: Save model memory config
 */
export async function saveModelMemoryConfigAction(
  modelId: number,
  config: Omit<ModelMemoryConfig, "id" | "model_id" | "created_at" | "updated_at">
): Promise<number> {
  return saveModelMemoryConfig(modelId, config);
}

/**
 * Server Action: Save model GPU config
 */
export async function saveModelGpuConfigAction(
  modelId: number,
  config: Omit<ModelGpuConfig, "id" | "model_id" | "created_at" | "updated_at">
): Promise<number> {
  return saveModelGpuConfig(modelId, config);
}

/**
 * Server Action: Save model advanced config
 */
export async function saveModelAdvancedConfigAction(
  modelId: number,
  config: Omit<ModelAdvancedConfig, "id" | "model_id" | "created_at" | "updated_at">
): Promise<number> {
  return saveModelAdvancedConfig(modelId, config);
}

/**
 * Server Action: Save model LoRA config
 */
export async function saveModelLoraConfigAction(
  modelId: number,
  config: Omit<ModelLoraConfig, "id" | "model_id" | "created_at" | "updated_at">
): Promise<number> {
  return saveModelLoraConfig(modelId, config);
}

/**
 * Server Action: Save model multimodal config
 */
export async function saveModelMultimodalConfigAction(
  modelId: number,
  config: Omit<ModelMultimodalConfig, "id" | "model_id" | "created_at" | "updated_at">
): Promise<number> {
  return saveModelMultimodalConfig(modelId, config);
}

/**
 * Server Action: Update existing model
 */
export async function updateModelAction(
  id: number,
  updates: Partial<Omit<ModelConfig, "id" | "name" | "type" | "created_at">>
): Promise<void> {
  updateModel(id, updates);
}

/**
 * Server Action: Delete model
 */
export async function deleteModelAction(id: number): Promise<void> {
  deleteModel(id);
}
