import type { ModelSamplingConfig } from "../lib/database/models/ModelSamplingConfig.types";
import type {
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
} from "../lib/database/models/ModelMemoryConfig.types";

/**
 * Normalizes model sampling config with default values
 */
export function normalizeModelSamplingConfig(
  config: Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at">
): Omit<ModelSamplingConfig, "id" | "model_id" | "created_at" | "updated_at"> {
  const result = {
    ...config,
    temperature: config.temperature ?? 0.8,
    top_k: config.top_k ?? 40,
    top_p: config.top_p ?? 0.9,
    min_p: config.min_p ?? 0.1,
    top_nsigma: config.top_nsigma ?? -1.0,
    xtc_probability: config.xtc_probability ?? 0.0,
    xtc_threshold: config.xtc_threshold ?? 0.1,
    typical_p: config.typical_p ?? 1.0,
    repeat_last_n: config.repeat_last_n ?? 64,
    repeat_penalty: config.repeat_penalty ?? 1.0,
    presence_penalty: config.presence_penalty ?? 0.0,
    frequency_penalty: config.frequency_penalty ?? 0.0,
    dry_multiplier: config.dry_multiplier ?? 0.0,
    dry_base: config.dry_base ?? 1.75,
    dry_allowed_length: config.dry_allowed_length ?? 2,
    dry_penalty_last_n: config.dry_penalty_last_n ?? -1,
    dynatemp_range: config.dynatemp_range ?? 0.0,
    dynatemp_exponent: config.dynatemp_exponent ?? 1.0,
    mirostat: config.mirostat ?? 0,
    mirostat_eta: config.mirostat_eta ?? 0.1,
    mirostat_tau: config.mirostat_tau ?? 5.0,
    sampler_seq: config.sampler_seq ?? "edskypmxt",
    seed: config.seed ?? -1,
    ignore_eos: config.ignore_eos ?? 1,
    escape: config.escape ?? true,
    rope_scale: config.rope_scale ?? 0.0,
    rope_freq_base: config.rope_freq_base ?? 0.0,
    rope_freq_scale: config.rope_freq_scale ?? 0.0,
    yarn_orig_ctx: config.yarn_orig_ctx ?? 0,
    yarn_ext_factor: config.yarn_ext_factor ?? -1.0,
    yarn_attn_factor: config.yarn_attn_factor ?? -1.0,
    yarn_beta_slow: config.yarn_beta_slow ?? -1.0,
    yarn_beta_fast: config.yarn_beta_fast ?? -1.0,
    flash_attn: config.flash_attn ?? "auto",
  };
  return result as typeof result;
}

/**
 * Normalizes model memory config with default values
 */
export function normalizeModelMemoryConfig(
  config: Omit<ModelMemoryConfig, "id" | "model_id" | "created_at" | "updated_at">
): Omit<ModelMemoryConfig, "id" | "model_id" | "created_at" | "updated_at"> {
  const result = {
    ...config,
    cache_ram: config.cache_ram ?? -1,
    mmap: config.mmap ?? 0,
    mlock: config.mlock ?? 0,
  };
  return result as typeof result;
}

/**
 * Normalizes model GPU config with default values
 */
export function normalizeModelGpuConfig(
  config: Omit<ModelGpuConfig, "id" | "model_id" | "created_at" | "updated_at">
): Omit<ModelGpuConfig, "id" | "model_id" | "created_at" | "updated_at"> {
  const result = {
    ...config,
    list_devices: config.list_devices ?? 0,
    gpu_layers: config.gpu_layers ?? -1,
    kv_offload: config.kv_offload ?? 0,
    repack: config.repack ?? 0,
    no_host: config.no_host ?? 0,
  };
  return result as typeof result;
}

/**
 * Normalizes model advanced config with default values
 */
export function normalizeModelAdvancedConfig(
  config: Omit<ModelAdvancedConfig, "id" | "model_id" | "created_at" | "updated_at">
): Omit<ModelAdvancedConfig, "id" | "model_id" | "created_at" | "updated_at"> {
  const result = {
    ...config,
    swa_full: config.swa_full ?? 0,
    cpu_moe: config.cpu_moe ?? 0,
    n_cpu_moe: config.n_cpu_moe ?? 0,
    kv_unified: config.kv_unified ?? 0,
    context_shift: config.context_shift ?? 0,
    offline: config.offline ?? 0,
    op_offload: config.op_offload ?? 0,
    fit_target: config.fit_target ?? 1024,
    fit_ctx: config.fit_ctx ?? 4096,
    check_tensors: config.check_tensors ?? 0,
    sleep_idle_seconds: config.sleep_idle_seconds ?? -1,
    reasoning_budget: config.reasoning_budget ?? -1,
  };
  return result as typeof result;
}

/**
 * Normalizes model LoRA config with default values
 */
export function normalizeModelLoraConfig(
  config: Omit<ModelLoraConfig, "id" | "model_id" | "created_at" | "updated_at">
): Omit<ModelLoraConfig, "id" | "model_id" | "created_at" | "updated_at"> {
  const result = {
    ...config,
    draft_max: config.draft_max ?? 16,
    draft_min: config.draft_min ?? 0,
    draft_p_min: config.draft_p_min ?? 0.8,
    cpu_moe_draft: config.cpu_moe_draft ?? 0,
    n_cpu_moe_draft: config.n_cpu_moe_draft ?? 0,
  };
  return result as typeof result;
}

/**
 * Normalizes model multimodal config with default values
 */
export function normalizeModelMultimodalConfig(
  config: Omit<ModelMultimodalConfig, "id" | "model_id" | "created_at" | "updated_at">
): Omit<ModelMultimodalConfig, "id" | "model_id" | "created_at" | "updated_at"> {
  const result = {
    ...config,
    mmproj_auto: config.mmproj_auto ?? 0,
    mmproj_offload: config.mmproj_offload ?? 0,
  };
  return result as typeof result;
}
