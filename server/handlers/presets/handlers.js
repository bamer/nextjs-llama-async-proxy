/**
 * Presets Handlers
 * Socket.IO event handlers for preset operations
 * Split from presets.js to follow AGENTS.md 200-line rule
 * Uses async utility functions for non-blocking I/O
 */

import path from "path";
import { logger } from "../logger.js";
import { ok, err } from "../response.js";
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

const PRESETS_DIR = "config";

/**
 * Register all Socket.IO event handlers for preset operations.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
 */
export function registerPresetsHandlers(socket, db) {
  /**
   * List all presets
   */
  socket.on("presets:list", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:list received, requestId:", id);
    try {
      const presets = await listPresets();
      console.log("[DEBUG] Presets found:", presets);
      // Return array of preset objects with parameters
      const presetsData = await Promise.all(presets.map(async (name) => {
        const preset = await readPreset(name);  // name is already without .ini
        return {
          name,
          path: `${name}.ini`,
          file: `${PRESETS_DIR}/${name}.ini`,
          parameters: preset.parsed || {},
          raw: preset.content || "",
        };
      }));
      console.log("[DEBUG] Sending presets response:", { count: presetsData.length, data: presetsData });
      ok(socket, "presets:list:result", { presets: presetsData }, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:list:", error.message, error.stack);
      err(socket, "presets:list:result", error.message, id, ack);
    }
  });

  /**
   * Read preset content
   */
  socket.on("presets:read", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:read", { filename: req.filename, requestId: id });
    try {
      const { filename } = req;
      const preset = await readPreset(filename);
      ok(socket, "presets:read:result", { preset }, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:read:", error.message);
      err(socket, "presets:read:result", error.message, id, ack);
    }
  });

  /**
   * Get models from preset
   */
  socket.on("presets:get-models", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:get-models", { filename: req.filename, requestId: id });
    try {
      const { filename } = req;
      const models = await getModelsFromPreset(filename);
      ok(socket, "presets:get-models:result", { models }, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-models:", error.message);
      err(socket, "presets:get-models:result", error.message, id, ack);
    }
  });

  /**
   * Save preset with raw INI content
   */
  socket.on("presets:save-raw", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:save-raw", { filename: req.filename, requestId: id });
    try {
      const { filename, content } = req;
      if (!content) {
        err(socket, "presets:save-raw:result", "No content provided", id, ack);
        return;
      }
      
      const presetsDir = await ensurePresetsDir();
      const filepath = path.join(presetsDir, `${filename}.ini`);
      await fs.writeFile(filepath, content, "utf-8");

      console.log(`[DEBUG] Preset saved: ${filepath}`);
      ok(socket, "presets:save-raw:result", {
        filename,
        path: filepath,
        size: content.length,
        lastModified: new Date(),
      }, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:save-raw:", error.message);
      err(socket, "presets:save-raw:result", error.message, id, ack);
    }
  });

  /**
   * Save preset
   */
  socket.on("presets:save", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:save", { filename: req.filename, requestId: id });
    try {
      const { filename, config } = req;
      const result = await savePreset(filename, config);
      ok(socket, "presets:save:result", result, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:save:", error.message);
      err(socket, "presets:save:result", error.message, id, ack);
    }
  });

  /**
   * Create preset
   */
  socket.on("presets:create", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:create", { filename: req.filename, requestId: id });
    try {
      const { filename, description } = req;
      const config = getDefaultConfig();
      const result = await savePreset(filename, config);
      ok(socket, "presets:create:result", result, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:create:", error.message);
      err(socket, "presets:create:result", error.message, id, ack);
    }
  });

  /**
   * Delete preset
   */
  socket.on("presets:delete", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:delete", { filename: req.filename, requestId: id });
    try {
      const { filename } = req;
      const result = await deletePreset(filename);
      ok(socket, "presets:delete:result", result, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:delete:", error.message);
      err(socket, "presets:delete:result", error.message, id, ack);
    }
  });

  /**
   * Validate INI content
   */
  socket.on("presets:validate", (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:validate", { requestId: id });
    try {
      const { content } = req;
      const validation = validateIni(content);
      ok(socket, "presets:validate:result", validation, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:validate:", error.message);
      err(socket, "presets:validate:result", error.message, id, ack);
    }
  });

  /**
   * Add model to preset
   */
  socket.on("presets:add-model", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:add-model", { filename: req.filename, model: req.modelName, requestId: id });
    try {
      const { filename, modelName, config } = req;
      const result = await updateModelInPreset(filename, modelName, config);
      ok(socket, "presets:add-model:result", result, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:add-model:", error.message);
      err(socket, "presets:add-model:result", error.message, id, ack);
    }
  });

  /**
   * Update model in preset
   */
  socket.on("presets:update-model", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:update-model", { filename: req.filename, model: req.modelName, requestId: id });
    try {
      const { filename, modelName, config } = req;
      const result = await updateModelInPreset(filename, modelName, config);
      ok(socket, "presets:update-model:result", result, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:update-model:", error.message);
      err(socket, "presets:update-model:result", error.message, id, ack);
    }
  });

  /**
   * Remove model from preset
   */
  socket.on("presets:remove-model", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:remove-model", { filename: req.filename, model: req.modelName, requestId: id });
    try {
      const { filename, modelName } = req;
      const result = await removeModelFromPreset(filename, modelName);
      ok(socket, "presets:remove-model:result", result, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:remove-model:", error.message);
      err(socket, "presets:remove-model:result", error.message, id, ack);
    }
  });

  /**
   * Get defaults for preset
   */
  socket.on("presets:get-defaults", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:get-defaults", { filename: req.filename, requestId: id });
    try {
      const { filename } = req;
      const defaults = await getPresetsDefaults(filename);
      ok(socket, "presets:get-defaults:result", { defaults }, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-defaults:", error.message);
      err(socket, "presets:get-defaults:result", error.message, id, ack);
    }
  });

  /**
   * Update defaults in preset
   */
  socket.on("presets:update-defaults", async (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:update-defaults", { filename: req.filename, requestId: id });
    try {
      const { filename, config } = req;
      const preset = await readPreset(filename);
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
      await savePreset(filename, preset.parsed);

      console.log("[DEBUG] Preset defaults updated:", { filename });
      logger.info(`Preset defaults updated: ${filename}`);

      const result = {
        filename,
        defaults: iniSectionToModel(mergedSection, {}),
      };
      ok(socket, "presets:update-defaults:result", result, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:update-defaults:", error.message);
      err(socket, "presets:update-defaults:result", error.message, id, ack);
    }
  });

  /**
   * Get models directory
   */
  socket.on("presets:get-models-dir", (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:get-models-dir", { requestId: id });
    try {
      const config = db.getConfig();
      const modelsDir = config.baseModelsPath || path.join(process.cwd(), "models");

      console.log("[DEBUG] Scanning models directory:", modelsDir);
      ok(socket, "presets:get-models-dir:result", { modelsDir }, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-models-dir:", error.message);
      err(socket, "presets:get-models-dir:result", error.message, id, ack);
    }
  });

  /**
   * Get default parameters
   */
  socket.on("presets:get-default-params", (req, ack) => {
    const id = req?.requestId || Date.now();
    console.log("[DEBUG] Event: presets:get-default-params", { requestId: id });
    try {
      const defaults = getDefaultParameters();
      ok(socket, "presets:get-default-params:result", { defaults }, id, ack);
    } catch (error) {
      console.error("[DEBUG] Error in presets:get-default-params:", error.message);
      err(socket, "presets:get-default-params:result", error.message, id, ack);
    }
  });
}
