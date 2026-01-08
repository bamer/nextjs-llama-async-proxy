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
      this.socket.emit("presets:list", {}, (response) => {
        if (response.success) {
          resolve(response.data.presets);
        } else {
          reject(new Error(response.error.message));
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
      this.socket.emit("presets:get-models", { filename }, (response) => {
        if (response.success) {
          resolve(response.data.models);
        } else {
          reject(new Error(response.error.message));
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
      this.socket.emit(
        "presets:add-model",
        { filename, modelName, config },
        (response) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error.message));
          }
        }
      );
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
      this.socket.emit(
        "presets:update-model",
        { filename, modelName, config },
        (response) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error.message));
          }
        }
      );
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
      this.socket.emit("presets:get-defaults", { filename }, (response) => {
        if (response.success) {
          resolve(response.data.defaults);
        } else {
          reject(new Error(response.error.message));
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
      this.socket.emit(
        "presets:update-defaults",
        { filename, config },
        (response) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error.message));
          }
        }
      );
    });
  }
}

window.PresetsService = PresetsService;
