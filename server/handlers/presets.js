/**
 * Socket.IO Handlers for .INI Configuration Presets
 * Manages llama.cpp router mode model configurations
 */

import fs from "fs";
import path from "path";
import { execSync, exec } from "child_process";
import { logger } from "./logger.js";
import { startLlamaServerRouter, stopLlamaServerRouter } from "./llama-router/index.js";
import { ok, err } from "./response.js";

const PRESETS_DIR = path.join(process.cwd(), "config");

// Ensure config directory exists
if (!fs.existsSync(PRESETS_DIR)) {
  fs.mkdirSync(PRESETS_DIR, { recursive: true });
  console.log("[DEBUG] Created config directory:", PRESETS_DIR);
}

/**
 * Parse INI file content
 */
function parseIni(content) {
  const result = {};
  let currentSection = null;

  const lines = content.split("\n");
  for (const line of lines) {
    // Trim and skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";")) continue;

    // Section header
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      currentSection = trimmed.slice(1, -1);
      result[currentSection] = {};
      continue;
    }

    // Key-value pair
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
 * Generate INI file content - Sparse format (only user-set values)
 */
function generateIni(config) {
  let content = "LLAMA_CONFIG_VERSION = 1\n\n";

  for (const [section, params] of Object.entries(config)) {
    if (section === "LLAMA_CONFIG_VERSION") continue;

    content += `[${section}]\n`;

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      // Write underscore-prefixed fields without underscore in INI (e.g., _is_group -> is_group)
      const iniKey = key.startsWith("_") ? key.substring(1) : key;
      content += `${iniKey} = ${value}\n`;
    }

    content += "\n";
  }

  return content;
}

/**
 * Get default parameters (all available llama.cpp router parameters)
 */
function getDefaultParameters() {
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

    // Sampling parameters
    temp: 0.7,
    seed: -1,
    samplers: "penalties;dry;top_n_sigma;top_k;typ_p;top_p;min_p;xtc;temperature",
    mirostat: 0,
    "mirostat-lr": 0.1,
    "mirostat-ent": 5.0,

    // Speculative decoding
    "draft-min": 5,
    "draft-max": 10,
    "draft-p-min": 0.8,

    // Server settings
    "cache-ram": 8192,

    // Router-specific
    "load-on-startup": false,

    // Advanced
    mmp: null,
  };
}

/**
 * Convert model config object to INI format
 * Maps camelCase keys from frontend to kebab-case for INI
 */
function modelToIniSection(modelName, config) {
  const section = {};

  for (const [key, value] of Object.entries(config)) {
    if (value === undefined || value === null || value === "") continue;

    // Handle underscore-prefixed metadata fields (store without underscore in INI)
    if (key === "_is_group") {
      section["is_group"] = String(value);
      continue;
    }

    // Skip other underscore-prefixed internal fields
    if (key.startsWith("_")) continue;

    const iniKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    section[iniKey] = String(value);
  }

  return section;
}

/**
 * Convert INI section to model config object
 * Returns ONLY values that are explicitly set in the section (sparse config)
 * Does NOT merge with hardcoded defaults
 */
function iniSectionToModel(section, defaultsSection = {}) {
  const result = {};

  if (section.model) result.model = section.model;

  const paramMappings = [
    { ini: "ctx-size", key: "ctxSize", type: "int" },
    { ini: "temp", key: "temperature", type: "float" },
    { ini: "n-gpu-layers", key: "nGpuLayers", type: "int" },
    { ini: "threads", key: "threads", type: "int" },
    { ini: "batch-size", key: "batchSize", type: "int" },
    { ini: "batch", key: "batchSize", type: "int" }, // Alternative name
    { ini: "ubatch-size", key: "ubatchSize", type: "int" },
    { ini: "ubatch", key: "ubatchSize", type: "int" }, // Alternative name
    { ini: "ctx-checkpoints", key: "ctxCheckpoints", type: "int" },
    { ini: "top-p", key: "topP", type: "float" },
    { ini: "top-k", key: "topK", type: "int" },
    { ini: "min-p", key: "minP", type: "float" },
    { ini: "typ-p", key: "typP", type: "float" },
    { ini: "seed", key: "seed", type: "int" },
    { ini: "mirostat", key: "mirostat", type: "int" },
    { ini: "mirostat-lr", key: "mirostat_lr", type: "float" },
    { ini: "mirostat-ent", key: "mirostat_ent", type: "float" },
    { ini: "repeat-penalty", key: "repeat_penalty", type: "float" },
    { ini: "repeat-last-n", key: "repeat_last_n", type: "int" },
    { ini: "presence-penalty", key: "presence_penalty", type: "float" },
    { ini: "frequency-penalty", key: "frequency_penalty", type: "float" },
    { ini: "threads-http", key: "threadsHttp", type: "int" },
    { ini: "cache-ram", key: "cacheRam", type: "int" },
    { ini: "cache-reuse", key: "cacheReuse", type: "int" },
    { ini: "main-gpu", key: "mainGpu", type: "int" },
    { ini: "draft-min", key: "draft_min", type: "int" },
    { ini: "draft-max", key: "draft_max", type: "int" },
    { ini: "draft-p-min", key: "draft_p_min", type: "float" },
    { ini: "tensor-split", key: "tensorSplit", type: "string" },
    { ini: "split-mode", key: "splitMode", type: "string" },
    { ini: "mmp", key: "mmp", type: "string" },
    { ini: "chat-template", key: "chatTemplate", type: "string" },
  ];

  for (const mapping of paramMappings) {
    if (section[mapping.ini] !== undefined) {
      const value = section[mapping.ini];
      if (mapping.type === "int") {
        result[mapping.key] = parseInt(value);
      } else if (mapping.type === "float") {
        result[mapping.key] = parseFloat(value);
      } else {
        result[mapping.key] = value;
      }
    }
  }

  if (section["load-on-startup"] !== undefined) {
    result.loadOnStartup = section["load-on-startup"].toLowerCase() === "true";
  }

  if (section.jinja !== undefined) {
    result.jinja = section.jinja.toLowerCase() === "true";
  }

  if (section._is_group === "true" || section._is_group === true) {
    result._is_group = true;
  }

  return result;
}

/**
 * List all INI preset files
 */
function listPresets() {
  try {
    if (!fs.existsSync(PRESETS_DIR)) {
      return [];
    }

    const files = fs.readdirSync(PRESETS_DIR);
    return files
      .filter((f) => f.endsWith(".ini"))
      .map((f) => ({
        name: f.replace(".ini", ""),
        path: f,
        file: path.join(PRESETS_DIR, f),
      }));
  } catch (error) {
    throw new Error(`Failed to list presets: ${error.message}`);
  }
}

/**
 * Read INI file
 */
function readPreset(filename) {
  try {
    const filepath = path.join(PRESETS_DIR, `${filename}.ini`);
    const logFile = "/tmp/presets-debug.log";
    fs.appendFileSync(logFile, `readPreset: filepath=${filepath}\n`);

    if (!fs.existsSync(filepath)) {
      fs.appendFileSync(logFile, `File not found\n`);
      throw new Error(`Preset file not found: ${filepath}`);
    }

    const content = fs.readFileSync(filepath, "utf-8");
    fs.appendFileSync(logFile, `Content: ${content.substring(0, 200)}\n`);
    const parsed = parseIni(content);

    fs.appendFileSync(logFile, `Parsed [*]: ${JSON.stringify(parsed["*"])}\n`);

    return {
      filename,
      content,
      parsed,
    };
  } catch (error) {
    throw new Error(`Failed to read preset: ${error.message}`);
  }
}

/**
 * Save INI file
 */
function savePreset(filename, config) {
  try {
    const filepath = path.join(PRESETS_DIR, `${filename}.ini`);
    const content = generateIni(config);

    fs.writeFileSync(filepath, content, "utf-8");

    console.log("[DEBUG] Preset saved:", { filename, path: filepath });
    logger.info(`Preset saved: ${filename}`);

    return {
      filename,
      path: filepath,
    };
  } catch (error) {
    throw new Error(`Failed to save preset: ${error.message}`);
  }
}

/**
 * Delete INI file
 */
function deletePreset(filename) {
  try {
    const filepath = path.join(PRESETS_DIR, `${filename}.ini`);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Preset file not found: ${filename}`);
    }

    fs.unlinkSync(filepath);
    console.log("[DEBUG] Preset deleted:", { filename });
    logger.info(`Preset deleted: ${filename}`);

    return { filename };
  } catch (error) {
    throw new Error(`Failed to delete preset: ${error.message}`);
  }
}

/**
 * Validate INI syntax
 */
function validateIni(content) {
  const errors = [];

  try {
    const parsed = parseIni(content);

    // Validate each section
    for (const [section, params] of Object.entries(parsed)) {
      if (!params.model) {
        errors.push(`[${section}]: Missing required 'model' parameter`);
      }

      // Validate numeric values
      const numericKeys = ["ctx-size", "n-gpu-layers", "threads", "batch", "ubatch"];
      for (const key of numericKeys) {
        if (params[key]) {
          const value = parseInt(params[key]);
          if (isNaN(value)) {
            errors.push(`[${section}]: Invalid ${key} value: ${params[key]}`);
          }
        }
      }

      // Validate temperature
      if (params.temp) {
        const value = parseFloat(params.temp);
        if (isNaN(value)) {
          errors.push(`[${section}]: Invalid temp value: ${params.temp}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Parse error: ${error.message}`],
    };
  }
}

/**
 * Get all models from a preset with inheritance from "*" defaults
 */
function getModelsFromPreset(filename) {
  try {
    const { parsed } = readPreset(filename);
    const models = {};
    const defaultsSection = parsed["*"] || {};

    for (const [section, params] of Object.entries(parsed)) {
      if (section === "LLAMA_CONFIG_VERSION" || section === "*") continue;
      models[section] = iniSectionToModel(params, defaultsSection);
    }

    return models;
  } catch (error) {
    throw new Error(`Failed to get models: ${error.message}`);
  }
}

/**
 * Get the "*" defaults section from a preset
 */
function getPresetsDefaults(filename) {
  try {
    const { parsed } = readPreset(filename);
    return iniSectionToModel(parsed["*"] || {}, {});
  } catch (error) {
    throw new Error(`Failed to get preset defaults: ${error.message}`);
  }
}

/**
 * Add or update model in preset
 * Merges new config with existing values to preserve unspecified fields
 */
function updateModelInPreset(filename, modelName, config) {
  try {
    const logFile = "/tmp/presets-debug.log";
    fs.appendFileSync(
      logFile,
      `updateModelInPreset: filename=${filename}, modelName=${modelName}, config=${JSON.stringify(config)}\n`
    );
    const preset = readPreset(filename);
    const existingSection = preset.parsed[modelName] || {};
    const newIniSection = modelToIniSection(modelName, config);
    fs.appendFileSync(logFile, `newIniSection=${JSON.stringify(newIniSection)}\n`);

    // Merge existing with new values
    const mergedSection = { ...existingSection, ...newIniSection };

    // Remove parameters that are null/undefined in the config (deleted)
    for (const [key, value] of Object.entries(config)) {
      if (value === null || value === undefined) {
        const iniKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        delete mergedSection[iniKey];
      }
    }
    fs.appendFileSync(logFile, `mergedSection=${JSON.stringify(mergedSection)}\n`);

    preset.parsed[modelName] = mergedSection;
    savePreset(filename, preset.parsed);
    logger.info(`Model updated in preset: ${filename}/${modelName}`);

    return {
      filename,
      modelName,
      config: iniSectionToModel(mergedSection),
    };
  } catch (error) {
    throw new Error(`Failed to update model: ${error.message}`);
  }
}

/**
 * Remove model from preset
 */
function removeModelFromPreset(filename, modelName) {
  try {
    const preset = readPreset(filename);

    if (!preset.parsed[modelName]) {
      throw new Error(`Model not found: ${modelName}`);
    }

    delete preset.parsed[modelName];
    savePreset(filename, preset.parsed);

    console.log("[DEBUG] Model removed from preset:", { filename, modelName });
    logger.info(`Model removed from preset: ${filename}/${modelName}`);

    return { filename, modelName };
  } catch (error) {
    throw new Error(`Failed to remove model: ${error.message}`);
  }
}

/**
 * Register Socket.IO handlers
 */
export function registerPresetsHandlers(socket, db) {
  console.log("[DEBUG] Registering preset handlers");

  socket.on("presets:list", (data) => {
    console.log("[DEBUG] Event: presets:list");
    try {
      const presets = listPresets();
      ok(socket, "presets:list:result", { presets }, data.requestId);
    } catch (error) {
      console.error("[DEBUG] Error in presets:list:", error.message);
      err(socket, "presets:list:result", error.message, data.requestId);
    }
  });

  socket.on("presets:read", async (data, ack) => {
    console.log("[DEBUG] Event: presets:read", { filename: data.filename });
    try {
      const { filename } = data;
      const preset = readPreset(filename);
      const response = { success: true, data: preset };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:read:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:get-models", async (data, ack) => {
    console.log("[DEBUG] Event: presets:get-models", { filename: data.filename });
    try {
      const { filename } = data;
      const models = getModelsFromPreset(filename);
      const response = { success: true, data: { models } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-models:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:save", async (data, ack) => {
    console.log("[DEBUG] Event: presets:save", { filename: data.filename });
    try {
      const { filename, config } = data;
      const result = savePreset(filename, config);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:save:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:create", async (data, ack) => {
    console.log("[DEBUG] Event: presets:create", { filename: data.filename });
    try {
      const { filename, description } = data;
      const config = {
        LLAMA_CONFIG_VERSION: "1",
      };
      const result = savePreset(filename, config);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:create:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:delete", async (data, ack) => {
    console.log("[DEBUG] Event: presets:delete", { filename: data.filename });
    try {
      const { filename } = data;
      const result = deletePreset(filename);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:delete:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:validate", async (data, ack) => {
    console.log("[DEBUG] Event: presets:validate");
    try {
      const { content } = data;
      const validation = validateIni(content);
      const response = { success: true, data: validation };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:validate:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:add-model", async (data, ack) => {
    console.log("[DEBUG] Event: presets:add-model", {
      filename: data.filename,
      model: data.modelName,
    });
    try {
      const { filename, modelName, config } = data;
      const result = updateModelInPreset(filename, modelName, config);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:add-model:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:update-model", async (data, ack) => {
    console.log("[DEBUG] Event: presets:update-model", {
      filename: data.filename,
      model: data.modelName,
    });
    try {
      const { filename, modelName, config } = data;
      const result = updateModelInPreset(filename, modelName, config);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:update-model:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:remove-model", async (data, ack) => {
    console.log("[DEBUG] Event: presets:remove-model", {
      filename: data.filename,
      model: data.modelName,
    });
    try {
      const { filename, modelName } = data;
      const result = removeModelFromPreset(filename, modelName);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:remove-model:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:get-defaults", async (data, ack) => {
    console.log("[DEBUG] Event: presets:get-defaults", { filename: data.filename });
    try {
      const { filename } = data;
      const defaults = getPresetsDefaults(filename);
      const response = { success: true, data: { defaults } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-defaults:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  socket.on("presets:update-defaults", async (data, ack) => {
    console.log("[DEBUG] Event: presets:update-defaults", { filename: data.filename });
    try {
      const { filename, config } = data;
      const preset = readPreset(filename);
      const existingSection = preset.parsed["*"] || {};

      // Build new section by taking existing section and updating with new values
      const mergedSection = { ...existingSection };
      
      // Apply updates from config
      const newIniSection = modelToIniSection("*", config);
      Object.assign(mergedSection, newIniSection);

      // Remove parameters that are null/undefined in the config (deleted)
      for (const [key, value] of Object.entries(config)) {
        if (value === null || value === undefined) {
          const iniKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
          delete mergedSection[iniKey];
        }
      }

      preset.parsed["*"] = mergedSection;
      savePreset(filename, preset.parsed);

      console.log("[DEBUG] Preset defaults updated:", { filename });
      logger.info(`Preset defaults updated: ${filename}`);

      const response = {
        success: true,
        data: {
          filename,
          defaults: iniSectionToModel(mergedSection, {}),
        },
      };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:update-defaults:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  // ==================== NEW HANDLERS ====================

  /**
   * Get models directory from settings and scan for .gguf files
   */
  socket.on("presets:get-models-dir", async (data, ack) => {
    console.log("[DEBUG] Event: presets:get-models-dir");
    try {
      const config = db.getConfig();
      const modelsDir = config.baseModelsPath || path.join(process.cwd(), "models");
      const llamaServerPath = config.serverPath || path.join(process.cwd(), "llama-server");

      console.log("[DEBUG] Scanning models directory:", modelsDir);

      const models = [];

      // Recursive function to find .gguf files
      function scanDirectory(dir) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          // Check if it's a .gguf file
          if (stats.isFile() && file.endsWith(".gguf")) {
            const modelName = file.replace(".gguf", "");

            // Estimate VRAM
            let vramEstimate = null;
            try {
              vramEstimate = estimateVram(filePath, config);
            } catch (vramError) {
              console.log("[DEBUG] VRAM estimation failed for", file, ":", vramError.message);
            }

            models.push({
              name: modelName,
              path: filePath,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
              vram: vramEstimate,
              vramFormatted: vramEstimate ? formatBytes(vramEstimate) : null,
            });
          }
          // Recursively scan subdirectories
          else if (stats.isDirectory()) {
            scanDirectory(filePath);
          }
        }
      }

      scanDirectory(modelsDir);

      console.log("[DEBUG] Models found:", models.length);
      const response = { success: true, data: { models, directory: modelsDir } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-models-dir:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Get all llama.cpp parameters from llama-server --help
   */
  socket.on("presets:get-llama-params", async (data, ack) => {
    console.log("[DEBUG] Event: presets:get-llama-params");
    try {
      const config = db.getConfig();
      const llamaServerPath = config.serverPath || path.join(process.cwd(), "llama-server");

      const categories = getLlamaParams(llamaServerPath);

      console.log("[DEBUG] Llama params categories:", Object.keys(categories));
      const response = { success: true, data: { categories } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-llama-params:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Validate complete config before save
   */
  socket.on("presets:validate-config", async (data, ack) => {
    console.log("[DEBUG] Event: presets:validate-config");
    try {
      const { config } = data;
      const validation = validateCompleteConfig(config);
      const response = { success: true, data: validation };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:validate-config:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Calculate final config for a model (inheritance viewer)
   */
  socket.on("presets:show-inheritance", async (data, ack) => {
    console.log("[DEBUG] Event: presets:show-inheritance", data);
    try {
      const { filename, modelName } = data;
      const result = calculateInheritance(filename, modelName);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:show-inheritance:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Get available models from baseModelsPath (alias for get-models-dir for frontend compatibility)
   */
  socket.on("presets:available-models", async (data, ack) => {
    console.log("[DEBUG] Event: presets:available-models");
    try {
      const config = db.getConfig();
      const modelsDir = config.baseModelsPath || path.join(process.cwd(), "models");

      console.log("[DEBUG] Scanning models directory:", modelsDir);

      const models = [];

      // Recursive function to find .gguf files
      function scanDirectory(dir) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          // Check if it's a .gguf file
          if (stats.isFile() && file.endsWith(".gguf")) {
            const modelName = file.replace(".gguf", "");

            // Estimate VRAM
            let vramEstimate = null;
            try {
              vramEstimate = estimateVram(filePath, config);
            } catch (vramError) {
              console.log("[DEBUG] VRAM estimation failed for", file, ":", vramError.message);
            }

            models.push({
              name: modelName,
              path: filePath,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
              vram: vramEstimate,
              vramFormatted: vramEstimate ? formatBytes(vramEstimate) : null,
            });
          }
          // Recursively scan subdirectories
          else if (stats.isDirectory()) {
            scanDirectory(filePath);
          }
        }
      }

      scanDirectory(modelsDir);

      console.log("[DEBUG] Models found:", models.length);
      const response = { success: true, data: { models, directory: modelsDir } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:available-models:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Start llama-server with a preset file
   */
  socket.on("presets:start-with-preset", async (data, ack) => {
    console.log("[DEBUG] Event: presets:start-with-preset", {
      filename: data.filename,
      options: data.options,
    });
    try {
      const { filename, options } = data;

      // Build full path to preset file
      const presetPath = path.join(PRESETS_DIR, `${filename}.ini`);

      if (!fs.existsSync(presetPath)) {
        const response = {
          success: false,
          error: { message: `Preset file not found: ${filename}` },
        };
        if (typeof ack === "function") ack(response);
        return;
      }

      console.log("[DEBUG] Starting llama-server with preset:", presetPath);
      logger.info(`Starting llama-server with preset: ${filename}`);

      // Start llama-server with preset file
      const result = await startLlamaServerRouter(presetPath, db, {
        ...options,
        usePreset: true, // Flag to use preset mode instead of directory mode
      });

      if (result.success) {
        logger.info(`llama-server started successfully on port ${result.port}`);
        const response = {
          success: true,
          data: {
            port: result.port,
            url: result.url,
            mode: result.mode,
            preset: filename,
          },
        };
        if (typeof ack === "function") ack(response);
      } else {
        logger.error(`Failed to start llama-server: ${result.error}`);
        const response = {
          success: false,
          error: { message: result.error },
        };
        if (typeof ack === "function") ack(response);
      }
    } catch (error) {
      console.error("[DEBUG] Error in presets:start-with-preset:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Stop llama-server
   */
  socket.on("presets:stop-server", async (data, ack) => {
    console.log("[DEBUG] Event: presets:stop-server");
    try {
      const result = await stopLlamaServerRouter();

      if (result.success) {
        logger.info("llama-server stopped successfully");
        const response = { success: true, data: result };
        if (typeof ack === "function") ack(response);
      } else {
        logger.error(`Failed to stop llama-server: ${result.error}`);
        const response = {
          success: false,
          error: { message: result.error },
        };
        if (typeof ack === "function") ack(response);
      }
    } catch (error) {
      console.error("[DEBUG] Error in presets:stop-server:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });
}

// ==================== NEW HELPER FUNCTIONS ====================

/**
 * Estimate VRAM usage for a model file
 */
function estimateVram(modelPath, config) {
  try {
    // Get file size in bytes
    const fileSize = fs.statSync(modelPath).size;

    // VRAM estimation factors:
    // - Base model size: file size
    // - Context overhead: approximately 0.5 bytes per token per parameter
    // - KV cache: approximately 2 bytes per token per layer
    // - Activation memory: approximately 1.5x model size for activations

    const ctxSize = config.ctx_size || 2048;
    const nGpuLayers = config["n-gpu-layers"] || 0;

    // If no GPU layers, no additional VRAM needed beyond model loading
    if (nGpuLayers === 0) {
      return fileSize;
    }

    // Estimate based on model size and layers offloaded
    // Typically VRAM = model_size * offload_ratio + context_overhead
    const offloadRatio = Math.min(nGpuLayers / 32, 1.0); // Assuming max 32 layers typical
    const baseVram = fileSize * offloadRatio;

    // Context overhead (rough estimate)
    // For a 7B model: 7B parameters * 2 bytes * ctx_size / 1000
    const contextOverhead = Math.round(fileSize * ctxSize * 0.0000001);

    // Total VRAM estimate
    const totalVram = Math.round(baseVram + contextOverhead);

    console.log("[DEBUG] VRAM estimate for", modelPath, ":", {
      fileSize: formatBytes(fileSize),
      offloadRatio: Math.round(offloadRatio * 100) + "%",
      contextOverhead: formatBytes(contextOverhead),
      totalVram: formatBytes(totalVram),
    });

    return totalVram;
  } catch (error) {
    console.log("[DEBUG] Error estimating VRAM:", error.message);
    return null;
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get llama.cpp parameters by parsing llama-server --help output
 */
function getLlamaParams(llamaServerPath) {
  const categories = {
    "Model Settings": [],
    Performance: [],
    Sampling: [],
    "Speculative Decoding": [],
    Advanced: [],
    "Server Settings": [],
  };

  try {
    // Try to run llama-server --help
    let helpOutput = "";

    // Check if llama-server exists
    if (!fs.existsSync(llamaServerPath)) {
      console.log("[DEBUG] llama-server not found at:", llamaServerPath);
      // Return default parameters
      return getDefaultLlamaParams();
    }

    try {
      helpOutput = execSync(`"${llamaServerPath}" --help 2>&1`, {
        encoding: "utf-8",
        timeout: 10000,
        maxBuffer: 1024 * 1024,
      });
    } catch (e) {
      // Some llama-server versions don't support --help
      console.log("[DEBUG] llama-server --help failed:", e.message);
      return getDefaultLlamaParams();
    }

    // Parse the help output
    const lines = helpOutput.split("\n");

    // Known parameter patterns for categorization
    const categoryMap = {
      "ctx-size": "Model Settings",
      "ctx-checkpoints": "Model Settings",
      model: "Model Settings",
      "n-gpu-layers": "Model Settings",
      "split-mode": "Model Settings",
      "tensor-split": "Advanced",
      "main-gpu": "Advanced",
      threads: "Performance",
      batch: "Performance",
      ubatch: "Performance",
      "threads-http": "Performance",
      "cache-ram": "Server Settings",
      temp: "Sampling",
      seed: "Sampling",
      samplers: "Sampling",
      mirostat: "Sampling",
      "mirostat-lr": "Sampling",
      "mirostat-ent": "Sampling",
      "top-p": "Sampling",
      "top-k": "Sampling",
      "min-p": "Sampling",
      "typ-p": "Sampling",
      dry: "Sampling",
      xtc: "Sampling",
      "draft-min": "Speculative Decoding",
      "draft-max": "Speculative Decoding",
      "draft-p-min": "Speculative Decoding",
      "load-on-startup": "Server Settings",
      mmp: "Server Settings",
    };

    // Parse parameters from help output
    const paramRegex = /(--[\w-]+)\s+(.*)/g;
    let match;

    while ((match = paramRegex.exec(helpOutput)) !== null) {
      const paramName = match[1];
      const description = match[2].trim();

      // Skip non-parameter lines
      if (paramName.startsWith("-") && !paramName.startsWith("--")) continue;
      if (paramName.includes("...")) continue;

      const category = categoryMap[paramName.replace("--", "")] || "Advanced";

      // Extract type and default if available
      let type = "string";
      let defaultValue = "";
      let valueDesc = "";

      // Try to extract type info from description
      const typeMatch = description.match(/\[(.*?)\]/);
      if (typeMatch) {
        valueDesc = typeMatch[1];
        if (valueDesc.includes("int")) type = "int";
        else if (valueDesc.includes("float")) type = "float";
        else if (valueDesc.includes("bool")) type = "bool";
        else if (valueDesc.includes("str")) type = "string";
      }

      // Try to extract default
      const defaultMatch = description.match(/default:\s*(\S+)/);
      if (defaultMatch) {
        defaultValue = defaultMatch[1];
      }

      categories[category].push({
        name: paramName.replace("--", ""),
        fullName: paramName,
        type,
        default: defaultValue,
        description: description
          .replace(/\[.*?\]/, "")
          .replace(/default:\s*\S+/, "")
          .trim(),
      });
    }
  } catch (error) {
    console.error("[DEBUG] Error parsing llama params:", error.message);
    return getDefaultLlamaParams();
  }

  // Filter empty categories
  for (const key of Object.keys(categories)) {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  }

  return categories;
}

/**
 * Get default llama parameters (fallback when llama-server --help fails)
 */
function getDefaultLlamaParams() {
  return {
    "Model Settings": [
      { name: "model", type: "string", default: "", description: "Model file path" },
      { name: "ctx-size", type: "int", default: "2048", description: "Context window size" },
      {
        name: "ctx-checkpoints",
        type: "int",
        default: "8",
        description: "Number of context checkpoints",
      },
      {
        name: "n-gpu-layers",
        type: "int",
        default: "0",
        description: "Number of layers to offload to GPU",
      },
      {
        name: "split-mode",
        type: "string",
        default: "none",
        description: "Split mode for multi-GPU",
      },
    ],
    Performance: [
      { name: "threads", type: "int", default: "0", description: "Number of threads (0 = auto)" },
      { name: "batch", type: "int", default: "512", description: "Maximum batch size" },
      { name: "ubatch", type: "int", default: "512", description: "Maximum micro batch size" },
      { name: "threads-http", type: "int", default: "1", description: "Number of HTTP threads" },
    ],
    Sampling: [
      { name: "temp", type: "float", default: "0.7", description: "Sampling temperature" },
      { name: "top-p", type: "float", default: "0.9", description: "Top-p sampling threshold" },
      { name: "top-k", type: "int", default: "40", description: "Top-k sampling threshold" },
      {
        name: "min-p",
        type: "float",
        default: "0.0",
        description: "Minimum probability threshold",
      },
      { name: "seed", type: "int", default: "-1", description: "Random seed (-1 = random)" },
      {
        name: "mirostat",
        type: "int",
        default: "0",
        description: "Mirostat sampling (0=disabled, 1=v1, 2=v2)",
      },
      { name: "mirostat-lr", type: "float", default: "0.1", description: "Mirostat learning rate" },
      {
        name: "mirostat-ent",
        type: "float",
        default: "5.0",
        description: "Mirostat target entropy",
      },
    ],
    "Speculative Decoding": [
      { name: "draft-min", type: "int", default: "5", description: "Minimum draft tokens" },
      { name: "draft-max", type: "int", default: "10", description: "Maximum draft tokens" },
      {
        name: "draft-p-min",
        type: "float",
        default: "0.8",
        description: "Minimum draft probability threshold",
      },
    ],
    Advanced: [
      {
        name: "tensor-split",
        type: "string",
        default: "",
        description: "Tensor split ratio for multi-GPU",
      },
      { name: "main-gpu", type: "int", default: "0", description: "Main GPU to use" },
    ],
    "Server Settings": [
      { name: "cache-ram", type: "int", default: "8192", description: "RAM cache size in MB" },
      {
        name: "load-on-startup",
        type: "bool",
        default: "false",
        description: "Load model on startup",
      },
      { name: "mmp", type: "string", default: "", description: "Model memory pointer" },
    ],
  };
}

/**
 * Validate complete config before save
 */
function validateCompleteConfig(config) {
  const errors = [];
  const warnings = [];

  try {
    // Validate config is an object
    if (!config || typeof config !== "object") {
      errors.push("Config must be a valid object");
      return { valid: false, errors, warnings };
    }

    // Validate each section
    for (const [section, params] of Object.entries(config)) {
      if (section === "LLAMA_CONFIG_VERSION") continue;

      // Check for model parameter
      if (!params.model) {
        errors.push(`[${section}]: Missing required 'model' parameter`);
      }

      // Validate numeric ranges
      const numericParams = [
        { key: "ctx-size", min: 1, max: 131072, name: "Context size" },
        { key: "n-gpu-layers", min: 0, max: 1000, name: "GPU layers" },
        { key: "threads", min: 1, max: 256, name: "Threads" },
        { key: "batch", min: 1, max: 8192, name: "Batch size" },
        { key: "ubatch", min: 1, max: 8192, name: "Micro batch size" },
        { key: "main-gpu", min: 0, max: 16, name: "Main GPU" },
      ];

      for (const { key, min, max, name } of numericParams) {
        if (params[key] !== undefined) {
          const value = parseInt(params[key]);
          if (isNaN(value)) {
            errors.push(`[${section}]: Invalid ${name} value: ${params[key]}`);
          } else if (value < min || value > max) {
            errors.push(`[${section}]: ${name} must be between ${min} and ${max}, got ${value}`);
          }
        }
      }

      // Validate temperature
      if (params.temp !== undefined) {
        const value = parseFloat(params.temp);
        if (isNaN(value)) {
          errors.push(`[${section}]: Invalid temperature value: ${params.temp}`);
        } else if (value < 0 || value > 2.0) {
          warnings.push(`[${section}]: Temperature ${value} is outside typical range (0-2)`);
        }
      }

      // Validate split-mode
      if (params["split-mode"] !== undefined) {
        const validModes = ["none", "layer", "row"];
        if (!validModes.includes(params["split-mode"])) {
          errors.push(
            `[${section}]: Invalid split-mode: ${params["split-mode"]}. Valid: ${validModes.join(", ")}`
          );
        }
      }

      // Check for conflicting parameters
      if (params["n-gpu-layers"] > 0 && params["tensor-split"] && !params["main-gpu"]) {
        warnings.push(
          `[${section}]: tensor-split is set but main-gpu is 0. This may cause issues.`
        );
      }
    }

    // Check for missing defaults section
    if (!config["*"]) {
      warnings.push("No default section (*) found. Consider adding one for global defaults.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error.message}`],
      warnings: [],
    };
  }
}

/**
 * Calculate final config for a model with inheritance
 */
function calculateInheritance(filename, modelName) {
  try {
    const { parsed } = readPreset(filename);

    // Get global defaults from "*" section
    const globalDefaults = parsed["*"] || {};

    // Get group defaults (if model belongs to a group)
    let groupDefaults = {};
    if (modelName.includes(":")) {
      const groupName = modelName.split(":")[0];
      groupDefaults = parsed[groupName] || {};
    }

    // Get model-specific config
    const modelConfig = parsed[modelName] || {};

    // Merge order: model ← group ← global ← defaults
    const fullDefaults = getDefaultParameters();
    const mergedDefaults = { ...fullDefaults, ...globalDefaults, ...groupDefaults };
    const finalConfig = { ...mergedDefaults, ...modelConfig };

    // Determine source of each parameter
    const sources = {};
    const modelParams = [
      "model",
      "ctx-size",
      "temp",
      "n-gpu-layers",
      "threads",
      "batch",
      "ubatch",
      "split-mode",
      "main-gpu",
      "seed",
      "load-on-startup",
    ];

    for (const param of modelParams) {
      const iniKey = param.replace(/([A-Z])/g, "-$1").toLowerCase();
      const finalKey = param.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

      if (modelConfig[iniKey] !== undefined) {
        sources[finalKey] = "model";
      } else if (Object.keys(groupDefaults).length > 0 && groupDefaults[iniKey] !== undefined) {
        sources[finalKey] = "group";
      } else if (Object.keys(globalDefaults).length > 0 && globalDefaults[iniKey] !== undefined) {
        sources[finalKey] = "global";
      } else {
        sources[finalKey] = "default";
      }
    }

    // Convert final config to model object format
    const finalConfigModel = {
      model: finalConfig.model || "",
      ctxSize: finalConfig["ctx-size"]
        ? parseInt(finalConfig["ctx-size"])
        : fullDefaults["ctx-size"],
      temperature: finalConfig.temp ? parseFloat(finalConfig.temp) : fullDefaults.temp,
      nGpuLayers: finalConfig["n-gpu-layers"]
        ? parseInt(finalConfig["n-gpu-layers"])
        : fullDefaults["n-gpu-layers"],
      threads: finalConfig.threads ? parseInt(finalConfig.threads) : fullDefaults.threads,
      batchSize: finalConfig.batch ? parseInt(finalConfig.batch) : fullDefaults.batch,
      ubatchSize: finalConfig.ubatch ? parseInt(finalConfig.ubatch) : fullDefaults.ubatch,
      splitMode: finalConfig["split-mode"] || fullDefaults["split-mode"] || "none",
      mainGpu: finalConfig["main-gpu"]
        ? parseInt(finalConfig["main-gpu"])
        : fullDefaults["main-gpu"],
      seed: finalConfig.seed ? parseInt(finalConfig.seed) : fullDefaults.seed,
      loadOnStartup: finalConfig["load-on-startup"]
        ? finalConfig["load-on-startup"].toLowerCase() === "true"
        : fullDefaults["load-on-startup"],
    };

    console.log("[DEBUG] Inheritance calculated:", {
      filename,
      modelName,
      finalConfig: finalConfigModel,
      sources,
    });

    return {
      finalConfig: finalConfigModel,
      sources,
      inheritancePath: ["default", "global", "group", "model"].filter((s) => {
        if (s === "default") return true;
        if (s === "global") return Object.keys(globalDefaults).length > 0;
        if (s === "group") return Object.keys(groupDefaults).length > 0;
        if (s === "model") return Object.keys(modelConfig).length > 0;
        return false;
      }),
    };
  } catch (error) {
    throw new Error(`Failed to calculate inheritance: ${error.message}`);
  }
}
