import { initDatabase, closeDatabase } from "../database-client";
import type {
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "./ModelMemoryConfig.types";

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
