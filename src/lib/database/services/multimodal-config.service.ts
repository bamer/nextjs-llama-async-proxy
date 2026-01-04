import { initDatabase, closeDatabase } from "../database-client";
import type { ModelMultimodalConfig } from "@/types/model-config-types";

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
