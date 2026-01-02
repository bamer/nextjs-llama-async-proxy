import { initDatabase, closeDatabase } from "../database-client";
import type { ModelSamplingConfig } from "./ModelSamplingConfig.types";
import type {
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "./ModelMemoryConfig.types";



export function getModelSamplingConfig(modelId: number): ModelSamplingConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM model_sampling_config WHERE model_id = ?").get(modelId);

    if (!row) return null;
    return row as ModelSamplingConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelMemoryConfig(modelId: number): ModelMemoryConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM model_memory_config WHERE model_id = ?").get(modelId);

    if (!row) return null;
    return row as ModelMemoryConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelGpuConfig(modelId: number): ModelGpuConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM model_gpu_config WHERE model_id = ?").get(modelId);

    if (!row) return null;
    return row as ModelGpuConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelAdvancedConfig(modelId: number): ModelAdvancedConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM model_advanced_config WHERE model_id = ?").get(modelId);

    if (!row) return null;
    return row as ModelAdvancedConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelLoraConfig(modelId: number): ModelLoraConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM model_lora_config WHERE model_id = ?").get(modelId);

    if (!row) return null;
    return row as ModelLoraConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelMultimodalConfig(modelId: number): ModelMultimodalConfig | null {
  const db = initDatabase();

  try {
    const row = db.prepare("SELECT * FROM model_multimodal_config WHERE model_id = ?").get(modelId);

    if (!row) return null;
    return row as ModelMultimodalConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getCompleteModelConfig(modelId: number): {
  model: ModelConfig;
  sampling?: ModelSamplingConfig;
  memory?: ModelMemoryConfig;
  gpu?: ModelGpuConfig;
  advanced?: ModelAdvancedConfig;
  lora?: ModelLoraConfig;
  multimodal?: ModelMultimodalConfig;
} | null {
  const { getModelById } = require("./ModelQueries.service");
  const model = getModelById(modelId);
  if (!model) return null;

  const sampling = getModelSamplingConfig(modelId);
  const memory = getModelMemoryConfig(modelId);
  const gpu = getModelGpuConfig(modelId);
  const advanced = getModelAdvancedConfig(modelId);
  const lora = getModelLoraConfig(modelId);
  const multimodal = getModelMultimodalConfig(modelId);

  const result: {
    model: ModelConfig;
    sampling?: ModelSamplingConfig;
    memory?: ModelMemoryConfig;
    gpu?: ModelGpuConfig;
    advanced?: ModelAdvancedConfig;
    lora?: ModelLoraConfig;
    multimodal?: ModelMultimodalConfig;
  } = {
    model,
  };

  if (sampling) result.sampling = sampling;
  if (memory) result.memory = memory;
  if (gpu) result.gpu = gpu;
  if (advanced) result.advanced = advanced;
  if (lora) result.lora = lora;
  if (multimodal) result.multimodal = multimodal;

  return result;
}
