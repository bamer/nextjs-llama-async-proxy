/**
 * Presets Utilities
 * INI parsing, generation, and model configuration helpers
 * Split from presets.js to follow AGENTS.md 200-line rule
 */

import fs from "fs";
import path from "path";

const PRESETS_DIR = path.join(process.cwd(), "config");

// Ensure config directory exists
if (!fs.existsSync(PRESETS_DIR)) {
  fs.mkdirSync(PRESETS_DIR, { recursive: true });
}

/**
 * Parse INI file content into a structured object.
 * @param {string} content - INI file content to parse.
 * @returns {Object} Parsed INI structure with sections.
 */
export function parseIni(content) {
  const result = {};
  let currentSection = null;

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";")) continue;

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1);
      result[currentSection] = {};
      continue;
    }

    if (currentSection && trimmed.includes("=")) {
      const [key, ...valueParts] = trimmed.split("=");
      const k = key.trim();
      const v = valueParts.join("=").trim();
      result[currentSection][k] = v;
    }
  }

  return result;
}

/**
 * Generate INI file content from a configuration object (sparse format).
 * @param {Object} config - Configuration object to generate INI from.
 * @returns {string} INI formatted string.
 */
export function generateIni(config) {
  let content = "LLAMA_CONFIG_VERSION = 1\n\n";

  for (const [section, params] of Object.entries(config)) {
    if (section === "LLAMA_CONFIG_VERSION") continue;

    content += `[${section}]\n`;

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      const iniKey = key.startsWith("_") ? key.substring(1) : key;
      content += `${iniKey} = ${value}\n`;
    }

    content += "\n";
  }

  return content;
}

/**
 * Get default parameters (all available llama.cpp router parameters).
 * @returns {Object} Default parameter configuration.
 */
export function getDefaultParameters() {
  return {
    // Model file path
    model: "",

    // Context and memory
    "ctx-size": 2048,
    "ctx-checkpoints": 8,

    // GPU offloading
    "n-gpu-layers": 0,
    "split-mode": "none",
    "tensor-split": null,
    "main-gpu": 0,

    // Performance tuning
    threads: 0,
    batch: 512,
    ubatch: 512,
    "threads-http": 1,

    // Generation settings
    "temp": 0.8,
    "top-k": 40,
    "top-p": 0.9,
    "min-p": 0.1,
    "tfs-z": 1.0,
    "typical-p": 1.0,

    // Sampling chain
    "mirostat": 0,
    "mirostat-lr": 0.1,
    "mirostat-ent": 5.0,

    // Output control
    "penalty-p": 1.0,
    "penalty-n-p": 1.0,
    "penalty-count": 1,
    "repeat-last-n": 64,
    "penalty-prompt": 0,

    // Grammar
    "grammar": null,
    "grammar-file": null,

    // Logging
    "verbose": true,

    // Autosplit
    "autosplit": false,

    // Controllable generation
    "cfg-negative-prompt": "",
    "cfg-scale": 1.0,

    // Pipelining
    "no-perf": false,
    "flash-attn": true,

    // Pooling
    "pooling": "none",
    "type": 0,
  };
}

/**
 * Get default configuration structure.
 * @returns {Object} Default configuration object.
 */
export function getDefaultConfig() {
  return {
    LLAMA_CONFIG_VERSION: "1",
  };
}

/**
 * Convert INI section to a model configuration object.
 * @param {Object} section - INI section key-value pairs.
 * @param {Object} defaults - Default values for the section.
 * @returns {Object} Model configuration object with parsed values.
 */
export function iniSectionToModel(section, defaults = {}) {
  const result = {};

  if (section === "*") {
    // Defaults section
    for (const [key, value] of Object.entries(defaults)) {
      const iniKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      if (section[iniKey] !== undefined) {
        result[key] = parseValue(section[iniKey]);
      }
    }
  } else {
    // Model section - convert kebab-case to camelCase
    for (const [key, value] of Object.entries(section)) {
      const camelKey = key.replace(/-([a-z])/g, (m, p1) => p1.toUpperCase());
      result[camelKey] = parseValue(value);
    }
  }

  return result;
}

/**
 * Convert a model configuration object to an INI section.
 * @param {string} section - Section name for the INI.
 * @param {Object} config - Model configuration object.
 * @returns {Object} INI section key-value pairs.
 */
export function modelToIniSection(section, config) {
  const result = {};

  for (const [key, value] of Object.entries(config)) {
    const iniKey = key.startsWith("_") ? key.substring(1) : key.replace(/([A-Z])/g, "-$1").toLowerCase();
    result[iniKey] = String(value);
  }

  return result;
}

/**
 * Parse INI value to appropriate type
 */
function parseValue(value) {
  if (value === null || value === undefined) return null;

  const trimmed = String(value).trim();

  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;

  const num = Number(trimmed);
  if (!isNaN(num) && trimmed === String(num)) return num;

  return trimmed;
}

/**
 * Read and parse a preset file from the config directory.
 * @param {string} filename - Name of the preset (without extension).
 * @returns {Object} Preset object with filename, content, and parsed data.
 */
export function readPreset(filename) {
  const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Preset not found: ${filename}`);
  }

  const content = fs.readFileSync(filepath, "utf-8");
  const parsed = parseIni(content);

  return {
    filename,
    content,
    parsed,
    lastModified: fs.statSync(filepath).mtime,
  };
}

/**
 * Save a preset configuration to a file.
 * @param {string} filename - Name of the preset (without extension).
 * @param {Object} config - Configuration object to save.
 * @returns {Object} Save result with filename, path, size, and lastModified.
 */
export function savePreset(filename, config) {
  const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

  const content = generateIni(config);
  fs.writeFileSync(filepath, content, "utf-8");

  console.log(`[DEBUG] Preset saved: ${filepath}`);

  return {
    filename,
    path: filepath,
    size: content.length,
    lastModified: new Date(),
  };
}

/**
 * Delete a preset file from the config directory.
 * @param {string} filename - Name of the preset (without extension).
 * @returns {Object} Delete result with filename and deleted status.
 */
export function deletePreset(filename) {
  const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Preset not found: ${filename}`);
  }

  fs.unlinkSync(filepath);

  console.log(`[DEBUG] Preset deleted: ${filepath}`);

  return { filename, deleted: true };
}

/**
 * List all preset files in the config directory.
 * @returns {Array<string>} Array of preset names (without extensions).
 */
export function listPresets() {
  if (!fs.existsSync(PRESETS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PRESETS_DIR);
  return files
    .filter((f) => f.endsWith(".ini"))
    .map((f) => f.replace(/\.ini$/, ""))
    .sort();
}

/**
 * Extract all models from a preset file.
 * @param {string} filename - Name of the preset (without extension).
 * @returns {Object} Object mapping model names to their configurations.
 */
export function getModelsFromPreset(filename) {
  const preset = readPreset(filename);
  const models = {};

  for (const [section, params] of Object.entries(preset.parsed)) {
    if (section === "LLAMA_CONFIG_VERSION" || section === "*") continue;

    // Include all model sections, even those without a model property
    // This allows adding placeholder models that will be configured later
    models[section] = iniSectionToModel(params, {});
  }

  return models;
}

/**
 * Validate INI content for correctness.
 * @param {string} content - INI content to validate.
 * @returns {Object} Validation result with valid status, errors, and line count.
 */
export function validateIni(content) {
  const errors = [];

  try {
    const parsed = parseIni(content);

    if (!parsed["LLAMA_CONFIG_VERSION"]) {
      errors.push({ line: 1, message: "Missing LLAMA_CONFIG_VERSION" });
    }

    for (const [section, params] of Object.entries(parsed)) {
      if (section === "LLAMA_CONFIG_VERSION") continue;

      for (const [key, value] of Object.entries(params)) {
        if (key === "model" && !value) {
          errors.push({ section, message: "Empty model path" });
        }
      }
    }
  } catch (error) {
    errors.push({ message: error.message });
  }

  return {
    valid: errors.length === 0,
    errors,
    lineCount: content.split("\n").length,
  };
}

/**
 * Update or add a model in a preset file.
 * @param {string} filename - Name of the preset (without extension).
 * @param {string} modelName - Name of the model section.
 * @param {Object} config - Model configuration to set.
 * @returns {Object} Update result with filename, modelName, and updated status.
 */
export function updateModelInPreset(filename, modelName, config) {
  const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

  let parsed = {};
  if (fs.existsSync(filepath)) {
    parsed = parseIni(fs.readFileSync(filepath, "utf-8"));
  }

  parsed[modelName] = modelToIniSection(modelName, config);

  const content = generateIni(parsed);
  fs.writeFileSync(filepath, content, "utf-8");

  console.log(`[DEBUG] Model ${modelName} updated in preset: ${filename}`);

  return { filename, modelName, updated: true };
}

/**
 * Remove a model from a preset file.
 * @param {string} filename - Name of the preset (without extension).
 * @param {string} modelName - Name of the model section to remove.
 * @returns {Object} Remove result with filename, modelName, and removed status.
 */
export function removeModelFromPreset(filename, modelName) {
  const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Preset not found: ${filename}`);
  }

  const parsed = parseIni(fs.readFileSync(filepath, "utf-8"));

  if (!parsed[modelName]) {
    throw new Error(`Model ${modelName} not found in preset`);
  }

  delete parsed[modelName];

  const content = generateIni(parsed);
  fs.writeFileSync(filepath, content, "utf-8");

  console.log(`[DEBUG] Model ${modelName} removed from preset: ${filename}`);

  return { filename, modelName, removed: true };
}

/**
 * Get the defaults section from a preset file.
 * @param {string} filename - Name of the preset (without extension).
 * @returns {Object} Default configuration from the preset.
 */
export function getPresetsDefaults(filename) {
  const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Preset not found: ${filename}`);
  }

  const content = fs.readFileSync(filepath, "utf-8");
  const parsed = parseIni(content);

  const defaults = parsed["*"] || {};

  return iniSectionToModel(defaults, getDefaultParameters());
}
