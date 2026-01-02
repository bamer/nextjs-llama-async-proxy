// src/lib/database/types/model-multimodal.types.ts

/**
 * Model multimodal configuration table schemas
 */
export const MODEL_TABLES_MULTIMODAL = {
  model_multimodal_config: `
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
  `,
} as const;
