import { initDatabase, closeDatabase } from "../database-client";
import type { ModelSamplingConfig } from "./ModelSamplingConfig.types";
import type {
  ModelMemoryConfig,
  ModelGpuConfig,
} from "./ModelMemoryConfig.types";

export function saveModelSamplingConfig(
  modelId: number,
  config: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_sampling_config (
        model_id, temperature, top_k, top_p, min_p, top_nsigma, xtc_probability, xtc_threshold,
        typical_p, repeat_last_n, repeat_penalty, presence_penalty, frequency_penalty,
        dry_multiplier, dry_base, dry_allowed_length, dry_penalty_last_n, dry_sequence_breaker,
        dynatemp_range, dynatemp_exponent, mirostat, mirostat_eta, mirostat_tau,
        samplers, sampler_seq, seed,
        grammar, grammar_file, json_schema, json_schema_file, ignore_eos, "escape",
        rope_scaling_type, rope_scale, rope_freq_base, rope_freq_scale,
        yarn_orig_ctx, yarn_ext_factor, yarn_attn_factor, yarn_beta_slow, yarn_beta_fast, flash_attn,
        logit_bias, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      config.temperature ?? 0.8,
      config.top_k ?? 40,
      config.top_p ?? 0.9,
      config.min_p ?? 0.1,
      config.top_nsigma ?? -1.0,
      config.xtc_probability ?? 0.0,
      config.xtc_threshold ?? 0.1,
      config.typical_p ?? 1.0,
      config.repeat_last_n ?? 64,
      config.repeat_penalty ?? 1.0,
      config.presence_penalty ?? 0.0,
      config.frequency_penalty ?? 0.0,
      config.dry_multiplier ?? 0.0,
      config.dry_base ?? 1.75,
      config.dry_allowed_length ?? 2,
      config.dry_penalty_last_n ?? -1,
      config.dry_sequence_breaker ?? null,
      config.dynatemp_range ?? 0.0,
      config.dynatemp_exponent ?? 1.0,
      config.mirostat ?? 0,
      config.mirostat_eta ?? 0.1,
      config.mirostat_tau ?? 5.0,
      config.samplers ?? null,
      config.sampler_seq ?? "edskypmxt",
      config.seed ?? -1,
      config.grammar ?? null,
      config.grammar_file ?? null,
      config.json_schema ?? null,
      config.json_schema_file ?? null,
      config.ignore_eos ?? 1,
      (config.escape ?? true) ? 1 : 0,
      config.rope_scaling_type ?? null,
      config.rope_scale ?? null,
      config.rope_freq_base ?? null,
      config.rope_freq_scale ?? null,
      config.yarn_orig_ctx ?? 0,
      config.yarn_ext_factor ?? -1.0,
      config.yarn_attn_factor ?? -1.0,
      config.yarn_beta_slow ?? -1.0,
      config.yarn_beta_fast ?? -1.0,
      config.flash_attn ?? "auto",
      config.logit_bias ?? null,
      now,
      now
    );

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

export function updateModelSamplingConfig(
  modelId: number,
  updates: Partial<Omit<ModelSamplingConfig, "id" | "model_id" | "created_at">>
): void {
  const db = initDatabase();

  try {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const stmt = db.prepare(`
      UPDATE model_sampling_config
      SET ${fields}, updated_at = ?
      WHERE model_id = ?
    `);

    stmt.run(...values, Date.now(), modelId);
  } finally {
    closeDatabase(db);
  }
}
