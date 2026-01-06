/**
 * Model Validator Utilities
 * Handles GGUF file validation and pattern matching
 */

import fs from "fs";
import path from "path";

/**
 * Exclude patterns for invalid model files
 */
export const MODEL_EXCLUDE_PATTERNS = [
  /mmproj/i, // Multimodal projector files
  /-proj$/i, // Projector files ending with -proj
  /\.factory/i, // Factory config files
  /\.bin$/i, // .bin files that are not GGUF
  /^_/i, // Files starting with underscore
];

/**
 * GGUF magic bytes
 */
const GGUF_MAGIC = 0x46554747;

/**
 * Check if a file is a valid GGUF model file
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if valid
 */
export function isValidModelFile(filePath) {
  try {
    const fileName = path.basename(filePath);

    if (MODEL_EXCLUDE_PATTERNS.some((p) => p.test(fileName))) {
      console.log("[DEBUG] Cleanup: Excluding", fileName, "(matched exclude pattern)");
      return false;
    }

    if (fileName.toLowerCase().endsWith(".gguf")) {
      const fd = fs.openSync(filePath, "r");
      const magicBuf = Buffer.alloc(4);
      fs.readSync(fd, magicBuf, 0, 4, 0);
      fs.closeSync(fd);
      const magic = new DataView(magicBuf.buffer).getUint32(0, true);
      if (magic !== GGUF_MAGIC) {
        console.log("[DEBUG] Cleanup: Excluding", fileName, "(invalid GGUF magic)");
        return false;
      }
    }

    return true;
  } catch (e) {
    console.log("[DEBUG] Cleanup: Excluding", filePath, "(error:", e.message, ")");
    return false;
  }
}

/**
 * Check if a model file exists
 * @param {string} modelPath - Path to model
 * @returns {boolean} True if exists
 */
export function modelFileExists(modelPath) {
  return modelPath && fs.existsSync(modelPath);
}

/**
 * Check if model entry is valid
 * @param {Object} model - Model object
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateModelEntry(model) {
  if (!model.model_path) {
    return { valid: false, reason: "no path" };
  }
  if (!fs.existsSync(model.model_path)) {
    return { valid: false, reason: "file missing" };
  }
  if (!isValidModelFile(model.model_path)) {
    return { valid: false, reason: "invalid model file" };
  }
  return { valid: true, reason: null };
}

export default {
  MODEL_EXCLUDE_PATTERNS,
  isValidModelFile,
  modelFileExists,
  validateModelEntry,
};
