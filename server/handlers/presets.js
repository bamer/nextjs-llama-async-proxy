/**
 * Socket.IO Handlers for .INI Configuration Presets
 * Manages llama.cpp router mode model configurations
 */

import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

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
 * Generate INI file content
 */
function generateIni(config) {
  let content = "LLAMA_CONFIG_VERSION = 1\n\n";

  for (const [section, params] of Object.entries(config)) {
    if (section === "LLAMA_CONFIG_VERSION") continue;
    content += `[${section}]\n`;
    for (const [key, value] of Object.entries(params)) {
      content += `${key} = ${value}\n`;
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
    "samplers": "penalties;dry;top_n_sigma;top_k;typ_p;top_p;min_p;xtc;temperature",
    "mirostat": 0,
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
    "mmp": null,
  };
}

/**
 * Convert model config object to INI format
 */
function modelToIniSection(modelName, config) {
  const section = {
    model: config.model || "",
  };

  // Map common parameters
  if (config.ctxSize) section["ctx-size"] = String(config.ctxSize);
  if (config.temperature !== undefined) section["temp"] = String(config.temperature);
  if (config.nGpuLayers !== undefined) section["n-gpu-layers"] = String(config.nGpuLayers);
  if (config.threads !== undefined) section["threads"] = String(config.threads);
  if (config.batchSize !== undefined) section["batch"] = String(config.batchSize);
  if (config.ubatchSize !== undefined) section["ubatch"] = String(config.ubatchSize);
  if (config.tensorSplit) section["tensor-split"] = config.tensorSplit;
  if (config.splitMode) section["split-mode"] = config.splitMode;
  if (config.mainGpu !== undefined) section["main-gpu"] = String(config.mainGpu);
  if (config.mmp) section["mmp"] = config.mmp;
  if (config.seed !== undefined) section["seed"] = String(config.seed);
  if (config.loadOnStartup !== undefined) section["load-on-startup"] = String(config.loadOnStartup);

  return section;
}

/**
 * Convert INI section to model config object with inheritance from defaults
 */
function iniSectionToModel(section, defaultsSection = {}) {
  const fullDefaults = getDefaultParameters();
  const mergedDefaults = { ...fullDefaults, ...defaultsSection };

  return {
    model: section.model || mergedDefaults.model || "",
    ctxSize: section["ctx-size"]
      ? parseInt(section["ctx-size"])
      : mergedDefaults["ctx-size"],
    temperature: section.temp
      ? parseFloat(section.temp)
      : mergedDefaults.temp,
    nGpuLayers: section["n-gpu-layers"]
      ? parseInt(section["n-gpu-layers"])
      : mergedDefaults["n-gpu-layers"],
    threads: section.threads ? parseInt(section.threads) : mergedDefaults.threads,
    batchSize: section.batch ? parseInt(section.batch) : mergedDefaults.batch,
    ubatchSize: section.ubatch ? parseInt(section.ubatch) : mergedDefaults.ubatch,
    tensorSplit: section["tensor-split"] || mergedDefaults["tensor-split"] || null,
    splitMode: section["split-mode"] || mergedDefaults["split-mode"] || "none",
    mainGpu: section["main-gpu"]
      ? parseInt(section["main-gpu"])
      : mergedDefaults["main-gpu"],
    mmp: section.mmp || mergedDefaults.mmp || null,
    seed: section.seed ? parseInt(section.seed) : mergedDefaults.seed,
    loadOnStartup: section["load-on-startup"]
      ? section["load-on-startup"].toLowerCase() === "true"
      : mergedDefaults["load-on-startup"],
  };
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

    if (!fs.existsSync(filepath)) {
      throw new Error(`Preset file not found: ${filename}`);
    }

    const content = fs.readFileSync(filepath, "utf-8");
    const parsed = parseIni(content);

    console.log("[DEBUG] Preset read:", { filename, sections: Object.keys(parsed) });

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

    console.log("[DEBUG] Models loaded from preset:", {
      filename,
      count: Object.keys(models).length,
      hasDefaults: Boolean(defaultsSection),
    });

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
 */
function updateModelInPreset(filename, modelName, config) {
  try {
    const preset = readPreset(filename);
    const iniSection = modelToIniSection(modelName, config);

    preset.parsed[modelName] = iniSection;
    savePreset(filename, preset.parsed);

    console.log("[DEBUG] Model updated in preset:", { filename, modelName });
    logger.info(`Model updated in preset: ${filename}/${modelName}`);

    return {
      filename,
      modelName,
      config: iniSectionToModel(iniSection),
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

  socket.on("presets:list", async (data, ack) => {
    console.log("[DEBUG] Event: presets:list");
    try {
      const presets = listPresets();
      const response = { success: true, data: { presets } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:list:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
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
    console.log("[DEBUG] Event: presets:add-model", { filename: data.filename, model: data.modelName });
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
    console.log("[DEBUG] Event: presets:update-model", { filename: data.filename, model: data.modelName });
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
    console.log("[DEBUG] Event: presets:remove-model", { filename: data.filename, model: data.modelName });
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
      const iniSection = modelToIniSection("*", config);

      preset.parsed["*"] = iniSection;
      savePreset(filename, preset.parsed);

      console.log("[DEBUG] Preset defaults updated:", { filename });
      logger.info(`Preset defaults updated: ${filename}`);

      const response = {
        success: true,
        data: {
          filename,
          defaults: iniSectionToModel(iniSection, {}),
        },
      };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:update-defaults:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });
}
