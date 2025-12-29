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
 * Server Action: Load model configuration (any type)
 */
export async function loadModelConfig(
  modelId: number,
  configType: 'sampling' | 'memory' | 'gpu' | 'advanced' | 'lora' | 'multimodal'
): Promise<any> {
  try {
    switch (configType) {
      case 'sampling':
        return await getModelSamplingConfig(modelId);
      case 'memory':
        return await getModelMemoryConfig(modelId);
      case 'gpu':
        return await getModelGpuConfig(modelId);
      case 'advanced':
        return await getModelAdvancedConfig(modelId);
      case 'lora':
        return await getModelLoraConfig(modelId);
      case 'multimodal':
        return await getModelMultimodalConfig(modelId);
      default:
        throw new Error(`Invalid config type: ${configType}`);
    }
  } catch (error) {
    console.error(`Error loading ${configType} config:`, error);
    throw error;
  }
}

/**
 * Server Action: Save model configuration (any type)
 */
export async function saveModelConfig(
  modelId: number,
  configType: 'sampling' | 'memory' | 'gpu' | 'advanced' | 'lora' | 'multimodal',
  config: any
): Promise<void> {
  try {
    switch (configType) {
      case 'sampling':
        await saveModelSamplingConfig(modelId, config as ModelSamplingConfig);
        break;
      case 'memory':
        await saveModelMemoryConfig(modelId, config as ModelMemoryConfig);
        break;
      case 'gpu':
        await saveModelGpuConfig(modelId, config as ModelGpuConfig);
        break;
      case 'advanced':
        await saveModelAdvancedConfig(modelId, config as ModelAdvancedConfig);
        break;
      case 'lora':
        await saveModelLoraConfig(modelId, config as ModelLoraConfig);
        break;
      case 'multimodal':
        await saveModelMultimodalConfig(modelId, config as ModelMultimodalConfig);
        break;
      default:
        throw new Error(`Invalid config type: ${configType}`);
    }
  } catch (error) {
    console.error(`Error saving ${configType} config:`, error);
    throw error;
  }
}
