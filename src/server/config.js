// src/server/config.js
// Fonction pour créer la configuration (permet de recharger après dotenv)
export function createBackendConfig() {
  return {
    LLAMA_SERVER: {
      baseURL: process.env.LLAMA_SERVER_BASE_URL || `http://${process.env.LLAMA_SERVER_HOST || 'localhost'}:${process.env.LLAMA_SERVER_PORT || '8080'}`,
      timeout: parseInt(process.env.LLAMA_SERVER_TIMEOUT || '30000'),
      port: parseInt(process.env.LLAMA_SERVER_PORT || '8080'),
      host: process.env.LLAMA_SERVER_HOST || 'localhost',
    },
  };
}

export function createDefaultLlamaConfig() {
  return {
    // Server options
    port: parseInt(process.env.LLAMA_SERVER_PORT || '8080'),
    host: process.env.LLAMA_SERVER_HOST || 'localhost',
    timeout: parseInt(process.env.LLAMA_SERVER_TIMEOUT || '30000'),

    // Model options
    model: process.env.LLAMA_MODEL || '',

    // Context and memory
    context_size: parseInt(process.env.LLAMA_CONTEXT_SIZE || '2048'),
    n_ctx: parseInt(process.env.LLAMA_N_CTX || '2048'), // alias for context_size
    n_batch: parseInt(process.env.LLAMA_N_BATCH || '512'),
    n_ubatch: parseInt(process.env.LLAMA_N_UBATCH || '512'),

    // GPU options
    n_gpu_layers: parseInt(process.env.LLAMA_GPU_LAYERS || '0'),
    main_gpu: parseInt(process.env.LLAMA_MAIN_GPU || '0'),
    tensor_split: process.env.LLAMA_TENSOR_SPLIT || '',
    n_gqa: parseInt(process.env.LLAMA_N_GQA || '0'),

    // CPU options
    n_threads: parseInt(process.env.LLAMA_THREADS || '-1'), // -1 = auto
    n_threads_batch: parseInt(process.env.LLAMA_THREADS_BATCH || '-1'), // -1 = auto

    // Sampling options
    temperature: parseFloat(process.env.LLAMA_TEMPERATURE || '0.7'),
    top_k: parseInt(process.env.LLAMA_TOP_K || '40'),
    top_p: parseFloat(process.env.LLAMA_TOP_P || '0.9'),
    min_p: parseFloat(process.env.LLAMA_MIN_P || '0.0'),
    xtc_probability: parseFloat(process.env.LLAMA_XTC_PROBABILITY || '0.0'),
    xtc_threshold: parseFloat(process.env.LLAMA_XTC_THRESHOLD || '0.1'),
    typical_p: parseFloat(process.env.LLAMA_TYPICAL_P || '1.0'),
    repeat_last_n: parseInt(process.env.LLAMA_REPEAT_LAST_N || '64'),
    repeat_penalty: parseFloat(process.env.LLAMA_REPEAT_PENALTY || '1.0'),
    presence_penalty: parseFloat(process.env.LLAMA_PRESENCE_PENALTY || '0.0'),
    frequency_penalty: parseFloat(process.env.LLAMA_FREQUENCY_PENALTY || '0.0'),
    dry_multiplier: parseFloat(process.env.LLAMA_DRY_MULTIPLIER || '0.0'),
    dry_base: parseFloat(process.env.LLAMA_DRY_BASE || '1.75'),
    dry_allowed_length: parseInt(process.env.LLAMA_DRY_ALLOWED_LENGTH || '2'),
    dry_penalty_last_n: parseInt(process.env.LLAMA_DRY_PENALTY_LAST_N || '20'),
    dry_sequence_breaker: process.env.LLAMA_DRY_SEQUENCE_BREAKER || '["\\n", ":", "\"", "*"]',

    // Generation options
    max_tokens: parseInt(process.env.LLAMA_MAX_TOKENS || '100'),
    max_seq_len: parseInt(process.env.LLAMA_MAX_SEQ_LEN || '0'),
    seed: parseInt(process.env.LLAMA_SEED || '-1'), // -1 = random

    // Model loading options
    embedding: process.env.LLAMA_EMBEDDING === 'true',
    memory_f16: process.env.LLAMA_MEMORY_F16 === 'true',
    memory_f32: process.env.LLAMA_MEMORY_F32 === 'true',
    memory_auto: process.env.LLAMA_MEMORY_AUTO !== 'false', // default true
    vocab_only: process.env.LLAMA_VOCAB_ONLY === 'true',
    rope_freq_base: parseFloat(process.env.LLAMA_ROPE_FREQ_BASE || '0.0'),
    rope_freq_scale: parseFloat(process.env.LLAMA_ROPE_FREQ_SCALE || '0.0'),
    yarn_ext_factor: parseFloat(process.env.LLAMA_YARN_EXT_FACTOR || '0.0'),
    yarn_attn_factor: parseFloat(process.env.LLAMA_YARN_ATTN_FACTOR || '0.0'),
    yarn_beta_fast: parseFloat(process.env.LLAMA_YARN_BETA_FAST || '0.0'),
    yarn_beta_slow: parseFloat(process.env.LLAMA_YARN_BETA_SLOW || '0.0'),

    // Server options
    host: process.env.LLAMA_SERVER_HOST || '127.0.0.1',
    port: parseInt(process.env.LLAMA_SERVER_PORT || '8080'),
    api_keys: process.env.LLAMA_API_KEYS || '',
    ssl_cert_file: process.env.LLAMA_SSL_CERT_FILE || '',
    ssl_key_file: process.env.LLAMA_SSL_KEY_FILE || '',
    cors_allow_origins: process.env.LLAMA_CORS_ALLOW_ORIGINS || '',
    system_prompt: process.env.LLAMA_SYSTEM_PROMPT || '',
    chat_template: process.env.LLAMA_CHAT_TEMPLATE || '',

    // Logging options
    log_format: process.env.LLAMA_LOG_FORMAT || 'text',
    log_level: process.env.LLAMA_LOG_LEVEL || 'info',
    log_colors: process.env.LLAMA_LOG_COLORS !== 'false', // default true
    log_verbose: process.env.LLAMA_LOG_VERBOSE === 'true',

    // Other options
    cache_reuse: parseInt(process.env.LLAMA_CACHE_REUSE || '0'),
    cache_type_k: process.env.LLAMA_CACHE_TYPE_K || 'f16',
    cache_type_v: process.env.LLAMA_CACHE_TYPE_V || 'f16',
    ml_lock: process.env.LLAMA_ML_LOCK === 'true',
    no_kv_offload: process.env.LLAMA_NO_KV_OFFLOAD === 'true'
  };
}

export function createModelPaths() {
  return {
    modelsDir: process.env.LLAMA_MODELS_DIR || './models',
    defaultModel: process.env.LLAMA_DEFAULT_MODEL || null
  };
}

export function createUpdateConfig() {
  return {
    METRICS_INTERVAL: parseInt(process.env.METRICS_INTERVAL || '10000'),  // 10 secondes
    MODELS_INTERVAL: parseInt(process.env.MODELS_INTERVAL || '30000'),   // 30 secondes
    LOGS_INTERVAL: parseInt(process.env.LOGS_INTERVAL || '15000'),     // 15 secondes
  };
}

// Exports par défaut (pour compatibilité)
export const BACKEND_CONFIG = createBackendConfig();
export const defaultLlamaConfig = createDefaultLlamaConfig();
export const MODEL_PATHS = createModelPaths();
export const UPDATE_CONFIG = createUpdateConfig();