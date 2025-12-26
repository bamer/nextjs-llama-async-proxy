import { LlamaServerConfig } from "./types";

export class ArgumentBuilder {
  static build(config: LlamaServerConfig): string[] {
    const args: string[] = [];

    // Model configuration
    if (config.modelPath) {
      args.push("-m", config.modelPath);
    } else if (config.basePath) {
      args.push("--models-dir", config.basePath);
    }

    // Server binding
    args.push("--host", config.host);
    args.push("--port", String(config.port));

    // Basic options
    if (config.ctx_size !== undefined) args.push("-c", String(config.ctx_size));
    if (config.batch_size !== undefined) args.push("-b", String(config.batch_size));
    if (config.ubatch_size !== undefined)
      args.push("--ubatch-size", String(config.ubatch_size));

    // Threading
    if (config.threads !== undefined && config.threads !== -1)
      args.push("-t", String(config.threads));
    if (config.threads_batch !== undefined && config.threads_batch !== -1)
      args.push("--threads-batch", String(config.threads_batch));

    // GPU options
    if (config.gpu_layers !== undefined && config.gpu_layers !== -1)
      args.push("-ngl", String(config.gpu_layers));
    if (config.main_gpu !== undefined && config.main_gpu !== 0)
      args.push("-mg", String(config.main_gpu));

    // Flash attention
    if (config.flash_attn === "on") {
      args.push("-fa");
    } else if (config.flash_attn === "off") {
      args.push("--no-flash-attn");
    }

    // Sampling
    if (config.temperature !== undefined)
      args.push("--temp", String(config.temperature));
    if (config.top_k !== undefined) args.push("--top-k", String(config.top_k));
    if (config.top_p !== undefined) args.push("--top-p", String(config.top_p));
    if (config.repeat_penalty !== undefined)
      args.push("--repeat-penalty", String(config.repeat_penalty));

    // Prediction
    if (config.n_predict !== undefined && config.n_predict !== -1)
      args.push("-n", String(config.n_predict));

    // Seed
    if (config.seed !== undefined && config.seed !== -1)
      args.push("--seed", String(config.seed));

    // Embedding
    if (config.embedding) args.push("--embedding");

    // Cache types
    if (config.cache_type_k) args.push("--cache-type-k", config.cache_type_k);
    if (config.cache_type_v) args.push("--cache-type-v", config.cache_type_v);

    // Verbose
    if (config.verbose) args.push("--verbose");

    // Additional options
    if (config.penalize_nl) args.push("--penalize-nl");
    if (config.ignore_eos) args.push("--ignore-eos");
    if (config.mlock) args.push("--mlock");
    if (config.numa) args.push("--numa");
    if (config.memory_mapped) args.push("--memory-mapped");
    if (config.use_mmap === false) args.push("--no-mmap");

    // Custom server arguments
    if (config.serverArgs) args.push(...config.serverArgs);

    return args;
  }
}
