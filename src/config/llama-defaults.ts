// Default llama-server configuration constants
export const DEFAULT_LLAMA_SERVER_CONFIG = Object.freeze({
  // Server binding
  host: "127.0.0.1",
  port: 8080,
  timeout: 30000,

  // Basic options
  ctx_size: 4096,
  batch_size: 2048,
  ubatch_size: 512,
  threads: -1,
  threads_batch: -1,
  n_predict: -1,
  seed: -1,

  // GPU options
  gpu_layers: -1,
  n_cpu_moe: 0,
  cpu_moe: false,
  main_gpu: 0,
  tensor_split: "",
  split_mode: "layer",
  no_mmap: false,
  flash_attn: "auto",

  // Sampling parameters
  temperature: 0.7,
  top_k: 40,
  top_p: 0.9,
  min_p: 0.0,
  xtc_probability: 0.0,
  xtc_threshold: 0.1,
  typical_p: 1.0,
  repeat_last_n: 64,
  repeat_penalty: 1.0,
  presence_penalty: 0.0,
  frequency_penalty: 0.0,
  dry_multiplier: 0.0,
  dry_base: 1.75,
  dry_allowed_length: 2,
  dry_penalty_last_n: 20,
  dry_sequence_breaker: '["\\n", ":", "\"", "*"]',

  // Token limits
  max_tokens: 100,
  max_seq_len: 0,

  // Memory options
  embedding: false,
  memory_f16: false,
  memory_f32: false,
  memory_auto: true,
  vocab_only: false,

  // RoPE scaling
  rope_freq_base: 0.0,
  rope_freq_scale: 0.0,
  yarn_ext_factor: 0.0,
  yarn_attn_factor: 0.0,
  yarn_beta_fast: 0.0,
  yarn_beta_slow: 0.0,

  // Security & API
  api_keys: "",
  ssl_cert_file: "",
  ssl_key_file: "",
  cors_allow_origins: "",

  // Prompts & format
  system_prompt: "",
  chat_template: "",

  // Logging
  log_format: "text",
  log_level: "info",
  log_colors: true,
  log_verbose: false,

  // Cache options
  cache_reuse: 0,
  cache_type_k: "f16",
  cache_type_v: "f16",
  ml_lock: false,
  no_kv_offload: false,

  // Additional options from llama-server help
  n_ctx_train: 0,
  n_embd_head: 0,
  n_embd_head_key: 0,
  n_warp: 0,
  n_expert: 0,
  n_expert_used: 0,
  neg_prompt_multiplier: 1.0,
  penalize_nl: false,
  ignore_eos: false,
  disable_log_all: false,
  enable_log_all: false,
  slot_save_path: "",
  memory_mapped: false,
  use_mmap: true,
  mlock: false,
  numa: false,
  numa_poll_split: false,
  grp_attn_n: 1,
  grp_attn_w: 512,
});
