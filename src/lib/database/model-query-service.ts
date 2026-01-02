import { initDatabase, closeDatabase } from "./database-client";
import {
  ModelConfig,
  ModelFitParams,
  ModelServerConfig,
  ModelSamplingConfig,
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "./models-service";

export function getModels(
  filters?: Partial<Pick<ModelConfig, "status" | "type" | "name">>
): ModelConfig[] {
  const db = initDatabase();

  try {
    let query = "SELECT * FROM models";
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters?.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    if (filters?.type) {
      conditions.push("type = ?");
      params.push(filters.type);
    }

    if (filters?.name) {
      conditions.push("name LIKE ?");
      params.push(`%${filters.name}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const stmt = db.prepare(query);
    const models = stmt.all(...params) as ModelConfig[];
    return models;
  } finally {
    closeDatabase(db);
  }
}

export function getModelById(id: number): ModelConfig | null {
  const db = initDatabase();
  try {
    const row = db.prepare("SELECT * FROM models WHERE id = ?").get(id);
    if (!row) return null;
    return row as ModelConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelByName(name: string): ModelConfig | null {
  const db = initDatabase();
  try {
    const row = db.prepare("SELECT * FROM models WHERE name = ?").get(name);
    if (!row) return null;
    return row as ModelConfig;
  } finally {
    closeDatabase(db);
  }
}

export function getModelFitParams(modelId: number): ModelFitParams | null {
  const db = initDatabase();
  try {
    const row = db.prepare("SELECT * FROM model_fit_params WHERE model_id = ?").get(modelId);
    if (!row) return null;
    return row as ModelFitParams;
  } finally {
    closeDatabase(db);
  }
}

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

export function getServerConfig(): ModelServerConfig | null {
  const db = initDatabase();
  try {
    const row = db.prepare("SELECT * FROM model_server_config LIMIT 1").get();
    if (!row) return null;
    return row as ModelServerConfig;
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
  const model = getModelById(modelId);
  if (!model) return null;
  const sampling = getModelSamplingConfig(modelId);
  const memory = getModelMemoryConfig(modelId);
  const gpu = getModelGpuConfig(modelId);
  const advanced = getModelAdvancedConfig(modelId);
  const lora = getModelLoraConfig(modelId);
  const multimodal = getModelMultimodalConfig(modelId);
  const result: { model: ModelConfig; [key: string]: unknown } = { model };
  if (sampling) result.sampling = sampling;
  if (memory) result.memory = memory;
  if (gpu) result.gpu = gpu;
  if (advanced) result.advanced = advanced;
  if (lora) result.lora = lora;
  if (multimodal) result.multimodal = multimodal;
  return result;
}
