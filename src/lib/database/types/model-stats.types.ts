// src/lib/database/types/model-stats.types.ts

/**
 * Model statistics and fit params table schemas
 */
export const MODEL_TABLES_STATS = {
  model_fit_params: `
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
  `,
} as const;
