// src/server/services/fit-params/fit-params-output.parser.ts

import type { FitParamsResult } from "./fit-params.types";

/**
 * Parse llama-fit-params output to extract recommendations
 * @param output - Raw output string from llama-fit-params
 * @returns Parsed fit params result (without metadata)
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
