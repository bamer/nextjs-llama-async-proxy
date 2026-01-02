// src/lib/database/types/model-memory.types.ts

/**
 * Model memory configuration table schemas
 */
export const MODEL_TABLES_MEMORY = {
  model_memory_config: `
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
  `,
} as const;
