import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { getLogger } from "../../lib/logger";

const logger = getLogger();
const execAsync = promisify(exec);

// Fit-params configuration from environment
const FIT_PARAMS_BINARY = process.env.FIT_PARAMS_BINARY || "/home/bamer/llama.cpp/build/bin/llama-fit-params";
const FIT_TARGET = parseInt(process.env.FIT_TARGET || "1024", 10);
const FIT_CTX = parseInt(process.env.FIT_CTX || "4096", 10);
const FIT_TIMEOUT = 60000; // 60 seconds

export interface ModelMetadata {
  file_size_bytes: number;
  quantization_type: string | null;
  parameter_count: number | null;
  architecture: string | null;
  context_window: number | null;
}

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

/**
 * Parse model filename to extract metadata
 */
function parseModelFilename(filename: string): ModelMetadata {
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
function parseFitParamsOutput(output: string): Omit<FitParamsResult, "metadata"> {
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

/**
 * Run llama-fit-params analysis on a model file
 */
async function analyzeModel(modelPath: string): Promise<FitParamsResult> {
  const startTime = Date.now();

  try {
    logger.info(`[FitParams] Starting analysis for: ${modelPath}`);

    // Check if model file exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }

    // Check if fit-params binary exists
    if (!fs.existsSync(FIT_PARAMS_BINARY)) {
      throw new Error(`Fit-params binary not found: ${FIT_PARAMS_BINARY}`);
    }

    // Build command
    const command = `"${FIT_PARAMS_BINARY}" -m "${modelPath}" -fit on -fit-target ${FIT_TARGET} -fit-ctx ${FIT_CTX}`;

    logger.info(`[FitParams] Executing: ${command}`);

    // Run command with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: FIT_TIMEOUT,
    });

    const elapsed = Date.now() - startTime;
    logger.info(`[FitParams] Analysis completed in ${elapsed}ms`);

    // Parse output
    const parsed = parseFitParamsOutput(stdout);

    // Extract metadata from filename
    const metadata = parseModelFilename(modelPath);

    return {
      ...parsed,
      metadata,
      success: true,
      error: stderr || null,
      raw_output: stdout,
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    logger.error(`[FitParams] Analysis failed after ${elapsed}ms: ${message}`);

    // Try to extract metadata even if fit-params failed
    let metadata: ModelMetadata = {
      file_size_bytes: 0,
      quantization_type: null,
      parameter_count: null,
      architecture: null,
      context_window: null,
    };

    try {
      if (fs.existsSync(modelPath)) {
        metadata = parseModelFilename(modelPath);
      }
    } catch (metadataError) {
      logger.warn(`[FitParams] Failed to extract metadata: ${metadataError}`);
    }

    return {
      recommended_ctx_size: null,
      recommended_gpu_layers: null,
      recommended_tensor_split: null,
      projected_cpu_memory_mb: null,
      projected_gpu_memory_mb: null,
      metadata,
      success: false,
      error: message,
      raw_output: null,
    };
  }
}

/**
 * Batch analyze multiple models
 */
async function analyzeModels(modelPaths: string[]): Promise<Map<string, FitParamsResult>> {
  const results = new Map<string, FitParamsResult>();

  logger.info(`[FitParams] Starting batch analysis for ${modelPaths.length} models`);

  for (const modelPath of modelPaths) {
    try {
      const result = await analyzeModel(modelPath);
      results.set(modelPath, result);
    } catch (error) {
      logger.error(`[FitParams] Batch analysis failed for ${modelPath}:`, error);
    }
  }

  logger.info(`[FitParams] Batch analysis complete: ${results.size}/${modelPaths.length} successful`);
  return results;
}

/**
 * Check if fit-params analysis is needed
 */
function shouldAnalyze(
  lastAnalyzedAt: number | null,
  modelPath: string | null
): boolean {
  if (!modelPath || !fs.existsSync(modelPath)) {
    return false;
  }

  // If never analyzed, need to analyze
  if (!lastAnalyzedAt) {
    return true;
  }

  // Get file modification time
  const stats = fs.statSync(modelPath);
  const fileModifiedTime = stats.mtimeMs;

  return fileModifiedTime > lastAnalyzedAt;
}

export {
  analyzeModel,
  analyzeModels,
  parseModelFilename,
  parseFitParamsOutput,
  shouldAnalyze,
};
