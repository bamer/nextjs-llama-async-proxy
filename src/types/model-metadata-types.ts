// Model Metadata Types

// Server/API configuration metadata
export interface ModelServerConfig {
  id?: number;
  host?: string;
  port?: number;
  api_prefix?: string;
  path?: string;
  webui?: string;
  webui_config_file?: string;
  no_webui?: number;
  embeddings?: number;
  reranking?: number;
  api_key?: string;
  api_key_file?: string;
  ssl_key_file?: string;
  ssl_cert_file?: string;
  timeout?: number;
  threads_http?: number;
  cache_reuse?: number;
  metrics_enabled?: number;
  props_enabled?: number;
  slots_enabled?: number;
  slot_save_path?: string;
  media_path?: string;
  models_dir?: string;
  models_preset?: string;
  models_max?: number;
  models_autoload?: number;
  jinja?: number;
  chat_template?: string;
  chat_template_file?: string;
  chat_template_kwargs?: string;
  prefill_assistant?: number;
  ctx_checkpoints?: number;
  verbose_prompt?: number;
  warmup?: number;
  spm_infill?: number;
  log_disable?: number;
  log_file?: string;
  log_colors?: string;
  log_verbose?: number;
  log_prefix?: number;
  log_timestamps?: number;
  created_at?: number;
  updated_at?: number;
}

// Model analysis and fit parameters metadata
export interface ModelFitParams {
  id?: number;
  model_id?: number;
  recommended_ctx_size?: number | null;
  recommended_gpu_layers?: number | null;
  recommended_tensor_split?: string | null;
  file_size_bytes?: number | null;
  quantization_type?: string | null;
  parameter_count?: number | null;
  architecture?: string | null;
  context_window?: number | null;
  fit_params_analyzed_at?: number | null;
  fit_params_success?: number | null;
  fit_params_error?: string | null;
  fit_params_raw_output?: string | null;
  projected_cpu_memory_mb?: number | null;
  projected_gpu_memory_mb?: number | null;
  created_at?: number;
  updated_at?: number;
}
