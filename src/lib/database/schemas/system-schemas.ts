/**
 * System-related database schemas (metadata, server config)
 */
export const SYSTEM_SCHEMAS = {
  model_server_config: `
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
  `,
  metadata: `
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    INSERT OR IGNORE INTO metadata (key, value, updated_at)
    VALUES ('db_version', '2.0', ${Date.now()});
  `,
} as const;