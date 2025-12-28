import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "llama-dashboard.db");

/**
 * Initialize database connection and create tables if needed
 * @returns Database instance
 */
export function initDatabase(): Database.Database {
  const db = new Database(DB_PATH, {
    readonly: false,
    fileMustExist: false,
    timeout: 5000,
  });

  // Enable WAL mode for better performance
  db.pragma("journal_mode = WAL");

  createTables(db);
  return db;
}

/**
 * Close database connection
 * @param db - Database instance to close
 */
export function closeDatabase(db: Database.Database): void {
  db.close();
}

/**
 * Get database file size in bytes
 * @returns Database file size in bytes
 */
export function getDatabaseSize(): number {
  const stats = fs.statSync(DB_PATH);
  return stats.size;
}

/**
 * Create all database tables and indexes
 * @param db - Database instance
 */
function createTables(db: Database.Database): void {
  // Metrics History Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      cpu_usage REAL NOT NULL,
      memory_usage REAL NOT NULL,
      disk_usage REAL NOT NULL,
      gpu_usage REAL NOT NULL,
      gpu_temperature REAL NOT NULL,
      gpu_memory_used REAL NOT NULL,
      gpu_memory_total REAL NOT NULL,
      gpu_power_usage REAL NOT NULL,
      active_models INTEGER NOT NULL,
      uptime INTEGER NOT NULL,
      requests_per_minute REAL NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics_history(created_at);
  `);

  // Models Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('running', 'stopped', 'loading', 'error')),
      model_path TEXT,
      model_url TEXT,
      docker_repo TEXT,
      hf_repo TEXT,
      hf_repo_draft TEXT,
      hf_file TEXT,
      hf_file_v TEXT,
      hf_token TEXT,
      ctx_size INTEGER DEFAULT 0,
      predict INTEGER DEFAULT -1,
      batch_size INTEGER DEFAULT 2048,
      ubatch_size INTEGER DEFAULT 512,
      n_parallel INTEGER DEFAULT -1,
      cont_batching INTEGER DEFAULT 0,
      threads INTEGER DEFAULT -1,
      threads_batch INTEGER,
      cpu_mask TEXT,
      cpu_range TEXT,
      cpu_strict INTEGER DEFAULT 0,
      cpu_mask_batch TEXT,
      cpu_range_batch TEXT,
      cpu_strict_batch INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 0,
      priority_batch INTEGER,
      cache_ram INTEGER DEFAULT -1,
      cache_type_k TEXT,
      cache_type_v TEXT,
      mmap INTEGER DEFAULT 0,
      mlock INTEGER DEFAULT 0,
      numa TEXT,
      defrag_thold INTEGER,
      device TEXT,
      list_devices INTEGER DEFAULT 0,
      gpu_layers INTEGER DEFAULT -1,
      split_mode TEXT,
      tensor_split TEXT,
      main_gpu INTEGER,
      kv_offload INTEGER DEFAULT 0,
      repack INTEGER DEFAULT 0,
      no_host INTEGER DEFAULT 0,
      swa_full INTEGER DEFAULT 0,
      override_tensor TEXT,
      cpu_moe INTEGER DEFAULT 0,
      n_cpu_moe INTEGER DEFAULT 0,
      kv_unified INTEGER DEFAULT 0,
      temperature REAL DEFAULT 0.8,
      top_k INTEGER DEFAULT 40,
      top_p REAL DEFAULT 0.9,
      min_p REAL DEFAULT 0.1,
      top_nsigma REAL DEFAULT -1.0,
      xtc_probability REAL DEFAULT 0.0,
      xtc_threshold REAL DEFAULT 0.1,
      typical_p REAL DEFAULT 1.0,
      repeat_last_n INTEGER DEFAULT 64,
      repeat_penalty REAL DEFAULT 1.0,
      presence_penalty REAL DEFAULT 0.0,
      frequency_penalty REAL DEFAULT 0.0,
      dry_multiplier REAL DEFAULT 0.0,
      dry_base REAL DEFAULT 1.75,
      dry_allowed_length INTEGER DEFAULT 2,
      dry_penalty_last_n INTEGER DEFAULT -1,
      dry_sequence_breaker TEXT,
      dynatemp_range REAL DEFAULT 0.0,
      dynatemp_exp REAL DEFAULT 1.0,
      mirostat INTEGER DEFAULT 0,
      mirostat_lr REAL DEFAULT 0.1,
      mirostat_ent REAL DEFAULT 5.0,
      samplers TEXT,
      sampler_seq TEXT DEFAULT 'edskypmxt',
      seed INTEGER DEFAULT -1,
      grammar TEXT,
      grammar_file TEXT,
      json_schema TEXT,
      json_schema_file TEXT,
      ignore_eos INTEGER DEFAULT 1,
      escape BOOLEAN DEFAULT 1,
      rope_scaling_type TEXT,
      rope_scale REAL,
      rope_freq_base REAL,
      rope_freq_scale REAL,
      yarn_orig_ctx INTEGER DEFAULT 0,
      yarn_ext_factor REAL DEFAULT -1.0,
      yarn_attn_factor REAL DEFAULT -1.0,
      yarn_beta_slow REAL DEFAULT -1.0,
      yarn_beta_fast REAL DEFAULT -1.0,
      flash_attn TEXT DEFAULT 'auto',
      mmproj TEXT,
      mmproj_url TEXT,
      mmproj_auto INTEGER DEFAULT 0,
      mmproj_offload INTEGER DEFAULT 0,
      image_min_tokens INTEGER,
      image_max_tokens INTEGER,
      lora TEXT,
      lora_scaled TEXT,
      control_vector TEXT,
      control_vector_scaled TEXT,
      control_vector_layer_range TEXT,
      model_draft TEXT,
      model_url_draft TEXT,
      ctx_size_draft INTEGER,
      threads_draft INTEGER,
      threads_batch_draft INTEGER,
      draft_max INTEGER DEFAULT 16,
      draft_min INTEGER DEFAULT 0,
      draft_p_min REAL DEFAULT 0.8,
      cache_type_k_draft TEXT,
      cache_type_v_draft TEXT,
      cpu_moe_draft INTEGER DEFAULT 0,
      n_cpu_moe_draft INTEGER DEFAULT 0,
      n_gpu_layers_draft INTEGER,
      device_draft TEXT,
      spec_replace TEXT,
      log_disable INTEGER,
      log_file TEXT,
      log_colors TEXT,
      log_verbose INTEGER DEFAULT 0,
      log_prefix INTEGER DEFAULT 0,
      log_timestamps INTEGER DEFAULT 0,
      logit_bias TEXT,
      host TEXT DEFAULT '127.0.0.1',
      port INTEGER DEFAULT 8080,
      api_prefix TEXT,
      path TEXT,
      webui TEXT,
      webui_config_file TEXT,
      no_webui INTEGER DEFAULT 0,
      embeddings INTEGER DEFAULT 0,
      reranking INTEGER DEFAULT 0,
      api_key TEXT,
      api_key_file TEXT,
      ssl_key_file TEXT,
      ssl_cert_file TEXT,
      timeout INTEGER DEFAULT 600,
      threads_http INTEGER,
      cache_reuse INTEGER,
      metrics_enabled INTEGER DEFAULT 1,
      props_enabled INTEGER DEFAULT 0,
      slots_enabled INTEGER DEFAULT 0,
      slot_save_path TEXT,
      media_path TEXT,
      models_dir TEXT,
      models_preset TEXT,
      models_max INTEGER DEFAULT 4,
      models_autoload INTEGER DEFAULT 0,
      jinja INTEGER DEFAULT 0,
      chat_template TEXT,
      chat_template_file TEXT,
      chat_template_kwargs TEXT,
      prefill_assistant INTEGER DEFAULT 0,
      ctx_checkpoints INTEGER DEFAULT 8,
      verbose_prompt INTEGER DEFAULT 0,
      warmup INTEGER DEFAULT 0,
      spm_infill INTEGER DEFAULT 0,
      pooling TEXT,
      context_shift INTEGER DEFAULT 0,
      rpc TEXT,
      offline INTEGER DEFAULT 0,
      override_kv TEXT,
      op_offload INTEGER DEFAULT 0,
      fit TEXT,
      fit_target INTEGER DEFAULT 1024,
      fit_ctx INTEGER DEFAULT 4096,
      check_tensors INTEGER DEFAULT 0,
      sleep_idle_seconds INTEGER DEFAULT -1,
      polling TEXT,
      polling_batch TEXT,
      reasoning_format TEXT,
      reasoning_budget INTEGER DEFAULT -1,
      custom_params TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
    CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
    CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
    CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at);
  `);

  // Metadata Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO metadata (key, value, updated_at)
    VALUES ('db_version', '1.0', ${Date.now()});
  `);
}

// Metrics History Types
export interface MetricsData {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  gpu_usage?: number;
  gpu_temperature?: number;
  gpu_memory_used?: number;
  gpu_memory_total?: number;
  gpu_power_usage?: number;
  active_models?: number;
  uptime?: number;
  requests_per_minute?: number;
}

export interface MetricsHistoryEntry {
  id: number;
  timestamp: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  gpu_usage: number;
  gpu_temperature: number;
  gpu_memory_used: number;
  gpu_memory_total: number;
  gpu_power_usage: number;
  active_models: number;
  uptime: number;
  requests_per_minute: number;
  created_at: number;
}

/**
 * Save metrics to database and auto-cleanup old records (>10 minutes)
 * @param data - Metrics data to save
 */
export function saveMetrics(data: MetricsData): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      INSERT INTO metrics_history (
        timestamp, cpu_usage, memory_usage, disk_usage, gpu_usage,
        gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
        active_models, uptime, requests_per_minute, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      Date.now(),
      data.cpu_usage ?? 0,
      data.memory_usage ?? 0,
      data.disk_usage ?? 0,
      data.gpu_usage ?? 0,
      data.gpu_temperature ?? 0,
      data.gpu_memory_used ?? 0,
      data.gpu_memory_total ?? 0,
      data.gpu_power_usage ?? 0,
      data.active_models ?? 0,
      data.uptime ?? 0,
      data.requests_per_minute ?? 0,
      Date.now()
    );

    // Auto-cleanup: Delete records older than 10 minutes
    const cleanupStmt = db.prepare(`
      DELETE FROM metrics_history
      WHERE created_at < ?
    `);

    cleanupStmt.run(Date.now() - 10 * 60 * 1000);
  } finally {
    closeDatabase(db);
  }
}

/**
 * Get metrics history for the last N minutes
 * @param minutes - Number of minutes to retrieve (default: 10)
 * @returns Array of metrics history entries
 */
export function getMetricsHistory(minutes: number = 10): MetricsHistoryEntry[] {
  const db = initDatabase();
  const cutoffTime = Date.now() - minutes * 60 * 1000;

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      WHERE created_at >= ?
      ORDER BY timestamp ASC
    `);

    const entries = stmt.all(cutoffTime) as MetricsHistoryEntry[];
    return entries;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Get the most recent metrics from database
 * @returns Latest metrics data or null if no records exist
 */
export function getLatestMetrics(): MetricsData | null {
  const db = initDatabase();

  try {
    const row = db.prepare(`
      SELECT cpu_usage, memory_usage, disk_usage, gpu_usage,
             gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
             active_models, uptime, requests_per_minute
      FROM metrics_history
      ORDER BY timestamp DESC
      LIMIT 1
    `).get() as MetricsData | undefined;

    if (!row) return null;
    return row;
  } finally {
    closeDatabase(db);
  }
}

// Models Management Types
export interface ModelConfig {
  id?: number;
  name: string;
  type: "llama" | "gpt" | "mistrall" | "custom";
  status: "running" | "stopped" | "loading" | "error";

  // Model Path & Loading
  model_path?: string;
  model_url?: string;
  docker_repo?: string;
  hf_repo?: string;
  hf_repo_draft?: string;
  hf_file?: string;
  hf_file_v?: string;
  hf_token?: string;

  // Context & Processing
  ctx_size?: number;
  predict?: number;
  batch_size?: number;
  ubatch_size?: number;
  n_parallel?: number;
  cont_batching?: number;

  // Threading
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

  // Memory & Performance
  cache_ram?: number;
  cache_type_k?: string;
  cache_type_v?: string;
  mmap?: number;
  mlock?: number;
  numa?: string;
  defrag_thold?: number;

  // GPU Offloading
  device?: string;
  list_devices?: number;
  gpu_layers?: number;
  split_mode?: string;
  tensor_split?: string;
  main_gpu?: number;
  kv_offload?: number;
  repack?: number;
  no_host?: number;

  // Advanced Memory
  swa_full?: number;
  override_tensor?: string;
  cpu_moe?: number;
  n_cpu_moe?: number;
  kv_unified?: number;

  // Sampling Parameters
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
  dynatemp_exp?: number;
  mirostat?: number;
  mirostat_lr?: number;
  mirostat_ent?: number;
  samplers?: string;
  sampler_seq?: string;
  seed?: number;

  // Grammar & Constraints
  grammar?: string;
  grammar_file?: string;
  json_schema?: string;
  json_schema_file?: string;
  ignore_eos?: number;
  escape?: boolean;

  // RoPE & Attention
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

  // Multi-modal
  mmproj?: string;
  mmproj_url?: string;
  mmproj_auto?: number;
  mmproj_offload?: number;
  image_min_tokens?: number;
  image_max_tokens?: number;

  // LoRA & Control Vectors
  lora?: string;
  lora_scaled?: string;
  control_vector?: string;
  control_vector_scaled?: string;
  control_vector_layer_range?: string;

  // Draft Model (Speculative Decoding)
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

  // Logging
  log_disable?: number;
  log_file?: string;
  log_colors?: string;
  log_verbose?: number;
  log_prefix?: number;
  log_timestamps?: number;
  logit_bias?: string;

  // Server Configuration
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

  // Example-Specific
  ctx_checkpoints?: number;

  // Advanced
  verbose_prompt?: number;
  warmup?: number;
  spm_infill?: number;
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

  // Flexible parameters
  custom_params?: string;

  created_at?: number;
  updated_at?: number;
}

/**
 * Save a new model configuration to database
 * @param config - Model configuration (without id, created_at, updated_at)
 * @returns The ID of the newly created model
 */
export function saveModel(
  config: Omit<ModelConfig, "id" | "created_at" | "updated_at">
): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT INTO models (
        name, type, status,
        model_path, model_url, docker_repo, hf_repo, hf_repo_draft, hf_file, hf_file_v, hf_token,
        ctx_size, predict, batch_size, ubatch_size, n_parallel, cont_batching,
        threads, threads_batch, cpu_mask, cpu_range, cpu_strict, cpu_mask_batch,
        cpu_range_batch, cpu_strict_batch, priority, priority_batch,
        cache_ram, cache_type_k, cache_type_v, mmap, mlock, numa, defrag_thold,
        device, list_devices, gpu_layers, split_mode, tensor_split, main_gpu,
        kv_offload, repack, no_host, swa_full, override_tensor,
        cpu_moe, n_cpu_moe, kv_unified,
        temperature, top_k, top_p, min_p, top_nsigma, xtc_probability, xtc_threshold, typical_p,
        repeat_last_n, repeat_penalty, presence_penalty, frequency_penalty,
        dry_multiplier, dry_base, dry_allowed_length, dry_penalty_last_n, dry_sequence_breaker,
        dynatemp_range, dynatemp_exp, mirostat, mirostat_lr, mirostat_ent,
        samplers, sampler_seq, seed,
        grammar, grammar_file, json_schema, json_schema_file, ignore_eos, escape,
        rope_scaling_type, rope_scale, rope_freq_base, rope_freq_scale,
        yarn_orig_ctx, yarn_ext_factor, yarn_attn_factor, yarn_beta_slow, yarn_beta_fast, flash_attn,
        mmproj, mmproj_url, mmproj_auto, mmproj_offload, image_min_tokens, image_max_tokens,
        lora, lora_scaled, control_vector, control_vector_scaled, control_vector_layer_range,
        model_draft, model_url_draft, ctx_size_draft, threads_draft, threads_batch_draft,
        draft_max, draft_min, draft_p_min, cache_type_k_draft, cache_type_v_draft,
        cpu_moe_draft, n_cpu_moe_draft, n_gpu_layers_draft, device_draft, spec_replace,
        log_disable, log_file, log_colors, log_verbose, log_prefix, log_timestamps, logit_bias,
        host, port, api_prefix, path, webui, webui_config_file, no_webui, embeddings,
        reranking, api_key, api_key_file, ssl_key_file, ssl_cert_file,
        timeout, threads_http, cache_reuse, metrics_enabled, props_enabled,
        slots_enabled, slot_save_path, media_path, models_dir, models_preset,
        models_max, models_autoload, jinja, chat_template, chat_template_file, chat_template_kwargs,
        prefill_assistant, ctx_checkpoints, verbose_prompt, warmup, spm_infill,
        pooling, context_shift, rpc, offline, override_kv, op_offload,
        fit, fit_target, fit_ctx, check_tensors, sleep_idle_seconds,
        polling, polling_batch, reasoning_format, reasoning_budget, custom_params,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      config.cache_ram ?? -1,
      config.cache_type_k ?? null,
      config.cache_type_v ?? null,
      config.mmap ?? 0,
      config.mlock ?? 0,
      config.numa ?? null,
      config.defrag_thold ?? null,
      config.device ?? null,
      config.list_devices ?? 0,
      config.gpu_layers ?? -1,
      config.split_mode ?? null,
      config.tensor_split ?? null,
      config.main_gpu ?? null,
      config.kv_offload ?? 0,
      config.repack ?? 0,
      config.no_host ?? 0,
      config.swa_full ?? 0,
      config.override_tensor ?? null,
      config.cpu_moe ?? 0,
      config.n_cpu_moe ?? 0,
      config.kv_unified ?? 0,
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
      config.dynatemp_exp ?? 1.0,
      config.mirostat ?? 0,
      config.mirostat_lr ?? 0.1,
      config.mirostat_ent ?? 5.0,
      config.samplers ?? null,
      config.sampler_seq ?? "edskypmxt",
      config.seed ?? -1,
      config.grammar ?? null,
      config.grammar_file ?? null,
      config.json_schema ?? null,
      config.json_schema_file ?? null,
      config.ignore_eos ?? 1,
      config.escape ?? true,
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
      config.mmproj ?? null,
      config.mmproj_url ?? null,
      config.mmproj_auto ?? 0,
      config.mmproj_offload ?? 0,
      config.image_min_tokens ?? null,
      config.image_max_tokens ?? null,
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
      config.log_disable ?? null,
      config.log_file ?? null,
      config.log_colors ?? null,
      config.log_verbose ?? 0,
      config.log_prefix ?? 0,
      config.log_timestamps ?? 0,
      config.logit_bias ?? null,
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

/**
 * Get all models with optional filters
 * @param filters - Optional filters for status, type, or name
 * @returns Array of model configurations
 */
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

/**
 * Get a single model by ID
 * @param id - Model ID
 * @returns Model configuration or null if not found
 */
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

/**
 * Get a model by name
 * @param name - Model name
 * @returns Model configuration or null if not found
 */
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

/**
 * Update an existing model configuration
 * @param id - Model ID
 * @param updates - Partial updates to apply
 */
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

/**
 * Delete a model by ID
 * @param id - Model ID to delete
 */
export function deleteModel(id: number): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM models WHERE id = ?");
    stmt.run(id);
  } finally {
    closeDatabase(db);
  }
}

/**
 * Delete all models from database
 */
export function deleteAllModels(): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM models");
    stmt.run();
  } finally {
    closeDatabase(db);
  }
}

// Metadata Functions

/**
 * Set metadata key-value pair
 * @param key - Metadata key
 * @param value - Metadata value
 */
export function setMetadata(key: string, value: string): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      INSERT INTO metadata (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    stmt.run(key, value, Date.now());
  } finally {
    closeDatabase(db);
  }
}

/**
 * Get metadata value by key
 * @param key - Metadata key
 * @returns Metadata value or null if not found
 */
export function getMetadata(key: string): string | null {
  const db = initDatabase();

  try {
    const row = db
      .prepare("SELECT value FROM metadata WHERE key = ?")
      .get(key) as { value: string } | undefined;

    if (!row) return null;
    return row.value;
  } finally {
    closeDatabase(db);
  }
}

/**
 * Delete metadata key
 * @param key - Metadata key to delete
 */
export function deleteMetadata(key: string): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM metadata WHERE key = ?");
    stmt.run(key);
  } finally {
    closeDatabase(db);
  }
}

// Advanced Operations

/**
 * Vacuum database to optimize and reduce size
 */
export function vacuumDatabase(): void {
  const db = initDatabase();

  try {
    db.pragma("wal_checkpoint(TRUNCATE)");
    db.exec("VACUUM");
    console.log("Database vacuumed successfully");
  } finally {
    closeDatabase(db);
  }
}

/**
 * Export database to a file
 * @param filePath - Destination file path
 */
export function exportDatabase(filePath: string): void {
  const db = initDatabase();

  try {
    db.exec(`VACUUM INTO '${filePath}'`);
    console.log(`Database exported to ${filePath}`);
  } finally {
    closeDatabase(db);
  }
}

/**
 * Import database from a file
 * @param filePath - Source file path to import from
 */
export function importDatabase(filePath: string): void {
  const db = initDatabase();

  try {
    db.exec(`ATTACH DATABASE '${filePath}' AS backup`);
    db.exec(`
      INSERT INTO main.metrics_history
      SELECT * FROM backup.metrics_history
      WHERE NOT EXISTS (
        SELECT 1 FROM main.metrics_history WHERE main.metrics_history.id = backup.metrics_history.id
      );

      INSERT INTO main.models
      SELECT * FROM backup.models
      WHERE NOT EXISTS (
        SELECT 1 FROM main.models WHERE main.models.id = backup.models.id
      );

      INSERT INTO main.metadata
      SELECT * FROM backup.metadata
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;

      DETACH DATABASE backup;
    `);
    console.log(`Database imported from ${filePath}`);
  } finally {
    closeDatabase(db);
  }
}
