/**
 * Models Scan Handlers
 * Model discovery and cleanup operations
 */

import fs from "fs";
import path from "path";
import { ok, err } from "../response.js";

/**
 * Register models scan handlers
 */
export function registerModelsScanHandlers(socket, io, db, ggufParser) {
  /**
   * Scan models directory
   */
  socket.on("models:scan", async (req) => {
    const id = req?.requestId || Date.now();
    try {
      const config = db.getConfig();
      const modelsDir = config.baseModelsPath;
      const dirExists = fs.existsSync(modelsDir);

      let scanned = 0;
      let updated = 0;
      let existingCount = 0;

      if (dirExists) {
        const exts = [".gguf", ".bin", ".safetensors", ".pt", ".pth"];
        const excludePatterns = [/mmproj/i, /-proj$/i, /\.factory$/i, /^_/i];

        const isValidModelFile = (fileName, fullPath) => {
          if (excludePatterns.some((p) => p.test(fileName))) {
            return false;
          }

          if (fileName.toLowerCase().endsWith(".gguf")) {
            try {
              const fd = fs.openSync(fullPath, "r");
              const magicBuf = Buffer.alloc(4);
              fs.readSync(fd, magicBuf, 0, 4, 0);
              fs.closeSync(fd);
              const magic = new DataView(magicBuf.buffer).getUint32(0, true);
              if (magic !== 0x46554747) {
                return false;
              }
            } catch {
              return false;
            }
          }

          return true;
        };

        const findModelFiles = (dir) => {
          const results = [];
          try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                results.push(...findModelFiles(fullPath));
              } else if (
                entry.isFile() &&
                exts.some((e) => entry.name.toLowerCase().endsWith(e)) &&
                isValidModelFile(entry.name, fullPath)
              ) {
                results.push(fullPath);
              }
            }
          } catch {
            // Continue
          }
          return results;
        };

        const modelFiles = findModelFiles(modelsDir);
        const existingModels = db.getModels();

        for (const fullPath of modelFiles) {
          try {
            const fileName = path.basename(fullPath);
            const existing = existingModels.find((m) => m.model_path === fullPath);
            if (!existing) {
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
              scanned++;
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
                updated++;
              }
              existingCount++;
            }
          } catch {
            // Skip problematic files
          }
        }
      }

      const allModels = db.getModels();
      ok(socket, "models:scan:result", { scanned, updated, total: allModels.length }, id);
      io.emit("models:scanned", { scanned, updated, total: allModels.length });
    } catch (e) {
      err(socket, "models:scan:result", e.message, id);
    }
  });

  /**
   * Cleanup invalid models
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
