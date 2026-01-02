interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

// Validation rules for different fields
export const validationRules: Record<string, ValidationRule> = {
  temperature: { min: 0, max: 2, required: false },
  top_k: { min: 1, max: 100, required: false },
  top_p: { min: 0, max: 1, required: false },
  min_p: { min: 0, max: 0.5, required: false },
  top_nsigma: { min: 0, max: 3, required: false },
  xtc_probability: { min: 0, max: 1, required: false },
  xtc_threshold: { min: 0, max: 1, required: false },
  typical_p: { min: 0.1, max: 1, required: false },
  repeat_last_n: { min: 0, max: 2048, required: false },
  repeat_penalty: { min: 1, max: 2, required: false },
  presence_penalty: { min: 0, max: 2, required: false },
  frequency_penalty: { min: 0, max: 2, required: false },
  dry_multiplier: { min: 0, max: 5, required: false },
  dry_base: { min: 1, max: 3, required: false },
  dry_allowed_length: { min: 0, max: 10, required: false },
  dry_penalty_last_n: { min: 0, max: 512, required: false },
  dynatemp_range: { min: 0, max: 2, required: false },
  dynatemp_exponent: { min: 0.1, max: 2, required: false },
  mirostat: { min: 0, max: 2, required: false },
  mirostat_eta: { min: 0.001, max: 1, required: false },
  mirostat_tau: { min: 0, max: 10, required: false },
  seed: { min: -1, max: Number.MAX_SAFE_INTEGER, required: false },
  rope_scale: { min: 0, max: 10, required: false },
  rope_freq_base: { min: 0, max: 1000000, required: false },
  rope_freq_scale: { min: 0, max: 10, required: false },
  yarn_orig_ctx: { min: 0, max: 32768, required: false },
  yarn_ext_factor: { min: -1, max: 16, required: false },
  yarn_attn_factor: { min: 0, max: 4, required: false },
  yarn_beta_slow: { min: 0, max: 10, required: false },
  yarn_beta_fast: { min: 0, max: 100, required: false },
  cache_ram: { min: 0, max: 128, required: false },
  defrag_thold: { min: -1, max: 1, required: false },
  gpu_layers: { min: -1, max: 1000, required: false },
  main_gpu: { min: 0, max: 16, required: false },
  kv_offload: { min: 0, max: 1, required: false },
  n_cpu_moe: { min: 0, max: 64, required: false },
  n_cpu_moe_draft: { min: 0, max: 32, required: false },
  n_gpu_layers_draft: { min: -1, max: 1000, required: false },
  fit_target: { min: 0, max: 100, required: false },
  fit_ctx: { min: 0, max: 32768, required: false },
  sleep_idle_seconds: { min: 0, max: 3600, required: false },
  reasoning_budget: { min: 0, max: 8192, required: false },
  ctx_size_draft: { min: 512, max: 16384, required: false },
  draft_max: { min: 1, max: 64, required: false },
  draft_min: { min: 1, max: 32, required: false },
  draft_p_min: { min: 0, max: 0.5, required: false },
  image_min_tokens: { min: 0, max: 8192, required: false },
  image_max_tokens: { min: 0, max: 8192, required: false },
};