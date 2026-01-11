/**
 * State Models Module - Model-specific operations
 */

class StateModels {
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;
    // Use unified cache service
    this._cache = CacheService.getCache("stateModels", { ttl: 30000, maxSize: 50 });
  }

  /**
   * Get cached value or fetch new data
   * @private
   */
  async _cachedRequest(key, fetchFn, ...args) {
    const cacheKey = CacheInstance.makeKey(key, ...args);
    return this._cache.getOrFetch(cacheKey, () => fetchFn(...args));
  }

  /**
   * Invalidate cache entries matching key pattern
   * @param {string} pattern - Key pattern to match (e.g., "getModels")
   */
  invalidateCache(pattern) {
    const keysToDelete = [];
    for (const key of this._cache._cache.keys()) {
      if (!pattern || key.startsWith(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((k) => this._cache.delete(k));
    console.log("[DEBUG] Cache invalidated:", { pattern, count: keysToDelete.length });
  }

  /**
   * Update model with status
   * @param {string} id - Model ID
   * @param {string} status - New status
   * @param {Object} model - Additional model data
   */
  _updateModel(id, status, model) {
    const list = this.core.get("models") || [];
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      // Create a new array with the updated model (don't mutate directly)
      const updatedList = [...list];
      updatedList[idx] = { ...list[idx], status, ...model };
      this.core.set("models", updatedList);
    }
  }

  /**
   * Add a new model
   * @param {Object} m - Model to add
   */
  _addModel(m) {
    const currentModels = this.core.get("models") || [];
    this.core.set("models", [...currentModels, m]);
  }

  /**
   * Update model data
   * @param {Object} m - Model with updates
   */
  _updateModelData(m) {
    const list = (this.core.get("models") || []).map((x) => (x.id === m.id ? m : x));
    this.core.set("models", list);
  }

  /**
   * Remove a model
   * @param {string} id - Model ID to remove
   */
  _removeModel(id) {
    const list = (this.core.get("models") || []).filter((m) => m.id !== id);
    this.core.set("models", list);
  }

  /**
   * Refresh models from server
   */
  async refreshModels() {
    try {
      const data = await this.socket.request("models:list");
      this.core.set("models", data.models || []);
      return data;
    } catch (e) {
      console.error("[STATE-MODELS] refreshModels() error:", e.message);
      throw e;
    }
  }

  /**
   * Get all models
   * @returns {Promise<Array>} List of models
   */
  async getModels() {
    return this._cachedRequest("getModels", () => this.socket.request("models:list"));
  }

  /**
   * Get a specific model
   * @param {string} id - Model ID
   * @returns {Promise<Object>} Model data
   */
  async getModel(id) {
    return this.socket.request("models:get", { modelId: id });
  }

  /**
   * Create a new model
   * @param {Object} m - Model data
   * @returns {Promise<Object>} Created model
   */
  async createModel(m) {
    return this.socket.request("models:create", { model: m });
  }

  /**
   * Update a model
   * @param {string} id - Model ID
   * @param {Object} u - Updates
   * @returns {Promise<Object>} Updated model
   */
  async updateModel(id, u) {
    return this.socket.request("models:update", { modelId: id, updates: u });
  }

  /**
   * Delete a model
   * @param {string} id - Model ID
   * @returns {Promise<void>} Deletion result
   */
  async deleteModel(id) {
    return this.socket.request("models:delete", { modelId: id });
  }

  /**
   * Start/Load a model
   * @param {string} id - Model ID
   * @returns {Promise<Object>} Result
   */
  async startModel(id) {
    const model = this.core.getState().models.find((m) => m.id === id);
    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }
    return this.socket.request("models:load", { modelName: model.name });
  }

  /**
   * Load a model by name
   * @param {string} modelName - Model name
   * @returns {Promise<Object>} Result
   */
  async loadModel(modelName) {
    return this.socket.request("models:load", { modelName });
  }

  /**
   * Unload a model
   * @param {string} modelName - Model name
   * @returns {Promise<Object>} Result
   */
  async unloadModel(modelName) {
    return this.socket.request("models:unload", { modelName });
  }

  /**
   * Stop a model
   * @param {string} id - Model ID
   * @returns {Promise<Object>} Result
   */
  async stopModel(id) {
    const model = this.core.getState().models.find((m) => m.id === id);
    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }
    return this.socket.request("models:unload", { modelName: model.name });
  }

  /**
   * Scan for models
   * @returns {Promise<Object>} Scan result
   */
  async scanModels() {
    return this.socket.request("models:scan");
  }

  /**
   * Cleanup models
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupModels() {
    return this.socket.request("models:cleanup");
  }

  /**
   * Toggle favorite status
   * @param {string} modelName - Model name
   * @param {boolean} favorite - Favorite status
   * @returns {Promise<Object>} Result
   */
  async toggleFavorite(modelName, favorite) {
    return this.socket.request("models:toggle-favorite", {
      modelId: modelName,
      favorite,
    });
  }

  /**
   * Test a model with simple completion
   * @param {string} modelName - Model name
   * @returns {Promise<Object>} Test result
   */
  async testModel(modelName) {
    const config = this.core.get("config") || {};
    const settings = this.core.get("settings") || {};
    const port = config.port || 8080;

    // Call llama-server completion API directly
    try {
      const response = await fetch(`http://localhost:${port}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          prompt: "Hello!",
          n_predict: 10,
          temperature: settings.temperature || 0.7,
          top_p: settings.top_p || 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, output: result.content || "No output" };
    } catch (error) {
      console.error("[STATE-MODELS] Test model error:", error);
      return { success: false, error: error.message };
    }
  }
}

window.StateModels = StateModels;
