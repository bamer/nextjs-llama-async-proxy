import { initDatabase, closeDatabase } from "../database-client";
import type { ModelGpuConfig } from "../types/model-config.types";

export function saveModelGpuConfig(
  modelId: number,
  config: Omit<ModelGpuConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_gpu_config (
        model_id, device, list_devices, gpu_layers, split_mode, tensor_split,
        main_gpu, kv_offload, repack, no_host, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      config.device ?? null,
      config.list_devices ?? 0,
      config.gpu_layers ?? -1,
      config.split_mode ?? null,
      config.tensor_split ?? null,
      config.main_gpu ?? null,
      config.kv_offload ?? 0,
      config.repack ?? 0,
      config.no_host ?? 0,
      now,
      now
    );

    return result.lastInsertRowid as number;
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
