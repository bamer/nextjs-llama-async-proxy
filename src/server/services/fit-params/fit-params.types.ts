// src/server/services/fit-params/fit-params.types.ts

/**
 * Model metadata extracted from filename and file stats
 */
export interface ModelMetadata {
  file_size_bytes: number;
  quantization_type: string | null;
  parameter_count: number | null;
  architecture: string | null;
  context_window: number | null;
}

/**
 * Result from fit-params analysis
 */
export interface FitParamsResult {
  recommended_ctx_size: number | null;
  recommended_gpu_layers: number | null;
  recommended_tensor_split: string | null;
  projected_cpu_memory_mb: number | null;
  projected_gpu_memory_mb: number | null;
  metadata: ModelMetadata;
  success: boolean;
  error: string | null;
  raw_output: string | null;
}
