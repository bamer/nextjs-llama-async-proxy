/**
 * Llama.cpp server configuration schemas
 */

export const LLAMA_SCHEMAS = {
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
