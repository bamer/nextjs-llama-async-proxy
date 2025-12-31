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

  // Try to set WAL mode, but don't fail if it fails (e.g., in test environments)
  try {
    db.pragma("journal_mode = WAL");
  } catch (error) {
    // WAL mode may fail in certain environments, fall back to DELETE mode
    console.warn(`[Database] Could not enable WAL mode: ${error instanceof Error ? error.message : String(error)}`);
  }

  db.pragma("synchronous = NORMAL"); // Balance between performance and durability
  db.pragma("cache_size = -64000"); // 64MB cache
  db.pragma("temp_store = MEMORY");
  createTables(db);
  return db;
}

/**
 * Close database connection and checkpoint WAL
 * @param db - Database instance to close
 */
export function closeDatabase(db: Database.Database): void {
  try {
    // Perform WAL checkpoint to ensure all changes are written to main database
    const checkpoint = db.pragma("wal_checkpoint(TRUNCATE)");
    // Only log if there was data to checkpoint
    if (checkpoint && typeof checkpoint === "object" && "checkpointed" in checkpoint) {
      const ckpt = checkpoint as { checkpointed: number; log: number; busy: number };
      if (ckpt.checkpointed > 0 || ckpt.log > 0) {
        console.log(`[Database] WAL checkpoint: ${ckpt.checkpointed} pages checkpointed, ${ckpt.log} log pages, busy: ${ckpt.busy}`);
      }
    }
  } catch (error) {
    // Don't fail on checkpoint errors, just log them
    console.warn(`[Database] WAL checkpoint warning: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    db.close();
  }
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
      file_size_bytes INTEGER,
      fit_params_available INTEGER DEFAULT 0,
      last_fit_params_check INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
    CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
    CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
    CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_fit_params (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL UNIQUE,
      recommended_ctx_size INTEGER,
      recommended_gpu_layers INTEGER,
      recommended_tensor_split TEXT,
      file_size_bytes INTEGER,
      quantization_type TEXT,
      parameter_count INTEGER,
      architecture TEXT,
      context_window INTEGER,
      fit_params_analyzed_at INTEGER,
      fit_params_success INTEGER DEFAULT 0,
      fit_params_error TEXT,
      fit_params_raw_output TEXT,
      projected_cpu_memory_mb REAL,
      projected_gpu_memory_mb REAL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_fit_params_model_id ON model_fit_params(model_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_sampling_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL UNIQUE,
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
      dynatemp_exponent REAL DEFAULT 1.0,
      mirostat INTEGER DEFAULT 0,
      mirostat_eta REAL DEFAULT 0.1,
      mirostat_tau REAL DEFAULT 5.0,
      samplers TEXT,
      sampler_seq TEXT DEFAULT 'edskypmxt',
      seed INTEGER DEFAULT -1,
      grammar TEXT,
      grammar_file TEXT,
      json_schema TEXT,
      json_schema_file TEXT,
      ignore_eos INTEGER DEFAULT 1,
      "escape" BOOLEAN DEFAULT 1,
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
      logit_bias TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sampling_model_id ON model_sampling_config(model_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_memory_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL UNIQUE,
      cache_ram INTEGER DEFAULT -1,
      cache_type_k TEXT,
      cache_type_v TEXT,
      mmap INTEGER DEFAULT 0,
      mlock INTEGER DEFAULT 0,
      numa TEXT,
      defrag_thold INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_memory_model_id ON model_memory_config(model_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_gpu_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL UNIQUE,
      device TEXT,
      list_devices INTEGER DEFAULT 0,
      gpu_layers INTEGER DEFAULT -1,
      split_mode TEXT,
      tensor_split TEXT,
      main_gpu INTEGER,
      kv_offload INTEGER DEFAULT 0,
      repack INTEGER DEFAULT 0,
      no_host INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_gpu_model_id ON model_gpu_config(model_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_advanced_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL UNIQUE,
      swa_full INTEGER DEFAULT 0,
      override_tensor TEXT,
      cpu_moe INTEGER DEFAULT 0,
      n_cpu_moe INTEGER DEFAULT 0,
      kv_unified INTEGER DEFAULT 0,
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
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_advanced_model_id ON model_advanced_config(model_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_lora_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL UNIQUE,
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
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_lora_model_id ON model_lora_config(model_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_multimodal_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL UNIQUE,
      mmproj TEXT,
      mmproj_url TEXT,
      mmproj_auto INTEGER DEFAULT 0,
      mmproj_offload INTEGER DEFAULT 0,
      image_min_tokens INTEGER,
      image_max_tokens INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_multimodal_model_id ON model_multimodal_config(model_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS model_server_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      log_disable INTEGER,
      log_file TEXT,
      log_colors TEXT,
      log_verbose INTEGER DEFAULT 0,
      log_prefix INTEGER DEFAULT 0,
      log_timestamps INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO metadata (key, value, updated_at)
    VALUES ('db_version', '2.0', ${Date.now()});
  `);
}

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

export function deleteMetadata(key: string): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM metadata WHERE key = ?");
    stmt.run(key);
  } finally {
    closeDatabase(db);
  }
}

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

export function exportDatabase(filePath: string): void {
  const db = initDatabase();

  try {
    db.exec(`VACUUM INTO '${filePath}'`);
    console.log(`Database exported to ${filePath}`);
  } finally {
    closeDatabase(db);
  }
}

export function importDatabase(filePath: string): void {
  const db = initDatabase();

  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Import file does not exist: ${filePath}`);
      return;
    }

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

      INSERT INTO main.model_sampling_config
      SELECT * FROM backup.model_sampling_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_sampling_config WHERE main.model_sampling_config.id = backup.model_sampling_config.id
      );

      INSERT INTO main.model_memory_config
      SELECT * FROM backup.model_memory_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_memory_config WHERE main.model_memory_config.id = backup.model_memory_config.id
      );

      INSERT INTO main.model_gpu_config
      SELECT * FROM backup.model_gpu_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_gpu_config WHERE main.model_gpu_config.id = backup.model_gpu_config.id
      );

      INSERT INTO main.model_advanced_config
      SELECT * FROM backup.model_advanced_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_advanced_config WHERE main.model_advanced_config.id = backup.model_advanced_config.id
      );

      INSERT INTO main.model_lora_config
      SELECT * FROM backup.model_lora_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_lora_config WHERE main.model_lora_config.id = backup.model_lora_config.id
      );

      INSERT INTO main.model_multimodal_config
      SELECT * FROM backup.model_multimodal_config
      WHERE NOT EXISTS (
        SELECT 1 FROM main.model_multimodal_config WHERE main.model_multimodal_config.id = backup.model_multimodal_config.id
      );

      INSERT OR REPLACE INTO main.model_server_config
      SELECT * FROM backup.model_server_config;

      INSERT OR REPLACE INTO main.metadata
      SELECT * FROM backup.metadata;

      DETACH DATABASE backup;
    `);
    console.log(`Database imported from ${filePath}`);
  } finally {
    closeDatabase(db);
  }
}

/**
 * Clear all data from all tables (for testing)
 * @warning This will delete all data from the database
 */
export function clearAllTables(): void {
  const db = initDatabase();

  try {
    db.exec("DELETE FROM model_fit_params");
    db.exec("DELETE FROM model_sampling_config");
    db.exec("DELETE FROM model_memory_config");
    db.exec("DELETE FROM model_gpu_config");
    db.exec("DELETE FROM model_advanced_config");
    db.exec("DELETE FROM model_lora_config");
    db.exec("DELETE FROM model_multimodal_config");
    db.exec("DELETE FROM models");
    db.exec("DELETE FROM metrics_history");
    console.log("All tables cleared");
  } finally {
    closeDatabase(db);
  }
}
