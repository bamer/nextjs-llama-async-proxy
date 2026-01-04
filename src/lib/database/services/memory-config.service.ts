import { initDatabase, closeDatabase } from "../database-client";
import type { ModelMemoryConfig } from "@/types/model-config-types";

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
