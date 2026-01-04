/**
 * Shared test utilities for ArgumentBuilder tests
 */

import { ArgumentBuilder } from "@/server/services/llama/argumentBuilder";
import { LlamaServerConfig } from "@/server/services/llama/types";

export function createMinimalConfig(): LlamaServerConfig {
  return {
    host: "localhost",
    port: 8080,
  };
}

export function createFullConfig(): LlamaServerConfig {
  return {
    host: "localhost",
    port: 8080,
    modelPath: "/path/to/model.gguf",
    ctx_size: 2048,
    batch_size: 512,
    ubatch_size: 512,
    threads: 4,
    threads_batch: 4,
    gpu_layers: 20,
    main_gpu: 1,
    flash_attn: "on",
    temperature: 0.7,
    top_k: 40,
    top_p: 0.9,
    repeat_penalty: 1.1,
    n_predict: 512,
    seed: 42,
    verbose: true,
    embedding: false,
    serverArgs: ["--custom"],
  };
}

export function buildArgs(config: LlamaServerConfig) {
  return ArgumentBuilder.build(config);
}
