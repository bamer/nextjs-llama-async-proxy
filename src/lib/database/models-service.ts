import Database from "better-sqlite3";
import fs from "fs";
import { initDatabase, closeDatabase } from "./database-client";

// Model Types
export interface ModelConfig {
  id?: number;
  name: string;
  type: "llama" | "gpt" | "mistral" | "custom";
  status: "running" | "stopped" | "loading" | "error";
  model_path?: string;
  model_url?: string;
  docker_repo?: string;
  hf_repo?: string;
  hf_repo_draft?: string;
  hf_file?: string;
  hf_file_v?: string;
  hf_token?: string;
  ctx_size?: number;
  predict?: number;
  batch_size?: number;
  ubatch_size?: number;
  n_parallel?: number;
  cont_batching?: number;
  threads?: number;
  threads_batch?: number;
  cpu_mask?: string;
  cpu_range?: string;
  cpu_strict?: number;
  cpu_mask_batch?: string;
  cpu_range_batch?: string;
  cpu_strict_batch?: number;
  priority?: number;
  priority_batch?: number;
  file_size_bytes?: number;
  fit_params_available?: number;
  last_fit_params_check?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelSamplingConfig {
  id?: number;
  model_id?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  min_p?: number;
  top_nsigma?: number;
  xtc_probability?: number;
  xtc_threshold?: number;
  typical_p?: number;
  repeat_last_n?: number;
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  dry_multiplier?: number;
  dry_base?: number;
  dry_allowed_length?: number;
  dry_penalty_last_n?: number;
  dry_sequence_breaker?: string;
  dynatemp_range?: number;
  dynatemp_exponent?: number;
  mirostat?: number;
  mirostat_eta?: number;
  mirostat_tau?: number;
  samplers?: string;
  sampler_seq?: string;
  seed?: number;
  grammar?: string;
  grammar_file?: string;
  json_schema?: string;
  json_schema_file?: string;
  ignore_eos?: number;
  escape?: boolean;
  rope_scaling_type?: string;
  rope_scale?: number;
  rope_freq_base?: number;
  rope_freq_scale?: number;
  yarn_orig_ctx?: number;
  yarn_ext_factor?: number;
  yarn_attn_factor?: number;
  yarn_beta_slow?: number;
  yarn_beta_fast?: number;
  flash_attn?: string;
  logit_bias?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ModelMemoryConfig {
  id?: number;
  model_id?: number;
  cache_ram?: number;
  cache_type_k?: string;
  cache_type_v?: string;
  mmap?: number;
  mlock?: number;
  numa?: string;
  defrag_thold?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelGpuConfig {
  id?: number;
  model_id?: number;
  device?: string;
  list_devices?: number;
  gpu_layers?: number;
  split_mode?: string;
  tensor_split?: string;
  main_gpu?: number;
  kv_offload?: number;
  repack?: number;
  no_host?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelAdvancedConfig {
  id?: number;
  model_id?: number;
  swa_full?: number;
  override_tensor?: string;
  cpu_moe?: number;
  n_cpu_moe?: number;
  kv_unified?: number;
  pooling?: string;
  context_shift?: number;
  rpc?: string;
  offline?: number;
  override_kv?: string;
  op_offload?: number;
  fit?: string;
  fit_target?: number;
  fit_ctx?: number;
  check_tensors?: number;
  sleep_idle_seconds?: number;
  polling?: string;
  polling_batch?: string;
  reasoning_format?: string;
  reasoning_budget?: number;
  custom_params?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ModelLoraConfig {
  id?: number;
  model_id?: number;
  lora?: string;
  lora_scaled?: string;
  control_vector?: string;
  control_vector_scaled?: string;
  control_vector_layer_range?: string;
  model_draft?: string;
  model_url_draft?: string;
  ctx_size_draft?: number;
  threads_draft?: number;
  threads_batch_draft?: number;
  draft_max?: number;
  draft_min?: number;
  draft_p_min?: number;
  cache_type_k_draft?: string;
  cache_type_v_draft?: string;
  cpu_moe_draft?: number;
  n_cpu_moe_draft?: number;
  n_gpu_layers_draft?: number;
  device_draft?: string;
  spec_replace?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ModelMultimodalConfig {
  id?: number;
  model_id?: number;
  mmproj?: string;
  mmproj_url?: string;
  mmproj_auto?: number;
  mmproj_offload?: number;
  image_min_tokens?: number;
  image_max_tokens?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelFitParams {
  id?: number;
  model_id?: number;
  recommended_ctx_size?: number | null;
  recommended_gpu_layers?: number | null;
  recommended_tensor_split?: string | null;
  file_size_bytes?: number | null;
  quantization_type?: string | null;
  parameter_count?: number | null;
  architecture?: string | null;
  context_window?: number | null;
  fit_params_analyzed_at?: number | null;
  fit_params_success?: number | null;
  fit_params_error?: string | null;
  fit_params_raw_output?: string | null;
  projected_cpu_memory_mb?: number | null;
  projected_gpu_memory_mb?: number | null;
  created_at?: number;
  updated_at?: number;
}

export interface ModelServerConfig {
  id?: number;
  host?: string;
  port?: number;
  api_prefix?: string;
  path?: string;
  webui?: string;
  webui_config_file?: string;
  no_webui?: number;
  embeddings?: number;
  reranking?: number;
  api_key?: string;
  api_key_file?: string;
  ssl_key_file?: string;
  ssl_cert_file?: string;
  timeout?: number;
  threads_http?: number;
  cache_reuse?: number;
  metrics_enabled?: number;
  props_enabled?: number;
  slots_enabled?: number;
  slot_save_path?: string;
  media_path?: string;
  models_dir?: string;
  models_preset?: string;
  models_max?: number;
  models_autoload?: number;
  jinja?: number;
  chat_template?: string;
  chat_template_file?: string;
  chat_template_kwargs?: string;
  prefill_assistant?: number;
  ctx_checkpoints?: number;
  verbose_prompt?: number;
  warmup?: number;
  spm_infill?: number;
  log_disable?: number;
  log_file?: string;
  log_colors?: string;
  log_verbose?: number;
  log_prefix?: number;
  log_timestamps?: number;
  created_at?: number;
  updated_at?: number;
}

// Model CRUD Operations
export function saveModel(
  config: Omit<ModelConfig, "id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  // Validate required fields
  if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
    throw new Error('Model name is required and cannot be empty');
  }

  // Normalize name
  config.name = config.name.trim();

  try {
    const stmt = db.prepare(`
      INSERT INTO models (
        name, type, status,
        model_path, model_url, docker_repo, hf_repo, hf_repo_draft, hf_file, hf_file_v, hf_token,
        ctx_size, predict, batch_size, ubatch_size, n_parallel, cont_batching,
        threads, threads_batch, cpu_mask, cpu_range, cpu_strict, cpu_mask_batch,
        cpu_range_batch, cpu_strict_batch, priority, priority_batch,
        file_size_bytes, fit_params_available, last_fit_params_check,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      config.name,
      config.type || "llama",
      config.status || "stopped",
      config.model_path ?? null,
      config.model_url ?? null,
      config.docker_repo ?? null,
      config.hf_repo ?? null,
      config.hf_repo_draft ?? null,
      config.hf_file ?? null,
      config.hf_file_v ?? null,
      config.hf_token ?? null,
      config.ctx_size ?? 0,
      config.predict ?? -1,
      config.batch_size ?? 2048,
      config.ubatch_size ?? 512,
      config.n_parallel ?? -1,
      config.cont_batching ?? 0,
      config.threads ?? -1,
      config.threads_batch ?? null,
      config.cpu_mask ?? null,
      config.cpu_range ?? null,
      config.cpu_strict ?? 0,
      config.cpu_mask_batch ?? null,
      config.cpu_range_batch ?? null,
      config.cpu_strict_batch ?? 0,
      config.priority ?? 0,
      config.priority_batch ?? null,
      config.file_size_bytes ?? null,
      config.fit_params_available ?? 0,
      config.last_fit_params_check ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function saveModelFitParams(
  modelId: number,
  fitParams: Omit<ModelFitParams, "id" | "model_id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO model_fit_params (
        model_id, recommended_ctx_size, recommended_gpu_layers, recommended_tensor_split,
        file_size_bytes, quantization_type, parameter_count, architecture, context_window,
        fit_params_analyzed_at, fit_params_success, fit_params_error, fit_params_raw_output,
        projected_cpu_memory_mb, projected_gpu_memory_mb, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      modelId,
      fitParams.recommended_ctx_size ?? null,
      fitParams.recommended_gpu_layers ?? null,
      fitParams.recommended_tensor_split ?? null,
      fitParams.file_size_bytes ?? null,
      fitParams.quantization_type ?? null,
      fitParams.parameter_count ?? null,
      fitParams.architecture ?? null,
      fitParams.context_window ?? null,
      fitParams.fit_params_analyzed_at ?? now,
      fitParams.fit_params_success ?? 0,
      fitParams.fit_params_error ?? null,
      fitParams.fit_params_raw_output ?? null,
      fitParams.projected_cpu_memory_mb ?? null,
      fitParams.projected_gpu_memory_mb ?? null,
      now,
      now
    );

    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function saveServerConfig(
  config: Omit<ModelServerConfig, "id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const existing = db.prepare("SELECT id FROM model_server_config").get() as { id: number } | undefined;

    if (existing) {
      const stmt = db.prepare(`
        UPDATE model_server_config SET
          host = ?, port = ?, api_prefix = ?, path = ?, webui = ?, webui_config_file = ?,
          no_webui = ?, embeddings = ?, reranking = ?, api_key = ?, api_key_file = ?,
          ssl_key_file = ?, ssl_cert_file = ?, timeout = ?, threads_http = ?, cache_reuse = ?,
          metrics_enabled = ?, props_enabled = ?, slots_enabled = ?, slot_save_path = ?,
          media_path = ?, models_dir = ?, models_preset = ?, models_max = ?,
          models_autoload = ?, jinja = ?, chat_template = ?, chat_template_file = ?,
          chat_template_kwargs = ?, prefill_assistant = ?, ctx_checkpoints = ?,
          verbose_prompt = ?, warmup = ?, spm_infill = ?, log_disable = ?,
          log_file = ?, log_colors = ?, log_verbose = ?, log_prefix = ?, log_timestamps = ?,
          updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        config.host ?? "127.0.0.1",
        config.port ?? 8080,
        config.api_prefix ?? null,
        config.path ?? null,
        config.webui ?? null,
        config.webui_config_file ?? null,
        config.no_webui ?? 0,
        config.embeddings ?? 0,
        config.reranking ?? 0,
        config.api_key ?? null,
        config.api_key_file ?? null,
        config.ssl_key_file ?? null,
        config.ssl_cert_file ?? null,
        config.timeout ?? 600,
        config.threads_http ?? null,
        config.cache_reuse ?? null,
        config.metrics_enabled ?? 1,
        config.props_enabled ?? 0,
        config.slots_enabled ?? 0,
        config.slot_save_path ?? null,
        config.media_path ?? null,
        config.models_dir ?? null,
        config.models_preset ?? null,
        config.models_max ?? 4,
        config.models_autoload ?? 0,
        config.jinja ?? 0,
        config.chat_template ?? null,
        config.chat_template_file ?? null,
        config.chat_template_kwargs ?? null,
        config.prefill_assistant ?? 0,
        config.ctx_checkpoints ?? 8,
        config.verbose_prompt ?? 0,
        config.warmup ?? 0,
        config.spm_infill ?? 0,
        config.log_disable ?? null,
        config.log_file ?? null,
        config.log_colors ?? null,
        config.log_verbose ?? 0,
        config.log_prefix ?? 0,
        config.log_timestamps ?? 0,
        now,
        existing.id
      );

      return existing.id;
    } else {
      const stmt = db.prepare(`
        INSERT INTO model_server_config (
          host, port, api_prefix, path, webui, webui_config_file, no_webui,
          embeddings, reranking, api_key, api_key_file, ssl_key_file, ssl_cert_file,
          timeout, threads_http, cache_reuse, metrics_enabled, props_enabled,
          slots_enabled, slot_save_path, media_path, models_dir, models_preset,
          models_max, models_autoload, jinja, chat_template, chat_template_file,
          chat_template_kwargs, prefill_assistant, ctx_checkpoints, verbose_prompt,
          warmup, spm_infill, log_disable, log_file, log_colors, log_verbose,
          log_prefix, log_timestamps, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        config.host ?? "127.0.0.1",
        config.port ?? 8080,
        config.api_prefix ?? null,
        config.path ?? null,
        config.webui ?? null,
        config.webui_config_file ?? null,
        config.no_webui ?? 0,
        config.embeddings ?? 0,
        config.reranking ?? 0,
        config.api_key ?? null,
        config.api_key_file ?? null,
        config.ssl_key_file ?? null,
        config.ssl_cert_file ?? null,
        config.timeout ?? 600,
        config.threads_http ?? null,
        config.cache_reuse ?? null,
        config.metrics_enabled ?? 1,
        config.props_enabled ?? 0,
        config.slots_enabled ?? 0,
        config.slot_save_path ?? null,
        config.media_path ?? null,
        config.models_dir ?? null,
        config.models_preset ?? null,
        config.models_max ?? 4,
        config.models_autoload ?? 0,
        config.jinja ?? 0,
        config.chat_template ?? null,
        config.chat_template_file ?? null,
        config.chat_template_kwargs ?? null,
        config.prefill_assistant ?? 0,
        config.ctx_checkpoints ?? 8,
        config.verbose_prompt ?? 0,
        config.warmup ?? 0,
        config.spm_infill ?? 0,
        config.log_disable ?? null,
        config.log_file ?? null,
        config.log_colors ?? null,
        config.log_verbose ?? 0,
        config.log_prefix ?? 0,
        config.log_timestamps ?? 0,
        now,
        now
      );

      return result.lastInsertRowid as number;
    }
  } finally {
    closeDatabase(db);
  }
}

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

export function shouldReanalyzeFitParams(modelId: number, modelPath: string): boolean {
  const db = initDatabase();

  try {
    const model = db.prepare("SELECT last_fit_params_check FROM models WHERE id = ?").get(modelId) as {
      last_fit_params_check: number | null;
    } | undefined;

    if (!model || !model.last_fit_params_check) {
      return true;
    }

    if (!fs.existsSync(modelPath)) {
      return false;
    }

    const stats = fs.statSync(modelPath);
    const fileModifiedTime = stats.mtimeMs;

    return fileModifiedTime > model.last_fit_params_check;
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

export function updateModel(
  id: number,
  updates: Partial<Omit<ModelConfig, "id" | "name" | "type" | "created_at">>
): void {
  const db = initDatabase();

  try {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    const stmt = db.prepare(`
      UPDATE models
      SET ${fields}, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(...values, Date.now(), id);
  } finally {
    closeDatabase(db);
  }
}

export function deleteModel(id: number): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM models WHERE id = ?");
    stmt.run(id);
  } finally {
    closeDatabase(db);
  }
}

export function deleteAllModels(): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM models");
    stmt.run();
  } finally {
    closeDatabase(db);
  }
}

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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

  const result: {
    model: ModelConfig;
    sampling?: ModelSamplingConfig;
    memory?: ModelMemoryConfig;
    gpu?: ModelGpuConfig;
    advanced?: ModelAdvancedConfig;
    lora?: ModelLoraConfig;
    multimodal?: ModelMultimodalConfig;
  } = {
    model,
  };

  if (sampling) result.sampling = sampling;
  if (memory) result.memory = memory;
  if (gpu) result.gpu = gpu;
  if (advanced) result.advanced = advanced;
  if (lora) result.lora = lora;
  if (multimodal) result.multimodal = multimodal;

  return result;
}
