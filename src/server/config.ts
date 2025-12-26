interface LlamaServerConfig {
  baseURL: string;
  timeout: number;
  port: number;
  host: string;
}

interface DefaultLlamaConfig {
  port: number;
  host: string;
  timeout: number;
  model: string;
  context_size: number;
  n_ctx: number;
  n_batch: number;
  n_ubatch: number;
  n_gpu_layers: number;
  main_gpu: number;
  tensor_split: string;
  n_gqa: number;
  n_threads: number;
  n_threads_batch: number;
  temperature: number;
  top_k: number;
  top_p: number;
  min_p: number;
  xtc_probability: number;
  xtc_threshold: number;
  typical_p: number;
  repeat_last_n: number;
  repeat_penalty: number;
  presence_penalty: number;
  frequency_penalty: number;
  dry_multiplier: number;
  dry_base: number;
  dry_allowed_length: number;
  dry_penalty_last_n: number;
  dry_sequence_breaker: string;
  max_tokens: number;
  max_seq_len: number;
  seed: number;
  embedding: boolean;
  memory_f16: boolean;
  memory_f32: boolean;
  memory_auto: boolean;
  vocab_only: boolean;
  rope_freq_base: number;
  rope_freq_scale: number;
  yarn_ext_factor: number;
  yarn_attn_factor: number;
  yarn_beta_fast: number;
  yarn_beta_slow: number;
  system_prompt: string;
  chat_template: string;
  api_keys: string;
  ssl_cert_file: string;
  ssl_key_file: string;
  cors_allow_origins: string;
  log_format: string;
  log_level: string;
  log_colors: boolean;
  log_verbose: boolean;
  cache_reuse: number;
  cache_type_k: string;
  cache_type_v: string;
  ml_lock: boolean;
  no_kv_offload: boolean;
}

interface UpdateConfig {
  METRICS_INTERVAL: number;
  MODELS_INTERVAL: number;
  LOGS_INTERVAL: number;
}

export function createBackendConfig(): { LLAMA_SERVER: LlamaServerConfig } {
  return {
    LLAMA_SERVER: {
      baseURL: process.env.LLAMA_SERVER_BASE_URL || `http://${process.env.LLAMA_SERVER_HOST || 'localhost'}:${process.env.LLAMA_SERVER_PORT || '8080'}`,
      timeout: parseInt(process.env.LLAMA_SERVER_TIMEOUT || '30000', 10),
      port: parseInt(process.env.LLAMA_SERVER_PORT || '8080', 10),
      host: process.env.LLAMA_SERVER_HOST || 'localhost',
    },
  };
}

export function createDefaultLlamaConfig(): DefaultLlamaConfig {
  return {
    port: parseInt(process.env.LLAMA_SERVER_PORT || '8080', 10),
    host: process.env.LLAMA_SERVER_HOST || 'localhost',
    timeout: parseInt(process.env.LLAMA_SERVER_TIMEOUT || '30000', 10),
    model: process.env.LLAMA_MODEL || '',
    context_size: parseInt(process.env.LLAMA_CONTEXT_SIZE || '2048', 10),
    n_ctx: parseInt(process.env.LLAMA_N_CTX || '2048', 10),
    n_batch: parseInt(process.env.LLAMA_N_BATCH || '512', 10),
    n_ubatch: parseInt(process.env.LLAMA_N_UBATCH || '512', 10),
    n_gpu_layers: parseInt(process.env.LLAMA_GPU_LAYERS || '0', 10),
    main_gpu: parseInt(process.env.LLAMA_MAIN_GPU || '0', 10),
    tensor_split: process.env.LLAMA_TENSOR_SPLIT || '',
    n_gqa: parseInt(process.env.LLAMA_N_GQA || '0', 10),
    n_threads: parseInt(process.env.LLAMA_THREADS || '-1', 10),
    n_threads_batch: parseInt(process.env.LLAMA_THREADS_BATCH || '-1', 10),
    temperature: parseFloat(process.env.LLAMA_TEMPERATURE || '0.7'),
    top_k: parseInt(process.env.LLAMA_TOP_K || '40', 10),
    top_p: parseFloat(process.env.LLAMA_TOP_P || '0.9'),
    min_p: parseFloat(process.env.LLAMA_MIN_P || '0.0'),
    xtc_probability: parseFloat(process.env.LLAMA_XTC_PROBABILITY || '0.0'),
    xtc_threshold: parseFloat(process.env.LLAMA_XTC_THRESHOLD || '0.1'),
    typical_p: parseFloat(process.env.LLAMA_TYPICAL_P || '1.0'),
    repeat_last_n: parseInt(process.env.LLAMA_REPEAT_LAST_N || '64', 10),
    repeat_penalty: parseFloat(process.env.LLAMA_REPEAT_PENALTY || '1.0'),
    presence_penalty: parseFloat(process.env.LLAMA_PRESENCE_PENALTY || '0.0'),
    frequency_penalty: parseFloat(process.env.LLAMA_FREQUENCY_PENALTY || '0.0'),
    dry_multiplier: parseFloat(process.env.LLAMA_DRY_MULTIPLIER || '0.0'),
    dry_base: parseFloat(process.env.LLAMA_DRY_BASE || '1.75'),
    dry_allowed_length: parseInt(process.env.LLAMA_DRY_ALLOWED_LENGTH || '2', 10),
    dry_penalty_last_n: parseInt(process.env.LLAMA_DRY_PENALTY_LAST_N || '20', 10),
    dry_sequence_breaker: process.env.LLAMA_DRY_SEQUENCE_BREAKER || '["\\\\n", ":", "\\"", "*"]',
    max_tokens: parseInt(process.env.LLAMA_MAX_TOKENS || '100', 10),
    max_seq_len: parseInt(process.env.LLAMA_MAX_SEQ_LEN || '0', 10),
    seed: parseInt(process.env.LLAMA_SEED || '-1', 10),
    embedding: process.env.LLAMA_EMBEDDING === 'true',
    memory_f16: process.env.LLAMA_MEMORY_F16 === 'true',
    memory_f32: process.env.LLAMA_MEMORY_F32 === 'true',
    memory_auto: process.env.LLAMA_MEMORY_AUTO !== 'false',
    vocab_only: process.env.LLAMA_VOCAB_ONLY === 'true',
    rope_freq_base: parseFloat(process.env.LLAMA_ROPE_FREQ_BASE || '0.0'),
    rope_freq_scale: parseFloat(process.env.LLAMA_ROPE_FREQ_SCALE || '0.0'),
    yarn_ext_factor: parseFloat(process.env.LLAMA_YARN_EXT_FACTOR || '0.0'),
    yarn_attn_factor: parseFloat(process.env.LLAMA_YARN_ATTN_FACTOR || '0.0'),
    yarn_beta_fast: parseFloat(process.env.LLAMA_YARN_BETA_FAST || '0.0'),
    yarn_beta_slow: parseFloat(process.env.LLAMA_YARN_BETA_SLOW || '0.0'),
    system_prompt: process.env.LLAMA_SYSTEM_PROMPT || '',
    chat_template: process.env.LLAMA_CHAT_TEMPLATE || '',
    api_keys: process.env.LLAMA_API_KEYS || '',
    ssl_cert_file: process.env.LLAMA_SSL_CERT_FILE || '',
    ssl_key_file: process.env.LLAMA_SSL_KEY_FILE || '',
    cors_allow_origins: process.env.LLAMA_CORS_ALLOW_ORIGINS || '',
    log_format: process.env.LLAMA_LOG_FORMAT || 'text',
    log_level: process.env.LLAMA_LOG_LEVEL || 'info',
    log_colors: process.env.LLAMA_LOG_COLORS !== 'false',
    log_verbose: process.env.LLAMA_LOG_VERBOSE === 'true',
    cache_reuse: parseInt(process.env.LLAMA_CACHE_REUSE || '0', 10),
    cache_type_k: process.env.LLAMA_CACHE_TYPE_K || 'f16',
    cache_type_v: process.env.LLAMA_CACHE_TYPE_V || 'f16',
    ml_lock: process.env.LLAMA_ML_LOCK === 'true',
    no_kv_offload: process.env.LLAMA_NO_KV_OFFLOAD === 'true',
  };
}

export function createModelPaths(): { modelsDir: string; defaultModel: string | null } {
  return {
    modelsDir: process.env.LLAMA_MODELS_DIR || './models',
    defaultModel: process.env.LLAMA_DEFAULT_MODEL || null,
  };
}

export function createUpdateConfig(): UpdateConfig {
  return {
    METRICS_INTERVAL: parseInt(process.env.METRICS_INTERVAL || '10000', 10),
    MODELS_INTERVAL: parseInt(process.env.MODELS_INTERVAL || '30000', 10),
    LOGS_INTERVAL: parseInt(process.env.LOGS_INTERVAL || '15000', 10),
  };
}

export const BACKEND_CONFIG = createBackendConfig();
export const defaultLlamaConfig = createDefaultLlamaConfig();
export const MODEL_PATHS = createModelPaths();
export const UPDATE_CONFIG = createUpdateConfig();
