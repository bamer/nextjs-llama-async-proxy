import { initDatabase, closeDatabase } from "../lib/database/database-client";
import type { ModelSamplingConfig } from "../lib/database/models/ModelSamplingConfig.types";
import type {
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "../lib/database/models/ModelMemoryConfig.types";
import {
  normalizeModelSamplingConfig,
  normalizeModelMemoryConfig,
  normalizeModelGpuConfig,
  normalizeModelAdvancedConfig,
  normalizeModelLoraConfig,
  normalizeModelMultimodalConfig,
} from "./model-config-validators";

const SQL_INSERTS = {
  sampling: `INSERT OR REPLACE INTO model_sampling_config (model_id, temperature, top_k, top_p, min_p, top_nsigma, xtc_probability, xtc_threshold, typical_p, repeat_last_n, repeat_penalty, presence_penalty, frequency_penalty, dry_multiplier, dry_base, dry_allowed_length, dry_penalty_last_n, dry_sequence_breaker, dynatemp_range, dynatemp_exponent, mirostat, mirostat_eta, mirostat_tau, samplers, sampler_seq, seed, grammar, grammar_file, json_schema, json_schema_file, ignore_eos, "escape", rope_scaling_type, rope_scale, rope_freq_base, rope_freq_scale, yarn_orig_ctx, yarn_ext_factor, yarn_attn_factor, yarn_beta_slow, yarn_beta_fast, flash_attn, logit_bias, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  memory: `INSERT OR REPLACE INTO model_memory_config (model_id, cache_ram, cache_type_k, cache_type_v, mmap, mlock, numa, defrag_thold, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  gpu: `INSERT OR REPLACE INTO model_gpu_config (model_id, device, list_devices, gpu_layers, split_mode, tensor_split, main_gpu, kv_offload, repack, no_host, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  advanced: `INSERT OR REPLACE INTO model_advanced_config (model_id, swa_full, override_tensor, cpu_moe, n_cpu_moe, kv_unified, pooling, context_shift, rpc, offline, override_kv, op_offload, fit, fit_target, fit_ctx, check_tensors, sleep_idle_seconds, polling, polling_batch, reasoning_format, reasoning_budget, custom_params, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  lora: `INSERT OR REPLACE INTO model_lora_config (model_id, lora, lora_scaled, control_vector, control_vector_scaled, control_vector_layer_range, model_draft, model_url_draft, ctx_size_draft, threads_draft, threads_batch_draft, draft_max, draft_min, draft_p_min, cache_type_k_draft, cache_type_v_draft, cpu_moe_draft, n_cpu_moe_draft, n_gpu_layers_draft, device_draft, spec_replace, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  multimodal: `INSERT OR REPLACE INTO model_multimodal_config (model_id, mmproj, mmproj_url, mmproj_auto, mmproj_offload, image_min_tokens, image_max_tokens, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
};

export function saveModelSamplingConfig(
  modelId: number,
  config: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const normalized = normalizeModelSamplingConfig(config);
  const now = Date.now();
  try {
    const stmt = db.prepare(SQL_INSERTS.sampling);
    const result = stmt.run(modelId, ...Object.values(normalized), now, now);
    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function saveModelMemoryConfig(
  modelId: number,
  config: Omit<ModelMemoryConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const normalized = normalizeModelMemoryConfig(config);
  const now = Date.now();
  try {
    const stmt = db.prepare(SQL_INSERTS.memory);
    const result = stmt.run(modelId, ...Object.values(normalized), now, now);
    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function saveModelGpuConfig(
  modelId: number,
  config: Omit<ModelGpuConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const normalized = normalizeModelGpuConfig(config);
  const now = Date.now();
  try {
    const stmt = db.prepare(SQL_INSERTS.gpu);
    const result = stmt.run(modelId, ...Object.values(normalized), now, now);
    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function saveModelAdvancedConfig(
  modelId: number,
  config: Omit<ModelAdvancedConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const normalized = normalizeModelAdvancedConfig(config);
  const now = Date.now();
  try {
    const stmt = db.prepare(SQL_INSERTS.advanced);
    const result = stmt.run(modelId, ...Object.values(normalized), now, now);
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
  const normalized = normalizeModelLoraConfig(config);
  const now = Date.now();
  try {
    const stmt = db.prepare(SQL_INSERTS.lora);
    const result = stmt.run(modelId, ...Object.values(normalized), now, now);
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
  const normalized = normalizeModelMultimodalConfig(config);
  const now = Date.now();
  try {
    const stmt = db.prepare(SQL_INSERTS.multimodal);
    const result = stmt.run(modelId, ...Object.values(normalized), now, now);
    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function updateModelSamplingConfig(
  modelId: number,
  updates: Partial<Omit<ModelSamplingConfig, "id" | "model_id" | "created_at">>
): void {
  const db = initDatabase();
  try {
    const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(updates);
    const stmt = db.prepare(`UPDATE model_sampling_config SET ${fields}, updated_at = ? WHERE model_id = ?`);
    stmt.run(...values, Date.now(), modelId);
  } finally {
    closeDatabase(db);
  }
}
