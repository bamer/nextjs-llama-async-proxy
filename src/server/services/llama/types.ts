export interface LlamaServerConfig {
  host: string;
  port: number;
  modelPath?: string;
  basePath?: string;
  serverPath?: string;
  serverArgs?: string[];
  ctx_size?: number;
  batch_size?: number;
  ubatch_size?: number;
  threads?: number;
  threads_batch?: number;
  gpu_layers?: number;
  main_gpu?: number;
  flash_attn?: "on" | "off" | "auto";
  n_predict?: number;
  temperature?: number;
  top_k?: number;
  top_p?: number;
  repeat_penalty?: number;
  seed?: number;
  verbose?: boolean;
  embedding?: boolean;
  cache_type_k?: string;
  cache_type_v?: string;
  penalize_nl?: boolean;
  ignore_eos?: boolean;
  mlock?: boolean;
  numa?: boolean;
  memory_mapped?: boolean;
  use_mmap?: boolean;
  grp_attn_n?: number;
  grp_attn_w?: number;
  neg_prompt_multiplier?: number;
  min_p?: number;
  xtc_probability?: number;
  xtc_threshold?: number;
  typical_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  dry_multiplier?: number;
  dry_base?: number;
  dry_allowed_length?: number;
  dry_penalty_last_n?: number;
  repeat_last_n?: number;
  rope_freq_base?: number;
  rope_freq_scale?: number;
  yarn_ext_factor?: number;
  yarn_attn_factor?: number;
  yarn_beta_fast?: number;
  yarn_beta_slow?: number;
  no_kv_offload?: boolean;
  ml_lock?: boolean;
  [key: string]: unknown;
}

export interface LlamaModel {
  id: string;
  name: string;
  size?: number; // Made optional - llama-server may not provide it
  type: string;
  modified_at: number;
  path: string;
  availableTemplates?: string[];
  template?: string;
}

export type LlamaServiceStatus =
  | "initial"
  | "starting"
  | "ready"
  | "error"
  | "crashed"
  | "stopping";

export interface LlamaServiceState {
  status: LlamaServiceStatus;
  models: LlamaModel[];
  lastError: string | null;
  retries: number;
  uptime: number;
  startedAt: Date | null;
}
