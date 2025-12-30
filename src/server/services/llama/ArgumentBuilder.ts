import type { LlamaServerConfig } from "./types";

/**
 * Build command line arguments for llama-server from config
 */
export function buildArgs(config: LlamaServerConfig): string[] {
  const args: string[] = [];

  // Model and path configuration
  if (config.modelPath) {
    args.push("-m", config.modelPath);
  } else if (config.basePath) {
    args.push("--models-dir", config.basePath);
  }

  // Server binding
  args.push("--host", config.host);
  args.push("--port", String(config.port));

  // Basic options
  addArgIfDefined(args, "-c", config.ctx_size);
  addArgIfDefined(args, "-b", config.batch_size);
  addArgIfDefined(args, "--ubatch-size", config.ubatch_size);

  // Threading
  addArgIfDefined(args, "-t", config.threads, -1);
  addArgIfDefined(args, "--threads-batch", config.threads_batch, -1);

  // GPU options
  addArgIfDefined(args, "-ngl", config.gpu_layers, -1);
  addArgIfDefined(args, "-mg", config.main_gpu, 0);

  // Flash attention
  if (config.flash_attn === "on") {
    args.push("-fa");
  } else if (config.flash_attn === "off") {
    args.push("--no-flash-attn");
  }

  // Sampling defaults
  addArgIfDefined(args, "--temp", config.temperature);
  addArgIfDefined(args, "--top-k", config.top_k);
  addArgIfDefined(args, "--top-p", config.top_p);
  addArgIfDefined(args, "--repeat-penalty", config.repeat_penalty);

  // Prediction
  addArgIfDefined(args, "-n", config.n_predict, -1);

  // Seed
  addArgIfDefined(args, "--seed", config.seed, -1);

  // Embedding mode
  if (config.embedding) {
    args.push("--embedding");
  }

  // Cache types
  if (config.cache_type_k) {
    args.push("--cache-type-k", config.cache_type_k);
  }
  if (config.cache_type_v) {
    args.push("--cache-type-v", config.cache_type_v);
  }

  // Verbose logging
  if (config.verbose) {
    args.push("--verbose");
  }

  // Additional boolean options
  addFlagIfTrue(args, "--penalize-nl", config.penalize_nl);
  addFlagIfTrue(args, "--ignore-eos", config.ignore_eos);
  addFlagIfTrue(args, "--mlock", config.mlock);
  addFlagIfTrue(args, "--numa", config.numa);
  addFlagIfTrue(args, "--memory-mapped", config.memory_mapped);
  addFlagIfFalse(args, "--no-mmap", config.use_mmap);
  addFlagIfTrue(args, "--no-kv-offload", config.no_kv_offload);
  addFlagIfTrue(args, "--ml-lock", config.ml_lock);

  // Advanced options with conditions
  addArgIfNotDefault(args, "--grp-attn-n", config.grp_attn_n, 1);
  addArgIfNotDefault(args, "--grp-attn-w", config.grp_attn_w, 512);
  addArgIfNotDefault(args, "--neg-prompt-multiplier", config.neg_prompt_multiplier, 1.0);
  addArgIfNotDefault(args, "--min-p", config.min_p, 0);
  addArgIfNotDefault(args, "--xtc-probability", config.xtc_probability, 0);
  addArgIfNotDefault(args, "--xtc-threshold", config.xtc_threshold, 0.1);
  addArgIfNotDefault(args, "--typical-p", config.typical_p, 1.0);
  addArgIfNotDefault(args, "--presence-penalty", config.presence_penalty, 0);
  addArgIfNotDefault(args, "--frequency-penalty", config.frequency_penalty, 0);
  addArgIfNotDefault(args, "--dry-multiplier", config.dry_multiplier, 0);
  addArgIfNotDefault(args, "--dry-base", config.dry_base, 1.75);
  addArgIfNotDefault(args, "--dry-allowed-length", config.dry_allowed_length, 2);
  addArgIfNotDefault(args, "--dry-penalty-last-n", config.dry_penalty_last_n, 20);
  addArgIfNotDefault(args, "--repeat-last-n", config.repeat_last_n, 64);
  addArgIfNotDefault(args, "--rope-freq-base", config.rope_freq_base, 0);
  addArgIfNotDefault(args, "--rope-freq-scale", config.rope_freq_scale, 0);
  addArgIfNotDefault(args, "--yarn-ext-factor", config.yarn_ext_factor, 0);
  addArgIfNotDefault(args, "--yarn-attn-factor", config.yarn_attn_factor, 0);
  addArgIfNotDefault(args, "--yarn-beta-fast", config.yarn_beta_fast, 0);
  addArgIfNotDefault(args, "--yarn-beta-slow", config.yarn_beta_slow, 0);

  // Custom server arguments
  if (config.serverArgs) {
    args.push(...config.serverArgs);
  }

  return args;
}

/**
 * Add argument if value is defined
 */
function addArgIfDefined(
  args: string[],
  flag: string,
  value?: number | string,
  excludeValue?: number
): void {
  if (value !== undefined && value !== excludeValue) {
    args.push(flag, String(value));
  }
}

/**
 * Add flag if value is true
 */
function addFlagIfTrue(args: string[], flag: string, value?: boolean): void {
  if (value) {
    args.push(flag);
  }
}

/**
 * Add flag if value is false
 */
function addFlagIfFalse(args: string[], flag: string, value?: boolean): void {
  if (value === false) {
    args.push(flag);
  }
}

/**
 * Add argument if value is not equal to default
 */
function addArgIfNotDefault(
  args: string[],
  flag: string,
  value?: number,
  defaultValue: number = 0
): void {
  if (value !== undefined && value !== defaultValue) {
    args.push(flag, String(value));
  }
}
