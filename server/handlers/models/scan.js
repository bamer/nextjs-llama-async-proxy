/**
 * Models Scan Handlers
 * Model discovery and cleanup operations
 * Uses async file I/O to prevent event loop blocking
 */

import fs from "fs/promises";
import path from "path";
import { ok, err } from "../response.js";

// Batch processing configuration
const BATCH_SIZE = 5;

/**
 * Check if a directory exists and is accessible.
 * @param {string} dirPath - Directory path to check.
 * @returns {Promise<boolean>} True if directory exists and is accessible.
 */
async function directoryExists(dirPath) {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Process array of items in batches with controlled concurrency.
 * @param {Array} items - Array of items to process.
 * @param {function} processor - Async function to process each item.
 * @param {number} batchSize - Number of items to process concurrently (default: 5).
 * @returns {Promise<Array>} Promise resolving to array of results.
 */
async function processBatch(items, processor, batchSize = BATCH_SIZE) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map((item) => processor(item)));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Check if a file is a valid model file by extension and GGUF magic number.
 * @param {string} fileName - Name of the file to check.
 * @param {string} fullPath - Full path to the file.
 * @returns {Promise<boolean>} True if valid model file, false otherwise.
 */
async function isValidModelFile(fileName, fullPath) {
  const excludePatterns = [/mmproj/i, /-proj$/i, /\.factory$/i, /^_/i];
  if (excludePatterns.some((p) => p.test(fileName))) {
    return false;
  }

  if (fileName.toLowerCase().endsWith(".gguf")) {
    try {
      const fd = await fs.open(fullPath, "r");
      const magicBuf = Buffer.alloc(4);
      await fd.read(magicBuf, 0, 4, 0);
      await fd.close();
      const magic = new DataView(magicBuf.buffer).getUint32(0, true);
      if (magic !== 0x46554747) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Recursively find all model files in a directory.
 * @param {string} dir - Directory path to search.
 * @returns {Promise<Array<string>>} Promise resolving to array of full paths to model files.
 */
async function findModelFiles(dir) {
  const results = [];
  const exts = [".gguf", ".bin", ".safetensors", ".pt", ".pth"];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nestedFiles = await findModelFiles(fullPath);
        results.push(...nestedFiles);
      } else if (
        entry.isFile() &&
        exts.some((e) => entry.name.toLowerCase().endsWith(e)) &&
        (await isValidModelFile(entry.name, fullPath))
      ) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    console.warn("[SCAN] Error reading directory:", { dir, error: error.message });
  }

  return results;
}

/**
 * Register models scan handlers on the socket.
 * @param {object} socket - Socket.IO socket instance.
 * @param {object} io - Socket.IO server instance.
 * @param {object} db - Database instance.
 * @param {function} ggufParser - GGUF metadata parser function.
 */
export function registerModelsScanHandlers(socket, io, db, ggufParser) {
  /**
   * Scan models directory for new model files.
   * @param {object} req - Request object containing optional requestId.
   */
  socket.on("models:scan", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      const config = db.getConfig();
      const modelsDir = config.baseModelsPath;
      const dirExists = await directoryExists(modelsDir);

      let scanned = 0;
      let updated = 0;
      let existingCount = 0;

      if (dirExists) {
        const modelFiles = await findModelFiles(modelsDir);
        const existingModels = db.getModels();

        console.log("[DEBUG] Found", modelFiles.length, "model files to process");

        /**
         * Process a single model file - parse metadata and save to database.
         * @param {string} fullPath - Full path to the model file.
         * @returns {Promise<object>} Promise resolving to result object with type.
         */
        const processFile = async (fullPath) => {
          try {
            const fileName = path.basename(fullPath);
            const existing = existingModels.find((m) => m.model_path === fullPath);
            if (!existing) {
              console.log("[DEBUG] Processing new model file:", { fileName, path: fullPath });
              const meta = await ggufParser(fullPath);
              db.saveModel({
                name: fileName.replace(/\.[^/.]+$/, ""),
                type: meta.architecture || "llama",
                status: "unloaded",
                model_path: fullPath,
                file_size: meta.size,
                params: meta.params,
                quantization: meta.quantization,
                ctx_size: meta.ctxSize || 4096,
                embedding_size: meta.embeddingLength || 0,
                block_count: meta.blockCount || 0,
                head_count: meta.headCount || 0,
                head_count_kv: meta.headCountKv || 0,
                ffn_dim: meta.ffnDim || 0,
                file_type: meta.fileType || 0,
              });
              return { type: "scanned" };
            } else {
              const meta = await ggufParser(fullPath);
              const needsBasicUpdate =
                !existing.params || !existing.quantization || !existing.file_size;
              const needsGgufUpdate =
                !existing.ctx_size || !existing.block_count || existing.ctx_size === 4096;
              if (needsBasicUpdate || needsGgufUpdate) {
                db.updateModel(existing.id, {
                  file_size: meta.size || existing.file_size,
                  params: meta.params || existing.params,
                  quantization: meta.quantization || existing.quantization,
                  type: meta.architecture || existing.type,
                  ctx_size: meta.ctxSize || existing.ctx_size,
                  embedding_size: meta.embeddingLength || existing.embedding_size,
                  block_count: meta.blockCount || existing.block_count,
                  head_count: meta.headCount || existing.head_count,
                  head_count_kv: meta.headCountKv || existing.head_count_kv,
                  ffn_dim: meta.ffnDim || existing.ffn_dim,
                  file_type: meta.fileType || existing.file_type,
                });
                return { type: "updated" };
              }
              return { type: "existing" };
            }
          } catch (error) {
            console.error("[DEBUG] Skipping file due to error:", {
              path: fullPath,
              error: error.message,
            });
            return { type: "error", error: error.message };
          }
        };

        // Process files in parallel batches
        const results = await processBatch(modelFiles, processFile, BATCH_SIZE);

        // Count results
        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const value = result.value;
            if (value.type === "scanned") scanned++;
            else if (value.type === "updated") updated++;
            else if (value.type === "existing") existingCount++;
          }
        });

        console.log("[DEBUG] Scan completed:", {
          scanned,
          updated,
          existingCount,
          total: scanned + updated + existingCount,
        });
      }

      const allModels = db.getModels();
      ok(socket, "models:scan:result", { scanned, updated, total: allModels.length }, id);
      io.emit("models:scanned", { scanned, updated, total: allModels.length });
    } catch (e) {
      err(socket, "models:scan:result", e.message, id);
    }
  });

  /**
   * Cleanup invalid models that no longer exist on disk.
   * @param {object} req - Request object containing optional requestId.
   */
  socket.on("models:cleanup", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const deletedCount = db.cleanupMissingFiles();
      ok(socket, "models:cleanup:result", { deletedCount }, id);
    } catch (e) {
      err(socket, "models:cleanup:result", e.message, id);
    }
  });
}
