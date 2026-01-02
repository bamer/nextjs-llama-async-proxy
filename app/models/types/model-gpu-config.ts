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
