import fs from "fs";
import path from "path";
import { gguf, ggufAllShards } from "@huggingface/gguf";
import { fileTypeMap } from "./constants.js";
import { parseGgufHeaderSync } from "./header-parser.js";
import { extractArchitecture, extractParams, extractQuantization } from "./filename-parser.js";

/**
 * Parse GGUF file metadata asynchronously
 * @param {string} filePath - Path to the GGUF file
 * @returns {Promise<Object>} Metadata object with size, architecture, params, etc.
 */
export async function parseGgufMetadata(filePath) {
  const metadata = {
    size: 0,
    architecture: "",
    params: "",
    quantization: "",
    ctxSize: 0,
    embeddingLength: 0,
    blockCount: 0,
    headCount: 0,
    headCountKv: 0,
    ffnDim: 0,
    fileType: 0,
  };

  try {
    const stats = fs.statSync(filePath);
    metadata.size = stats.size;

    // Try our simple synchronous parser first (handles all cases)
    const simpleResult = parseGgufHeaderSync(filePath);

    if (simpleResult && simpleResult.architecture) {
      // Successfully parsed with simple parser
      Object.assign(metadata, simpleResult);

      // Map file_type to quantization
      if (metadata.fileType !== undefined && fileTypeMap[metadata.fileType]) {
        metadata.quantization = fileTypeMap[metadata.fileType];
      }

      return metadata;
    }

    let ggufMeta = {};
    let tensorInfos = [];

    try {
      const info = await gguf(filePath, { allowLocalFile: true });
      if (info.metadata && Object.keys(info.metadata).length > 0) {
        ggufMeta = info.metadata;
        tensorInfos = info.tensorInfos || [];
      } else {
        throw new Error("Empty metadata from gguf()");
      }
    } catch (ggufErr) {
      try {
        const allShardsInfo = await ggufAllShards(filePath, { allowLocalFile: true });
        if (allShardsInfo.shards && allShardsInfo.shards.length > 0) {
          const firstShard = allShardsInfo.shards[0];
          ggufMeta = firstShard.metadata || {};
          tensorInfos = firstShard.tensorInfos || [];
        } else {
          throw new Error("No shards found");
        }
      } catch (shardsErr) {
        // Both failed, use regex fallback
        const fileName = path.basename(filePath);
        metadata.architecture = extractArchitecture(fileName);
        metadata.params = extractParams(fileName);
        metadata.quantization = extractQuantization(fileName);
        const ctxMatch = fileName.match(/(\d+)k?ctx/i) || fileName.match(/ctx[-_]?(\d+)/i);
        if (ctxMatch) metadata.ctxSize = parseInt(ctxMatch[1]) * 1000;
        return metadata;
      }
    }

    // Extract key metadata - GGUF stores keys with architecture prefix as flat keys
    // e.g., "llama.block_count", "llama.context_length", not nested objects
    metadata.architecture = ggufMeta["general.architecture"] || "";
    metadata.params = ggufMeta["general.size_label"] || "";
    const arch = metadata.architecture;

    // Access metadata using flat key format with architecture prefix
    // Handle array values (convert to first element or JSON string)
    const getMetaValue = (key, defaultVal = 0) => {
      const val = ggufMeta[key];
      if (Array.isArray(val)) return val[0] || defaultVal;
      if (val === undefined || val === null) return defaultVal;
      return val;
    };
    metadata.ctxSize = getMetaValue(`${arch}.context_length`, 4096);
    metadata.embeddingLength = getMetaValue(`${arch}.embedding_length`, 0);
    metadata.blockCount = getMetaValue(`${arch}.block_count`, 0);
    metadata.headCount = getMetaValue(`${arch}.attention.head_count`, 0);
    metadata.headCountKv = getMetaValue(`${arch}.attention.head_count_kv`, 0);
    metadata.ffnDim = getMetaValue(`${arch}.feed_forward_length`, 0);
    metadata.fileType = ggufMeta["general.file_type"] || 0;

    // Map file_type to quantization
    if (metadata.fileType !== undefined && fileTypeMap[metadata.fileType]) {
      metadata.quantization = fileTypeMap[metadata.fileType];
    }
  } catch (e) {
    // Fallback: try regex-based parsing from filename
    try {
      const fileName = path.basename(filePath);
      metadata.architecture = extractArchitecture(fileName);
      metadata.params = extractParams(fileName);
      metadata.quantization = extractQuantization(fileName);
      const ctxMatch = fileName.match(/(\d+)k?ctx/i) || fileName.match(/ctx[-_]?(\d+)/i);
      if (ctxMatch) metadata.ctxSize = parseInt(ctxMatch[1]) * 1000;
    } catch (fallbackErr) {
      // Fallback parsing also failed - ignore
    }
  }

  return metadata;
}
