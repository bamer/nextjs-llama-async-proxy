// src/lib/database/types/model-advanced.types.ts

/**
 * Model advanced configuration table schemas
 */
export const MODEL_TABLES_ADVANCED = {
  model_advanced_config: `
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
  `,
} as const;
