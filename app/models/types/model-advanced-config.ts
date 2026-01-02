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
