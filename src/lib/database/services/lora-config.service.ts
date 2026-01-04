import { initDatabase, closeDatabase } from "../database-client";
import type { ModelLoraConfig } from "@/types/model-config-types";

export function saveModelLoraConfig(
  modelId: number,
  config: Omit<ModelLoraConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_lora_config (
        model_id, lora, lora_scaled, control_vector, control_vector_scaled,
        control_vector_layer_range, model_draft, model_url_draft, ctx_size_draft,
        threads_draft, threads_batch_draft, draft_max, draft_min, draft_p_min,
        cache_type_k_draft, cache_type_v_draft, cpu_moe_draft, n_cpu_moe_draft,
        n_gpu_layers_draft, device_draft, spec_replace, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      config.lora ?? null,
      config.lora_scaled ?? null,
      config.control_vector ?? null,
      config.control_vector_scaled ?? null,
      config.control_vector_layer_range ?? null,
      config.model_draft ?? null,
      config.model_url_draft ?? null,
      config.ctx_size_draft ?? null,
      config.threads_draft ?? null,
      config.threads_batch_draft ?? null,
      config.draft_max ?? 16,
      config.draft_min ?? 0,
      config.draft_p_min ?? 0.8,
      config.cache_type_k_draft ?? null,
      config.cache_type_v_draft ?? null,
      config.cpu_moe_draft ?? 0,
      config.n_cpu_moe_draft ?? 0,
      config.n_gpu_layers_draft ?? null,
      config.device_draft ?? null,
      config.spec_replace ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
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
