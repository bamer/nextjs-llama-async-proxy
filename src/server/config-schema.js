// Configuration schema for validation and documentation
export const LLAMA_CONFIG_SCHEMA = {
  // Server options
  port: { type: 'number', default: 8080, description: 'Server port' },
  host: { type: 'string', default: '127.0.0.1', description: 'Server host' },
  timeout: { type: 'number', default: 30000, description: 'Request timeout in ms' },

  // Model options
  model: { type: 'string', default: '', description: 'Model file path' },

  // Context and memory
  context_size: { type: 'number', default: 2048, description: 'Context size (alias: n_ctx)' },
  n_ctx: { type: 'number', default: 2048, description: 'Context size' },
  n_batch: { type: 'number', default: 512, description: 'Batch size for prompt processing' },
  n_ubatch: { type: 'number', default: 512, description: 'Batch size for prompt processing (unified)' },

  // GPU options
  n_gpu_layers: { type: 'number', default: 0, description: 'Number of layers to offload to GPU' },
  main_gpu: { type: 'number', default: 0, description: 'Main GPU index' },
  tensor_split: { type: 'string', default: '', description: 'Tensor split across GPUs (comma-separated)' },
  n_gqa: { type: 'number', default: 0, description: 'Group Query Attention factor' },

  // CPU options
  n_threads: { type: 'number', default: -1, description: 'Number of threads (-1 = auto)' },
  n_threads_batch: { type: 'number', default: -1, description: 'Number of threads for batch processing (-1 = auto)' },

  // Sampling options
  temperature: { type: 'number', default: 0.7, min: 0, max: 2, description: 'Sampling temperature' },
  top_k: { type: 'number', default: 40, min: 1, description: 'Top-K sampling' },
  top_p: { type: 'number', default: 0.9, min: 0, max: 1, description: 'Top-P sampling' },
  min_p: { type: 'number', default: 0.0, min: 0, max: 1, description: 'Minimum probability' },
  xtc_probability: { type: 'number', default: 0.0, min: 0, max: 1, description: 'XTC probability' },
  xtc_threshold: { type: 'number', default: 0.1, min: 0, max: 1, description: 'XTC threshold' },
  typical_p: { type: 'number', default: 1.0, min: 0, max: 1, description: 'Typical sampling probability' },
  repeat_last_n: { type: 'number', default: 64, min: 0, description: 'Repeat penalty window' },
  repeat_penalty: { type: 'number', default: 1.0, min: 0, description: 'Repeat penalty' },
  presence_penalty: { type: 'number', default: 0.0, min: -2, max: 2, description: 'Presence penalty' },
  frequency_penalty: { type: 'number', default: 0.0, min: -2, max: 2, description: 'Frequency penalty' },
  dry_multiplier: { type: 'number', default: 0.0, min: 0, description: 'DRY multiplier' },
  dry_base: { type: 'number', default: 1.75, min: 0, description: 'DRY base' },
  dry_allowed_length: { type: 'number', default: 2, min: 0, description: 'DRY allowed length' },
  dry_penalty_last_n: { type: 'number', default: 20, min: 0, description: 'DRY penalty window' },
  dry_sequence_breaker: { type: 'string', default: '["\\n", ":", "\\"", "*"]', description: 'DRY sequence breakers (JSON array)' },

  // Generation options
  max_tokens: { type: 'number', default: 100, min: 1, description: 'Maximum tokens to generate' },
  max_seq_len: { type: 'number', default: 0, min: 0, description: 'Maximum sequence length' },
  seed: { type: 'number', default: -1, description: 'Random seed (-1 = random)' },

  // Model loading options
  embedding: { type: 'boolean', default: false, description: 'Enable embedding mode' },
  memory_f16: { type: 'boolean', default: false, description: 'Use F16 memory' },
  memory_f32: { type: 'boolean', default: false, description: 'Use F32 memory' },
  memory_auto: { type: 'boolean', default: true, description: 'Auto-select memory type' },
  vocab_only: { type: 'boolean', default: false, description: 'Load only vocabulary' },
  rope_freq_base: { type: 'number', default: 0.0, description: 'RoPE frequency base' },
  rope_freq_scale: { type: 'number', default: 0.0, description: 'RoPE frequency scale' },
  yarn_ext_factor: { type: 'number', default: 0.0, description: 'YaRN extension factor' },
  yarn_attn_factor: { type: 'number', default: 0.0, description: 'YaRN attention factor' },
  yarn_beta_fast: { type: 'number', default: 0.0, description: 'YaRN beta fast' },
  yarn_beta_slow: { type: 'number', default: 0.0, description: 'YaRN beta slow' },

  // Server options
  api_keys: { type: 'string', default: '', description: 'API keys (comma-separated)' },
  ssl_cert_file: { type: 'string', default: '', description: 'SSL certificate file' },
  ssl_key_file: { type: 'string', default: '', description: 'SSL key file' },
  cors_allow_origins: { type: 'string', default: '', description: 'CORS allowed origins' },
  system_prompt: { type: 'string', default: '', description: 'System prompt' },
  chat_template: { type: 'string', default: '', description: 'Chat template' },

  // Logging options
  log_format: { type: 'string', default: 'text', enum: ['text', 'json'], description: 'Log format' },
  log_level: { type: 'string', default: 'info', enum: ['debug', 'info', 'warn', 'error'], description: 'Log level' },
  log_colors: { type: 'boolean', default: true, description: 'Enable log colors' },
  log_verbose: { type: 'boolean', default: false, description: 'Verbose logging' },

  // Other options
  cache_reuse: { type: 'number', default: 0, description: 'Cache reuse level' },
  cache_type_k: { type: 'string', default: 'f16', enum: ['f16', 'f32', 'q8_0', 'q4_0'], description: 'Cache type for K' },
  cache_type_v: { type: 'string', default: 'f16', enum: ['f16', 'f32', 'q8_0', 'q4_0'], description: 'Cache type for V' },
  ml_lock: { type: 'boolean', default: false, description: 'Lock memory' },
  no_kv_offload: { type: 'boolean', default: false, description: 'Disable KV offload' }
};

// Function to get config schema
export function getConfigSchema() {
  return LLAMA_CONFIG_SCHEMA;
}

// Function to validate config against schema
export function validateConfig(config) {
  const errors = [];
  const validated = {};

  for (const [key, schema] of Object.entries(LLAMA_CONFIG_SCHEMA)) {
    const value = config[key];
    const defaultValue = schema.default;

    if (value === undefined) {
      validated[key] = defaultValue;
      continue;
    }

    // Type validation
    if (schema.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push(`${key}: Expected number, got ${typeof value}`);
        validated[key] = defaultValue;
      } else {
        if (schema.min !== undefined && numValue < schema.min) {
          errors.push(`${key}: Value ${numValue} is below minimum ${schema.min}`);
        }
        if (schema.max !== undefined && numValue > schema.max) {
          errors.push(`${key}: Value ${numValue} is above maximum ${schema.max}`);
        }
        validated[key] = numValue;
      }
    } else if (schema.type === 'boolean') {
      validated[key] = Boolean(value);
    } else if (schema.type === 'string') {
      validated[key] = String(value);
      if (schema.enum && !schema.enum.includes(validated[key])) {
        errors.push(`${key}: Value "${validated[key]}" not in allowed values: ${schema.enum.join(', ')}`);
        validated[key] = defaultValue;
      }
    } else {
      validated[key] = value;
    }
  }

  return { validated, errors };
}