import * as fs from "fs";
import * as path from "path";
import { ModelMetadata } from "./fit-params-service";
import type { FitParamsResult } from "./fit-params-service";

/**
 * Parse model filename to extract metadata
 */
export function parseModelFilename(filename: string): ModelMetadata {
  const basename = path.basename(filename);
  const fileSizeBytes = fs.existsSync(filename) ? fs.statSync(filename).size : 0;

  let quantization_type: string | null = null;
  let parameter_count: number | null = null;
  let architecture: string | null = null;
  let context_window: number | null = null;

  // Extract quantization type (Q4_K_M, Q5_K_S, etc.)
  const quantMatch = basename.match(/(Q[0-9]+(?:_[KMS]+)?)/i);
  if (quantMatch) {
    quantization_type = quantMatch[1].toUpperCase();
  }

  // Extract parameter count (7B, 13B, 70B, etc.)
  const paramMatch = basename.match(/(\d+)B/i);
  if (paramMatch) {
    parameter_count = parseInt(paramMatch[1], 10);
  }

  // Extract architecture (Llama, Mistral, Gemma, etc.)
  const archPatterns = [
    /llama[-_\s]?(\d+)/i,
    /mistral[-_\s]?(\d+)?/i,
    /gemma[-_\s]?(\d+)?/i,
    /phi[-_\s]?(\d+)?/i,
    /qwen[-_\s]?(\d+)?/i,
  ];

  for (const pattern of archPatterns) {
    const match = basename.match(pattern);
    if (match) {
      architecture = match[0].split(/[-_\s]/)[0].toLowerCase();
      break;
    }
  }

  // Extract context window from filename
  const ctxMatch = basename.match(/(\d+)k/i);
  if (ctxMatch) {
    context_window = parseInt(ctxMatch[1], 10) * 1024;
  }

  return {
    file_size_bytes: fileSizeBytes,
    quantization_type,
    parameter_count,
    architecture,
    context_window,
  };
}

/**
 * Parse llama-fit-params output to extract recommendations
 */
export function parseFitParamsOutput(output: string): Omit<FitParamsResult, "metadata"> {
  const result: Omit<FitParamsResult, "metadata"> = {
    recommended_ctx_size: null,
    recommended_gpu_layers: null,
    recommended_tensor_split: null,
    projected_cpu_memory_mb: null,
    projected_gpu_memory_mb: null,
    success: true,
    error: null,
    raw_output: output,
  };

  const lines = output.split("\n");

  for (const line of lines) {
    // Extract recommended context size
    const ctxMatch = line.match(/-c\s+(\d+)/);
    if (ctxMatch) {
      result.recommended_ctx_size = parseInt(ctxMatch[1], 10);
    }

    // Extract recommended GPU layers
    const gpuMatch = line.match(/-ngl\s+(\d+)/);
    if (gpuMatch) {
      result.recommended_gpu_layers = parseInt(gpuMatch[1], 10);
    }

    // Extract tensor split
    const tsMatch = line.match(/-ts\s+([\d,.]+)/);
    if (tsMatch) {
      result.recommended_tensor_split = tsMatch[1];
    }

    // Extract memory usage
    const cpuMemMatch = line.match(/cpu.*?memory.*?(\d+(?:\.\d+)?)\s*(?:GB|MB)/i);
    if (cpuMemMatch) {
      const value = parseFloat(cpuMemMatch[1]);
      result.projected_cpu_memory_mb = line.includes("GB") ? value * 1024 : value;
    }

    const gpuMemMatch = line.match(/gpu.*?memory.*?(\d+(?:\.\d+)?)\s*(?:GB|MB)/i);
    if (gpuMemMatch) {
      const value = parseFloat(gpuMemMatch[1]);
      result.projected_gpu_memory_mb = line.includes("GB") ? value * 1024 : value;
    }
  }

  return result;
}
