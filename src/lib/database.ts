import Database from 'better-sqlite3';

// Database file location
const DB_PATH = './data/llama-dashboard.db';

// Initialize database
let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // Better performance
  createTables();
  return db;
}

export function getDatabase(): Database.Database | null {
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function createTables(): void {
  // METRICS HISTORY TABLE - Stores last 10 minutes of metrics
  db!.exec(`
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      cpu_usage REAL,
      memory_usage REAL,
      disk_usage REAL,
      gpu_usage REAL,
      gpu_temperature REAL,
      gpu_memory_used REAL,
      gpu_memory_total REAL,
      gpu_power_usage REAL,
      active_models INTEGER,
      uptime INTEGER,
      requests_per_minute REAL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Create index on timestamp for fast time-based queries
  db!.exec(`CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp)`);

  // Create index on timestamp with created_at for cleanup
  db!.exec(`CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics_history(created_at)`);

  // MODELS TABLE - Stores all models and their parameters
  db!.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL, -- 'running', 'stopped', 'loading', 'error'
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),

      -- Model Path & Loading
      model_path TEXT,
      model_url TEXT,
      docker_repo TEXT,
      hf_repo TEXT,
      hf_repo_draft TEXT,
      hf_file TEXT,
      hf_file_v TEXT,
      hf_token TEXT,

      -- Context & Processing
      ctx_size INTEGER,              -- Context window size
      predict INTEGER,               -- Number of tokens to predict (-1 = infinity)
      batch_size INTEGER,            -- Logical maximum batch size
      ubatch_size INTEGER,           -- Physical maximum batch size
      n_parallel INTEGER,            -- Number of server slots
      cont_batching INTEGER,         -- Continuous batching (0=disabled, 1=enabled)

      -- Threading
      threads INTEGER,              -- Number of CPU threads (-1 = auto)
      threads_batch INTEGER,         -- Threads for batch processing
      cpu_mask TEXT,              -- CPU affinity mask (hex)
      cpu_range TEXT,              -- CPU range for affinity
      cpu_strict INTEGER,          -- Strict CPU placement (0/1)
      cpu_mask_batch TEXT,         -- CPU affinity mask for batch (hex)
      cpu_range_batch TEXT,         -- CPU range for batch
      cpu_strict_batch INTEGER,    -- Strict CPU placement for batch (0/1)
      priority INTEGER,              -- Process priority (-1=low, 0=normal, 1=medium, 2=high, 3=realtime)
      priority_batch INTEGER,       -- Priority for batch

      -- Memory & Performance
      cache_ram INTEGER,           -- Max cache size in MiB (-1 = no limit)
      cache_type_k TEXT,          -- KV cache data type for K (f32, f16, bf16, q8_0, etc.)
      cache_type_v TEXT,          -- KV cache data type for V
      mmap INTEGER,               -- Memory-map model (0/1)
      mlock INTEGER,              -- Keep model in RAM (0/1)
      numa TEXT,                  -- NUMA optimization (distribute, isolate, numactl)
      defrag_thold INTEGER,       -- KV cache defrag threshold (DEPRECATED)

      -- GPU Offloading
      device TEXT,                -- Device list for offloading (dev1,dev2,...)
      list_devices INTEGER,         -- Print available devices (0/1)
      gpu_layers INTEGER,          -- Max layers in VRAM (-1=auto, 'all', or number)
      split_mode TEXT,            -- Split mode (none, layer, row)
      tensor_split TEXT,          -- Fraction of model per GPU (N0,N1,N2,...)
      main_gpu INTEGER,            -- Main GPU index
      kv_offload INTEGER,         -- KV cache offloading (0/1)
      repack INTEGER,             -- Enable weight repacking (0/1)
      no_host INTEGER,            -- Bypass host buffer (0/1)

      -- Advanced Memory
      swa_full INTEGER,           -- Full-size SWA cache (0/1)
      override_tensor TEXT,        -- Override tensor buffer type
      cpu_moe INTEGER,            -- Keep all MoE weights in CPU (0/1)
      n_cpu_moe INTEGER,           -- Keep MoE weights of first N layers in CPU
      kv_unified INTEGER,          -- Unified KV buffer (0/1)

      -- Sampling Parameters
      temperature REAL,            -- Sampling temperature (default: 0.8)
      top_k INTEGER,              -- Top-k sampling (default: 40, 0=disabled)
      top_p REAL,                -- Top-p sampling (default: 0.9, 1.0=disabled)
      min_p REAL,                -- Min-p sampling (default: 0.1, 0.0=disabled)
      top_nsigma REAL,           -- Top-n sigma (default: -1.0, -1.0=disabled)
      xtc_probability REAL,       -- XTC probability (default: 0.0, 0.0=disabled)
      xtc_threshold REAL,        -- XTC threshold (default: 0.1, 1.0=disabled)
      typical REAL,              -- Locally typical sampling (default: 1.0, 1.0=disabled)
      repeat_last_n INTEGER,       -- Last n tokens for repeat penalty (default: 64)
      repeat_penalty REAL,         -- Repeat penalty (default: 1.0, 1.0=disabled)
      presence_penalty REAL,      -- Repeat alpha presence penalty (default: 0.0, 0.0=disabled)
      frequency_penalty REAL,     -- Repeat alpha frequency penalty (default: 0.0, 0.0=disabled)
      dry_multiplier REAL,       -- DRY sampling multiplier (default: 0.0, 0.0=disabled)
      dry_base REAL,             -- DRY sampling base (default: 1.75)
      dry_allowed_length INTEGER,   -- DRY allowed length (default: 2)
      dry_penalty_last_n INTEGER, -- DRY penalty for last n tokens (default: -1)
      dry_sequence_breaker TEXT,  -- DRY sequence breaker (string)
      dynatemp_range REAL,       -- Dynamic temperature range (default: 0.0, 0.0=disabled)
      dynatemp_exp REAL,         -- Dynamic temperature exponent (default: 1.0)
      mirostat INTEGER,          -- Mirostat sampling (0=disabled, 1=enabled, 2=Mirostat2.0)
      mirostat_lr REAL,         -- Mirostat learning rate (default: 0.1)
      mirostat_ent REAL,         -- Mirostat target entropy (default: 5.0)
      samplers TEXT,              -- Samplers sequence (semicolon-separated)
      sampler_seq TEXT,          -- Simplified sampler sequence (default: edskypmxt)
      seed INTEGER,               -- RNG seed (default: -1)

      -- Grammar & Constraints
      grammar TEXT,               -- BNF grammar constraint
      grammar_file TEXT,          -- Grammar file path
      json_schema TEXT,           -- JSON schema constraint
      json_schema_file TEXT,      -- JSON schema file
      ignore_eos INTEGER,         -- Ignore end of stream token (0/1)
      escape BOOLEAN,             -- Process escapes (default: true)

      -- RoPE & Attention
      rope_scaling_type TEXT,      -- RoPE scaling (none, linear, yarn)
      rope_scale REAL,            -- RoPE context scaling factor
      rope_freq_base REAL,        -- RoPE base frequency
      rope_freq_scale REAL,       -- RoPE frequency scaling factor
      yarn_orig_ctx INTEGER,       -- YaRN original context size (default: 0)
      yarn_ext_factor REAL,       -- YaRN extrapolation mix factor (default: -1.0)
      yarn_attn_factor REAL,      -- YaRN scale sqrt(t) (default: -1.0)
      yarn_beta_slow REAL,        -- YaRN high correction dim (default: -1.0)
      yarn_beta_fast REAL,        -- YaRN low correction dim (default: -1.0)
      flash_attn TEXT,           -- Flash attention (on, off, auto)

      -- Multi-modal
      mmproj TEXT,                -- Multimodal projector file
      mmproj_url TEXT,           -- Multimodal projector URL
      mmproj_auto INTEGER,        -- Auto-load multimodal projector (0/1)
      mmproj_offload INTEGER,     -- GPU offload for multimodal (0/1)
      image_min_tokens INTEGER,    -- Min tokens per image
      image_max_tokens INTEGER,    -- Max tokens per image

      -- LoRA & Control Vectors
      lora TEXT,                 -- LoRA adapter path
      lora_scaled TEXT,          -- LoRA with scaling (FNAME:SCALE,...)
      control_vector TEXT,        -- Control vector file
      control_vector_scaled TEXT,  -- Control vector with scaling (FNAME:SCALE,...)
      control_vector_layer_range TEXT, -- Layer range for control vector

      -- Draft Model (Speculative Decoding)
      model_draft TEXT,          -- Draft model path
      model_url_draft TEXT,      -- Draft model download URL
      ctx_size_draft INTEGER,     -- Draft model context size
      threads_draft INTEGER,       -- Draft model threads
      threads_batch_draft INTEGER, -- Draft model threads for batch
      draft_max INTEGER,          -- Max draft tokens (default: 16)
      draft_min INTEGER,          -- Min draft tokens (default: 0)
      draft_p_min REAL,          -- Min draft probability (default: 0.8)
      cache_type_k_draft TEXT,    -- KV cache type for draft model K
      cache_type_v_draft TEXT,    -- KV cache type for draft model V
      cpu_moe_draft INTEGER,      -- CPU MoE for draft model
      n_cpu_moe_draft INTEGER,   -- MoE weights in CPU for first N layers (draft)
      n_gpu_layers_draft INTEGER,  -- GPU layers for draft model
      device_draft TEXT,          -- Device list for draft model
      spec_replace TEXT,         -- Translate string in TARGET to DRAFT

      -- Logging
      log_disable INTEGER,         -- Disable logging (0/1)
      log_file TEXT,             -- Log to file
      log_colors TEXT,            -- Log colors (on, off, auto)
      log_verbose INTEGER,         -- Verbosity level (0-4, infinity)
      log_prefix INTEGER,         -- Enable log prefix (0/1)
      log_timestamps INTEGER,     -- Enable log timestamps (0/1)
      logit_bias TEXT,          -- Logit bias (TOKEN_ID(+/-)BIAS,...)

      -- Server Configuration
      host TEXT,                 -- Server host (default: 127.0.0.1)
      port INTEGER,               -- Server port (default: 8080)
      api_prefix TEXT,            -- API prefix path
      path TEXT,                 -- Static files path
      webui TEXT,                -- WebUI config JSON
      webui_config_file TEXT,     -- WebUI config file
      no_webui INTEGER,          -- Disable WebUI (0/1)
      embeddings INTEGER,          -- Enable embeddings only (0/1)
      reranking INTEGER,          -- Enable reranking endpoint (0/1)
      api_key TEXT,              -- API key for authentication
      api_key_file TEXT,         -- API key file path
      ssl_key_file TEXT,         -- SSL private key file
      ssl_cert_file TEXT,        -- SSL certificate file
      timeout INTEGER,            -- Server timeout in seconds (default: 600)
      threads_http INTEGER,        -- HTTP request threads
      cache_reuse INTEGER,        -- Cache reuse chunk size
      metrics_enabled INTEGER,     -- Enable metrics endpoint (0/1)
      props_enabled INTEGER,       -- Enable props endpoint (0/1)
      slots_enabled INTEGER,       -- Enable slots endpoint (0/1)
      slot_save_path TEXT,       -- Save slot KV cache path
      media_path TEXT,            -- Media files directory
      models_dir TEXT,            -- Models directory
      models_preset TEXT,         -- Models preset file
      models_max INTEGER,          -- Max models to load (default: 4, 0=unlimited)
      models_autoload INTEGER,     -- Auto-load models (0/1)
      jinja INTEGER,             -- Use jinja template (0/1)
      chat_template TEXT,         -- Custom jinja chat template
      chat_template_file TEXT,    -- Custom jinja template file
      chat_template_kwargs TEXT,   -- JSON template parser params
      prefill_assistant INTEGER,  -- Prefill assistant response (0/1)

      -- Example-Specific
      ctx_checkpoints INTEGER,     -- Max context checkpoints (default: 8)

      -- Advanced
      verbose_prompt INTEGER,     -- Print verbose prompt (0/1)
      warmup INTEGER,            -- Perform warmup (0/1)
      spm_infill INTEGER,        -- Use Suffix/Prefix/Middle pattern (0/1)
      pooling TEXT,              -- Pooling type (none, mean, cls, last, rank)
      context_shift INTEGER,       -- Context shift (0/1)
      rpc TEXT,                 -- RPC servers list
      offline INTEGER,             -- Offline mode (0/1)
      override_kv TEXT,          -- Override model metadata (KEY=TYPE:VALUE,...)
      op_offload INTEGER,         -- Offload host tensor ops (0/1)
      fit TEXT,                 -- Fit arguments to device memory (on, off)
      fit_target INTEGER,         -- Fit target MiB (default: 1024)
      fit_ctx INTEGER,           -- Fit minimum ctx size (default: 4096)
      check_tensors INTEGER,       -- Check model tensor data (0/1)
      no_host INTEGER,            -- Bypass host buffer (0/1)
      sleep_idle_seconds INTEGER, -- Sleep idle seconds (default: -1)
      polling TEXT,               -- Polling level (0-100)
      polling_batch TEXT,         -- Polling for batch (0/1)
      reasoning_format TEXT,     -- Reasoning format (none, deepseek, deepseek-legacy, auto)
      reasoning_budget INTEGER,    -- Reasoning budget (-1=unrestricted, 0=disabled)

      -- Custom Parameters (JSON for flexibility)
      custom_params TEXT         -- Additional custom parameters as JSON
    )
  `);

  // Create index on models
  db!.exec(`CREATE INDEX IF NOT EXISTS idx_models_name ON models(name)`);
  db!.exec(`CREATE INDEX IF NOT EXISTS idx_models_status ON models(status)`);
  db!.exec(`CREATE INDEX IF NOT EXISTS idx_models_type ON models(type)`);
  db!.exec(`CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at)`);

  // METADATA TABLE - Stores dashboard state
  db!.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Initialize metadata
  const stmt = db!.prepare('INSERT OR IGNORE INTO metadata (key, value) VALUES (?, ?)');
  stmt.run('db_version', '1.0');
  stmt.run('server_start_time', Date.now().toString());
}

// === METRICS HISTORY FUNCTIONS ===

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

export function saveMetrics(data: MetricsData): void {
  const timestamp = Date.now();

  const stmt = db!.prepare(`
    INSERT INTO metrics_history (
      timestamp,
      cpu_usage, memory_usage, disk_usage,
      gpu_usage, gpu_temperature,
      gpu_memory_used, gpu_memory_total,
      gpu_power_usage, active_models,
      uptime, requests_per_minute
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    timestamp,
    data.cpu_usage || null,
    data.memory_usage || null,
    data.disk_usage || null,
    data.gpu_usage || null,
    data.gpu_temperature || null,
    data.gpu_memory_used || null,
    data.gpu_memory_total || null,
    data.gpu_power_usage || null,
    data.active_models || null,
    data.uptime || null,
    data.requests_per_minute || null
  );

  // Clean up old metrics (older than 10 minutes)
  cleanupOldMetrics();
}

export function getMetricsHistory(minutes: number = 10): MetricsData[] {
  const cutoffTime = Date.now() - (minutes * 60 * 1000);

  const stmt = db!.prepare(`
    SELECT
      cpu_usage, memory_usage, disk_usage,
      gpu_usage, gpu_temperature,
      gpu_memory_used, gpu_memory_total,
      gpu_power_usage, active_models,
      uptime, requests_per_minute
    FROM metrics_history
    WHERE timestamp >= ?
    ORDER BY timestamp ASC
  `);

  return stmt.all(cutoffTime) as MetricsData[];
}

export function cleanupOldMetrics(): void {
  const cutoffTime = Date.now() - (10 * 60 * 1000); // 10 minutes

  const stmt = db!.prepare(`
    DELETE FROM metrics_history
    WHERE timestamp < ?
  `);

  stmt.run(cutoffTime);
}

// === MODELS FUNCTIONS ===

export interface ModelConfig {
  id?: number;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'loading' | 'error';
  [key: string]: any; // All other params
}

export function saveModel(model: ModelConfig): number {
  const now = Date.now();

  // Convert all params to separate columns
  const columns: string[] = ['name', 'type', 'status', 'updated_at'];
  const values: any[] = [model.name, model.type, model.status, now];

  // Map all other properties
  const skipProps = ['id', 'name', 'type', 'status', 'custom_params'];
  for (const [key, value] of Object.entries(model)) {
    if (!skipProps.includes(key)) {
      const column = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      columns.push(column);
      values.push(value);
    }
  }

  // Add custom_params if present
  if (model.custom_params) {
    columns.push('custom_params');
    values.push(JSON.stringify(model.custom_params));
  } else {
    columns.push('custom_params');
    values.push(null);
  }

  const placeholders = columns.map(() => '?').join(', ');
  const columnNames = columns.join(', ');

  const sql = `
    INSERT INTO models (${columnNames})
    VALUES (${placeholders})
  `;

  const stmt = db!.prepare(sql);
  const result = stmt.run(...values);

  return result.lastInsertRowid as number;
}

export function updateModel(id: number, model: Partial<ModelConfig>): void {
  const now = Date.now();
  const updates: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  const skipProps = ['id', 'custom_params'];
  for (const [key, value] of Object.entries(model)) {
    if (!skipProps.includes(key) && value !== undefined) {
      const column = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updates.push(`${column} = ?`);
      values.push(value);
    }
  }

  // Add custom_params to values for JSON serialization
  values.push(JSON.stringify(model.custom_params || {}));

  if (Object.keys(model).length === 1 && model.custom_params !== undefined) {
    updates.push('custom_params = ?');
  }

  values.push(id);

  const sql = `
    UPDATE models
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  const stmt = db!.prepare(sql);
  stmt.run(...values);
}

export function getModels(filter?: { status?: string; type?: string }): ModelConfig[] {
  let sql = 'SELECT * FROM models WHERE 1=1';
  const params: any[] = [];

  if (filter?.status) {
    sql += ' AND status = ?';
    params.push(filter.status);
  }

  if (filter?.type) {
    sql += ' AND type = ?';
    params.push(filter.type);
  }

  sql += ' ORDER BY created_at DESC';

  const stmt = db!.prepare(sql);
  return stmt.all(...params) as ModelConfig[];
}

export function getModelByName(name: string): ModelConfig | null {
  const stmt = db!.prepare('SELECT * FROM models WHERE name = ? LIMIT 1');
  return stmt.get(name) as ModelConfig | null;
}

export function getModelById(id: number): ModelConfig | null {
  const stmt = db!.prepare('SELECT * FROM models WHERE id = ? LIMIT 1');
  return stmt.get(id) as ModelConfig | null;
}

export function deleteModel(id: number): void {
  const stmt = db!.prepare('DELETE FROM models WHERE id = ?');
  stmt.run(id);
}

export function deleteAllModels(): void {
  db!.exec('DELETE FROM models');
}

// === METADATA FUNCTIONS ===

export function setMetadata(key: string, value: string): void {
  const stmt = db!.prepare(`
    INSERT OR REPLACE INTO metadata (key, value, updated_at)
    VALUES (?, ?, (strftime('%s', 'now'))
  `);

  stmt.run(key, value);
}

export function getMetadata(key: string): string | null {
  const stmt = db!.prepare('SELECT value FROM metadata WHERE key = ? LIMIT 1');
  const result = stmt.get(key) as { value: string } | null;
  return result ? result.value : null;
}

export function deleteMetadata(key: string): void {
  const stmt = db!.prepare('DELETE FROM metadata WHERE key = ?');
  stmt.run(key);
}

// === CLEANUP FUNCTIONS ===

export function vacuumDatabase(): void {
  db!.exec('VACUUM');
}

export function getDatabaseSize(): number {
  const stmt = db!.prepare('SELECT page_count * page_size as size FROM pragma_page_count, pragma_page_size');
  const result = stmt.get() as { size: number };
  return result.size;
}

export function exportDatabase(outputPath: string): void {
  const stmt = db!.prepare(`VACUUM INTO '${outputPath}'`);
  stmt.run();
}

export function importDatabase(inputPath: string): void {
  const stmt = db!.prepare(`ATTACH DATABASE '${inputPath}' AS import_db`);
  stmt.run();

  db!.exec(`
    INSERT OR REPLACE INTO metrics_history
    SELECT * FROM import_db.metrics_history
  `);

  db!.exec(`
    INSERT OR REPLACE INTO models
    SELECT * FROM import_db.models
  `);

  db!.exec(`
    INSERT OR REPLACE INTO metadata
    SELECT * FROM import_db.metadata
  `);

  const detachStmt = db!.prepare('DETACH DATABASE import_db');
  detachStmt.run();
}
