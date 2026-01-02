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
