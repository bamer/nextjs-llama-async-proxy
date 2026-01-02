/**
 * Model configuration database schemas
 */

export const MODEL_CONFIG_SCHEMAS = {
  models: `
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
  `,
} as const;
