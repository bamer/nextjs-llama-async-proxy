/**
 * Preset Configuration Service
 * Handles communication with backend for INI file management
 * All communication goes through Socket.IO
 */

class PresetsService {
  constructor(socket) {
    this.socket = socket;
  }

  /**
   * List all preset files
   * @returns {Promise<Array>} Array of preset objects
   */
  listPresets() {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: listPresets");
      // Use callback pattern (ack) - backend responds via callback
      this.socket.emit("presets:list", {}, (response) => {
        console.log("[DEBUG] PresetsService: listPresets response:", response);
        if (response && response.success) {
          resolve(response.data?.presets || []);
        } else {
          reject(new Error(response?.error?.message || "Unknown error"));
        }
      });
    });
  }

  /**
   * Read preset file
   * @param {string} filename - Preset filename (without .ini extension)
   * @returns {Promise<Object>} Preset content and parsed data
   */
  readPreset(filename) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: readPreset", { filename });
      this.socket.emit("presets:read", { filename }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Save preset file
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Save result
   */
  savePreset(filename, config) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: savePreset", { filename });
      this.socket.emit("presets:save", { filename, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Create new preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {string} [description] - Optional description
   * @returns {Promise<Object>} Creation result
   */
  createPreset(filename, description = "") {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: createPreset", { filename });
      this.socket.emit("presets:create", { filename, description }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Delete preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @returns {Promise<Object>} Deletion result
   */
  deletePreset(filename) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: deletePreset", { filename });
      this.socket.emit("presets:delete", { filename }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Validate INI syntax
   * @param {string} content - INI file content
   * @returns {Promise<Object>} Validation result with errors array
   */
  validateIni(content) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: validateIni");
      this.socket.emit("presets:validate", { content }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Get all models from preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @returns {Promise<Object>} Models object with model configs
   */
  getModelsFromPreset(filename) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: getModelsFromPreset", { filename });
      // Server uses ack callback pattern
      this.socket.emit("presets:get-models", { filename }, (response) => {
        console.log("[DEBUG] PresetsService: getModelsFromPreset response:", response);
        if (response.success) {
          resolve(response.data?.models || {});
        } else {
          reject(new Error(response.error?.message || "Unknown error"));
        }
      });
    });
  }

  /**
   * Add model to preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {string} modelName - Model name/section
   * @param {Object} config - Model configuration
   * @returns {Promise<Object>} Result with updated config
   */
  addModel(filename, modelName, config) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: addModel", { filename, modelName });
      this.socket.emit("presets:add-model", { filename, modelName, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Update model in preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {string} modelName - Model name/section
   * @param {Object} config - Model configuration
   * @returns {Promise<Object>} Result with updated config
   */
  updateModel(filename, modelName, config) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: updateModel", { filename, modelName });
      this.socket.emit("presets:update-model", { filename, modelName, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Remove model from preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {string} modelName - Model name/section
   * @returns {Promise<Object>} Result with removed model info
   */
  removeModel(filename, modelName) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: removeModel", { filename, modelName });
      this.socket.emit("presets:remove-model", { filename, modelName }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Get default parameters from "*" preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @returns {Promise<Object>} Default configuration parameters
   */
  getDefaults(filename) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: getDefaults", { filename });
      // Server uses ack callback pattern
      this.socket.emit("presets:get-defaults", { filename }, (response) => {
        console.log("[DEBUG] PresetsService: getDefaults response:", response);
        if (response.success) {
          resolve(response.data?.defaults || {});
        } else {
          reject(new Error(response.error?.message || "Unknown error"));
        }
      });
    });
  }

  /**
   * Update default parameters in "*" preset
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {Object} config - Default configuration
   * @returns {Promise<Object>} Updated defaults
   */
  updateDefaults(filename, config) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: updateDefaults", { filename });
      this.socket.emit("presets:update-defaults", { filename, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Get available models from baseModelsPath
   * @returns {Promise<Array>} Array of model objects with name, path, size, vram
   */
  getAvailableModels() {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: getAvailableModels");
      this.socket.emit("presets:available-models", {}, (response) => {
        if (response.success) {
          resolve(response.data.models);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Get all parameters from llama-server --help
   * @returns {Promise<Object>} Parameters organized by category
   */
  getLlamaParameters() {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: getLlamaParameters");
      this.socket.emit("presets:get-llama-params", {}, (response) => {
        if (response.success) {
          resolve(response.data.parameters);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Validate a complete configuration
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {Object} config - Full configuration object to validate
   * @returns {Promise<Object>} Validation result with valid, errors, warnings
   */
  validateConfig(filename, config) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: validateConfig", { filename });
      this.socket.emit("presets:validate-config", { filename, config }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Get merged config showing inheritance from defaults
   * @param {string} filename - Preset filename (without .ini extension)
   * @param {string} modelName - Specific model name to get inheritance for
   * @returns {Promise<Object>} Result with finalConfig and sources
   */
  getInheritance(filename, modelName) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: getInheritance", { filename, modelName });
      this.socket.emit("presets:show-inheritance", { filename, modelName }, (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Estimate VRAM usage for a model
   * @param {string} modelPath - Path to the model file
   * @returns {Promise<number>} Estimated VRAM usage in bytes
   */
  estimateVram(modelPath) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: estimateVram", { modelPath });
      this.socket.emit("presets:estimate-vram", { modelPath }, (response) => {
        if (response.success) {
          resolve(response.data.vram);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Import configuration from a running model
   * @param {string} modelId - Running model identifier
   * @returns {Promise<Object>} Imported configuration object
   */
  importFromModel(modelId) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: importFromModel", { modelId });
      this.socket.emit("presets:import-model", { modelId }, (response) => {
        if (response.success) {
          resolve(response.data.config);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Duplicate a preset file with a new name
   * @param {string} sourceName - Source preset filename (without .ini extension)
   * @param {string} targetName - Target preset filename (without .ini extension)
   * @returns {Promise<void>} Resolves when complete
   */
  duplicatePreset(sourceName, targetName) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: duplicatePreset", { sourceName, targetName });
      this.socket.emit("presets:duplicate", { sourceName, targetName }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }

  /**
   * Export preset as raw INI content
   * @param {string} filename - Preset filename (without .ini extension)
   * @returns {Promise<string>} Raw INI file content
   */
  exportPreset(filename) {
    return new Promise((resolve, reject) => {
      console.log("[DEBUG] PresetsService: exportPreset", { filename });
      this.socket.emit("presets:export", { filename }, (response) => {
        if (response.success) {
          resolve(response.data.content);
        } else {
          reject(new Error(response.error.message));
        }
      });
    });
  }
}

window.PresetsService = PresetsService;
