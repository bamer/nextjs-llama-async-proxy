// src/lib/database/types/model-sampling.types.ts

/**
 * Model sampling configuration table schemas
 */
export const MODEL_TABLES_SAMPLING = {
  model_sampling_config: `
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
  `,
} as const;
