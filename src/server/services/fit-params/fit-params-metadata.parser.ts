// src/server/services/fit-params/fit-params-metadata.parser.ts

import * as fs from "fs";
import * as path from "path";
import type { ModelMetadata } from "./fit-params.types";

/**
 * Parse model filename to extract metadata
 * @param filename - Full path or filename of the model
 * @returns Model metadata with extracted information
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
