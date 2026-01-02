// src/lib/database/types/model-lora.types.ts

/**
 * Model LoRA and draft configuration table schemas
 */
export const MODEL_TABLES_LORA = {
  model_lora_config: `
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
  `,
} as const;
