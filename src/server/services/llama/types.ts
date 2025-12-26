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
  [key: string]: any;
}

export interface LlamaModel {
  id: string;
  name: string;
  size: number;
  type: string;
  modified_at: number;
  path?: string;
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
