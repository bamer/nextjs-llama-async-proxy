import { initDatabase, closeDatabase } from "../database-client";
import type { ModelAdvancedConfig } from "../types/model-config.types";

export function saveModelAdvancedConfig(
  modelId: number,
  config: Omit<ModelAdvancedConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_advanced_config (
        model_id, swa_full, override_tensor, cpu_moe, n_cpu_moe, kv_unified,
        pooling, context_shift, rpc, offline, override_kv, op_offload,
        fit, fit_target, fit_ctx, check_tensors, sleep_idle_seconds,
        polling, polling_batch, reasoning_format, reasoning_budget, custom_params,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      config.swa_full ?? 0,
      config.override_tensor ?? null,
      config.cpu_moe ?? 0,
      config.n_cpu_moe ?? 0,
      config.kv_unified ?? 0,
      config.pooling ?? null,
      config.context_shift ?? 0,
      config.rpc ?? null,
      config.offline ?? 0,
      config.override_kv ?? null,
      config.op_offload ?? 0,
      config.fit ?? null,
      config.fit_target ?? 1024,
      config.fit_ctx ?? 4096,
      config.check_tensors ?? 0,
      config.sleep_idle_seconds ?? -1,
      config.polling ?? null,
      config.polling_batch ?? null,
      config.reasoning_format ?? null,
      config.reasoning_budget ?? -1,
      config.custom_params ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
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
