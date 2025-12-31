export interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  options?: string[];
  defaultValue: unknown;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  validation?: any;
  unit?: string;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
}

export interface ModelConfig {
  id?: number;
  name: string;
  type: "llama" | "gpt" | "mistrall" | "custom";
  status: "running" | "stopped" | "loading" | "error";
  model_path?: string;
  model_url?: string;
  docker_repo?: string;
  hf_repo?: string;
  hf_repo_draft?: string;
  hf_file?: string;
  hf_file_v?: string;
  hf_token?: string;
  ctx_size?: number;
  predict?: number;
  batch_size?: number;
  ubatch_size?: number;
  n_parallel?: number;
  cont_batching?: number;
  threads?: number;
  threads_batch?: number;
  cpu_mask?: string;
  cpu_range?: string;
  cpu_strict?: number;
  cpu_mask_batch?: string;
  cpu_range_batch?: string;
  cpu_strict_batch?: number;
  priority?: number;
  priority_batch?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelSamplingConfig {
  id?: number;
  model_id?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  min_p?: number;
  top_nsigma?: number;
  xtc_probability?: number;
  xtc_threshold?: number;
  typical_p?: number;
  repeat_last_n?: number;
  repeat_penalty?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  dry_multiplier?: number;
  dry_base?: number;
  dry_allowed_length?: number;
  dry_penalty_last_n?: number;
  dry_sequence_breaker?: string;
  dynatemp_range?: number;
  dynatemp_exponent?: number;
  mirostat?: number;
  mirostat_eta?: number;
  mirostat_tau?: number;
  samplers?: string;
  sampler_seq?: string;
  seed?: number;
  grammar?: string;
  grammar_file?: string;
  json_schema?: string;
  json_schema_file?: string;
  ignore_eos?: number;
  escape?: boolean;
  rope_scaling_type?: string;
  rope_scale?: number;
  rope_freq_base?: number;
  rope_freq_scale?: number;
  yarn_orig_ctx?: number;
  yarn_ext_factor?: number;
  yarn_attn_factor?: number;
  yarn_beta_slow?: number;
  yarn_beta_fast?: number;
  flash_attn?: string;
  logit_bias?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ModelMemoryConfig {
  id?: number;
  model_id?: number;
  cache_ram?: number;
  cache_type_k?: string;
  cache_type_v?: string;
  mmap?: number;
  mlock?: number;
  numa?: string;
  defrag_thold?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelGpuConfig {
  id?: number;
  model_id?: number;
  device?: string;
  list_devices?: number;
  gpu_layers?: number;
  split_mode?: string;
  tensor_split?: string;
  main_gpu?: number;
  kv_offload?: number;
  repack?: number;
  no_host?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelAdvancedConfig {
  id?: number;
  model_id?: number;
  swa_full?: number;
  override_tensor?: string;
  cpu_moe?: number;
  n_cpu_moe?: number;
  kv_unified?: number;
  pooling?: string;
  context_shift?: number;
  rpc?: string;
  offline?: number;
  override_kv?: string;
  op_offload?: number;
  fit?: string;
  fit_target?: number;
  fit_ctx?: number;
  check_tensors?: number;
  sleep_idle_seconds?: number;
  polling?: string;
  polling_batch?: string;
  reasoning_format?: string;
  reasoning_budget?: number;
  custom_params?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ModelLoraConfig {
  id?: number;
  model_id?: number;
  lora?: string;
  lora_scaled?: string;
  control_vector?: string;
  control_vector_scaled?: string;
  control_vector_layer_range?: string;
  model_draft?: string;
  model_url_draft?: string;
  ctx_size_draft?: number;
  threads_draft?: number;
  threads_batch_draft?: number;
  draft_max?: number;
  draft_min?: number;
  draft_p_min?: number;
  cache_type_k_draft?: string;
  cache_type_v_draft?: string;
  cpu_moe_draft?: number;
  n_cpu_moe_draft?: number;
  n_gpu_layers_draft?: number;
  device_draft?: string;
  spec_replace?: string;
  created_at?: number;
  updated_at?: number;
}

export interface ModelMultimodalConfig {
  id?: number;
  model_id?: number;
  mmproj?: string;
  mmproj_url?: string;
  mmproj_auto?: number;
  mmproj_offload?: number;
  image_min_tokens?: number;
  image_max_tokens?: number;
  created_at?: number;
  updated_at?: number;
}

export interface ModelData extends ModelConfig {
  parameters?: {
    sampling?: ModelSamplingConfig;
    memory?: ModelMemoryConfig;
    gpu?: ModelGpuConfig;
    advanced?: ModelAdvancedConfig;
    lora?: ModelLoraConfig;
    multimodal?: ModelMultimodalConfig;
    fit_params_available?: boolean;
    file_size_bytes?: number;
    quantization_type?: string;
    parameter_count?: string;
    ctx_size?: number;
    batch_size?: number;
    threads?: number;
    model_path?: string;
    model_url?: string;
  };
  sampling?: ModelSamplingConfig;
  memory?: ModelMemoryConfig;
  gpu?: ModelGpuConfig;
  advanced?: ModelAdvancedConfig;
  lora?: ModelLoraConfig;
  multimodal?: ModelMultimodalConfig;
  _configsLoading?: Set<string>;
}
