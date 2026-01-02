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
