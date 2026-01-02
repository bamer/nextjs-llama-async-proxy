// src/lib/database/types/model-gpu.types.ts

/**
 * Model GPU configuration table schemas
 */
export const MODEL_TABLES_GPU = {
  model_gpu_config: `
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
  `,
} as const;
