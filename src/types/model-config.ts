/**
 * Centralized type definitions for model configuration
 * Extracted from src/components/models/ModelConfigDialog.tsx
 */

export interface SamplingConfig {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  typical_p: number;
  repeat_penalty: number;
  repeat_last_n: number;
  frequency_penalty: number;
  presence_penalty: number;
  mirostat: number;
  mirostat_tau: number;
  mirostat_eta: number;
  seed: number;
  flash_attn: "auto" | "on" | "off";
}

export interface MemoryConfig {
  ctx_size: number;
  num_batch: number;
  cache_ram: number;
  memory_f16: boolean;
  memory_lock: boolean;
  mmap: boolean;
  mlock: boolean;
  numa: string;
  defrag_thold: number;
  cache_type_k: string;
  cache_type_v: string;
}

export interface GPUConfig {
  n_gpu_layers: number;
  n_gpu: number;
  tensor_split: string;
  main_gpu: number;
  mm_lock: boolean;
  list_devices: boolean;
  kv_offload: boolean;
  repack: boolean;
  no_host: boolean;
  split_mode: string;
  device: string;
}

export interface AdvancedConfig {
  rope_frequency: number;
  rope_scale: number;
  yarn_ext_factor: number;
  yarn_orig_ctx: number;
  yarn_attn_factor: number;
  yarn_beta_fast: number;
  yarn_beta_slow: number;
  num_thread: number;
  num_predict: number;
  swa_full: boolean;
  override_tensor: string;
  cpu_moe: boolean;
  n_cpu_moe: number;
  kv_unified: boolean;
  context_shift: boolean;
  rpc: string;
  offline: boolean;
  override_kv: string;
  op_offload: boolean;
  check_tensors: boolean;
}

export interface LoRAConfig {
  lora_adapter: string;
  lora_base: string;
  lora_scale: number;
  control_vectors: string;
}

export interface MultimodalConfig {
  image_data: string;
  clip_vision_cache: boolean;
  mmproj: string;
  mmproj_auto: boolean;
  mmproj_offload: boolean;
}

export type ConfigType = "sampling" | "memory" | "gpu" | "advanced" | "lora" | "multimodal";

export type AnyConfig =
  | SamplingConfig
  | MemoryConfig
  | GPUConfig
  | AdvancedConfig
  | LoRAConfig
  | MultimodalConfig;
