/**
 * Presets Handlers
 * Socket.IO event handlers for preset operations
 * Split from presets.js to follow AGENTS.md 200-line rule
 */

import { logger } from "../logger.js";
import {
  listPresets,
  readPreset,
  savePreset,
  deletePreset,
  getModelsFromPreset,
  validateIni,
  updateModelInPreset,
  removeModelFromPreset,
  getPresetsDefaults,
  getDefaultParameters,
  getDefaultConfig,
  iniSectionToModel,
  modelToIniSection,
} from "./utils.js";

/**
 * Register all presets handlers
 */
export function registerPresetsHandlers(socket, db) {
  /**
   * List all presets
   */
  socket.on("presets:list", (data, ack) => {
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

  /**
   * Read preset content
   */
  socket.on("presets:read", (data, ack) => {
    console.log("[DEBUG] Event: presets:read", { filename: data.filename });
    try {
      const { filename } = data;
      const preset = readPreset(filename);
      const response = { success: true, data: { preset } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:read:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Get models from preset
   */
  socket.on("presets:get-models", (data, ack) => {
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

  /**
   * Save preset
   */
  socket.on("presets:save", (data, ack) => {
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

  /**
   * Create preset
   */
  socket.on("presets:create", (data, ack) => {
    console.log("[DEBUG] Event: presets:create", { filename: data.filename });
    try {
      const { filename, description } = data;
      const config = getDefaultConfig();
      const result = savePreset(filename, config);
      const response = { success: true, data: result };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:create:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Delete preset
   */
  socket.on("presets:delete", (data, ack) => {
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

  /**
   * Validate INI content
   */
  socket.on("presets:validate", (data, ack) => {
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

  /**
   * Add model to preset
   */
  socket.on("presets:add-model", (data, ack) => {
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

  /**
   * Update model in preset
   */
  socket.on("presets:update-model", (data, ack) => {
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

  /**
   * Remove model from preset
   */
  socket.on("presets:remove-model", (data, ack) => {
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

  /**
   * Get defaults for preset
   */
  socket.on("presets:get-defaults", (data, ack) => {
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

  /**
   * Update defaults in preset
   */
  socket.on("presets:update-defaults", (data, ack) => {
    console.log("[DEBUG] Event: presets:update-defaults", { filename: data.filename });
    try {
      const { filename, config } = data;
      const preset = readPreset(filename);
      const existingSection = preset.parsed["*"] || {};

      const mergedSection = { ...existingSection };
      const newIniSection = modelToIniSection("*", config);
      Object.assign(mergedSection, newIniSection);

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

  /**
   * Get models directory
   */
  socket.on("presets:get-models-dir", (data, ack) => {
    console.log("[DEBUG] Event: presets:get-models-dir");
    try {
      const config = db.getConfig();
      const modelsDir = config.baseModelsPath || path.join(process.cwd(), "models");

      console.log("[DEBUG] Scanning models directory:", modelsDir);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-models-dir:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });

  /**
   * Get default parameters
   */
  socket.on("presets:get-default-params", (data, ack) => {
    console.log("[DEBUG] Event: presets:get-default-params");
    try {
      const defaults = getDefaultParameters();
      const response = { success: true, data: { defaults } };
      if (typeof ack === "function") ack(response);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-default-params:", error.message);
      const response = { success: false, error: { message: error.message } };
      if (typeof ack === "function") ack(response);
    }
  });
}
