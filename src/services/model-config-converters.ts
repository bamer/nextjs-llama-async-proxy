import { initDatabase, closeDatabase } from "../lib/database/database-client";
import type { ModelSamplingConfig } from "../lib/database/models/ModelSamplingConfig.types";
import type {
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "../lib/database/models/ModelMemoryConfig.types";

/**
 * Generic helper to retrieve and convert database row to typed config
 */
function getModelConfig<T>(modelId: number, tableName: string): T | null {
  const db = initDatabase();
  try {
    const row = db.prepare(`SELECT * FROM ${tableName} WHERE model_id = ?`).get(modelId);
    return row ? (row as T) : null;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Retrieve and convert model sampling config from database
 */
export function getModelSamplingConfig(modelId: number): ModelSamplingConfig | null {
  return getModelConfig<ModelSamplingConfig>(modelId, "model_sampling_config");
}

/**
 * Retrieve and convert model memory config from database
 */
export function getModelMemoryConfig(modelId: number): ModelMemoryConfig | null {
  return getModelConfig<ModelMemoryConfig>(modelId, "model_memory_config");
}

/**
 * Retrieve and convert model GPU config from database
 */
export function getModelGpuConfig(modelId: number): ModelGpuConfig | null {
  return getModelConfig<ModelGpuConfig>(modelId, "model_gpu_config");
}

/**
 * Retrieve and convert model advanced config from database
 */
export function getModelAdvancedConfig(modelId: number): ModelAdvancedConfig | null {
  return getModelConfig<ModelAdvancedConfig>(modelId, "model_advanced_config");
}

/**
 * Retrieve and convert model LoRA config from database
 */
export function getModelLoraConfig(modelId: number): ModelLoraConfig | null {
  return getModelConfig<ModelLoraConfig>(modelId, "model_lora_config");
}

/**
 * Retrieve and convert model multimodal config from database
 */
export function getModelMultimodalConfig(modelId: number): ModelMultimodalConfig | null {
  return getModelConfig<ModelMultimodalConfig>(modelId, "model_multimodal_config");
}
