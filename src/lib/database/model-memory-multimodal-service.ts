import { initDatabase, closeDatabase } from "./database-client";
import { ModelMemoryConfig, ModelMultimodalConfig } from "./models-service";

export function saveModelMemoryConfig(
  modelId: number,
  config: Omit<ModelMemoryConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_memory_config (
        model_id, cache_ram, cache_type_k, cache_type_v, mmap, mlock, numa, defrag_thold,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      config.cache_ram ?? -1,
      config.cache_type_k ?? null,
      config.cache_type_v ?? null,
      config.mmap ?? 0,
      config.mlock ?? 0,
      config.numa ?? null,
      config.defrag_thold ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function saveModelMultimodalConfig(
  modelId: number,
  config: Omit<ModelMultimodalConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_multimodal_config (
        model_id, mmproj, mmproj_url, mmproj_auto, mmproj_offload,
        image_min_tokens, image_max_tokens, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      config.mmproj ?? null,
      config.mmproj_url ?? null,
      config.mmproj_auto ?? 0,
      config.mmproj_offload ?? 0,
      config.image_min_tokens ?? null,
      config.image_max_tokens ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}
