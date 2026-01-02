// src/server/services/fit-params/fit-params-analyzer.service.ts

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import { getLogger } from "../../../lib/logger";
import type { FitParamsResult, ModelMetadata } from "./fit-params.types";
import { parseModelFilename } from "./fit-params-metadata.parser";
import { parseFitParamsOutput } from "./fit-params-output.parser";

const logger = getLogger();
const execAsync = promisify(exec);

// Fit-params configuration from environment
const FIT_PARAMS_BINARY =
  process.env.FIT_PARAMS_BINARY || "/home/bamer/llama.cpp/build/bin/llama-fit-params";
const FIT_TARGET = parseInt(process.env.FIT_TARGET || "1024", 10);
const FIT_CTX = parseInt(process.env.FIT_CTX || "4096", 10);
const FIT_TIMEOUT = 60000; // 60 seconds

/**
 * Run llama-fit-params analysis on a model file
 * @param modelPath - Path to the model file
 * @returns Fit params analysis result
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
 * @param modelPaths - Array of model file paths
 * @returns Map of model paths to their analysis results
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
 * @param lastAnalyzedAt - Unix timestamp of last analysis
 * @param modelPath - Path to the model file
 * @returns True if analysis is needed
 */
function shouldAnalyze(lastAnalyzedAt: number | null, modelPath: string | null): boolean {
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

export { analyzeModel, analyzeModels, shouldAnalyze };
