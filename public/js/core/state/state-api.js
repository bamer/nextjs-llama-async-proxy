/**
 * State API Module - All async API methods
 */

class StateAPI {
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;
    // Use unified cache service
    this._cache = CacheService.getCache("stateAPI", { ttl: 30000, maxSize: 100 });
  }

  /**
   * Get cached value or fetch new data using the cache service
   * @private
   * @param {string} method - Method name for cache key
   * @param {string} key - Cache key base
   * @param {Function} fetchFn - Async function to fetch data if cache miss
   * @param {...*} args - Additional arguments for cache key
   * @returns {Promise<*>} Cached or fetched data
   */
  async _cachedRequest(method, key, fetchFn, ...args) {
    const cacheKey = CacheInstance.makeKey(key, ...args);
    return this._cache.getOrFetch(cacheKey, () => fetchFn(...args));
  }

  /**
   * Invalidate cache entries matching a key pattern
   * @param {string} pattern - Key pattern to match (e.g., "getModels" matches all getModels variants)
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

  // ===== Llama Router Operations =====

  /**
   * Get router status
   * @returns {Promise<Object>} Router status
   */
  async getRouterStatus() {
    return this._cachedRequest("getRouterStatus", "getRouterStatus", () =>
      this.socket.request("llama:status")
    );
  }

  /**
   * Restart Llama router
   * @returns {Promise<Object>} Restart result
   */
  async restartLlama() {
    return this.socket.request("llama:restart");
  }

  /**
   * Configure Llama settings
   * @param {Object} settings - Settings to configure
   * @returns {Promise<Object>} Config result
   */
  async configureLlama(settings) {
    return this.socket.request("llama:config", { settings });
  }

  /**
   * Get Llama status
   * @returns {Promise<Object>} Status
   */
  async getLlamaStatus() {
    return this.socket.request("llama:status");
  }

  /**
   * Start Llama
   * @returns {Promise<Object>} Start result
   */
  async startLlama() {
    return this.socket.request("llama:start");
  }

  /**
   * Stop Llama
   * @returns {Promise<Object>} Stop result
   */
  async stopLlama() {
    return this.socket.request("llama:stop");
  }

  // ===== Metrics Operations =====

  /**
   * Get current metrics
   * @returns {Promise<Object>} Metrics data
   */
  async getMetrics() {
    return this.socket.request("metrics:get");
  }

  /**
   * Get metrics history
   * @param {Object} p - Parameters
   * @returns {Promise<Array>} Metrics history
   */
  async getMetricsHistory(p) {
    return this.socket.request("metrics:history", p);
  }

  // ===== Logs Operations =====

  /**
   * Get logs
   * @param {Object} p - Parameters
   * @returns {Promise<Array>} Logs
   */
  async getLogs(p) {
    return this.socket.request("logs:get", p);
  }

  /**
   * Read a log file
   * @param {string} fileName - File name
   * @returns {Promise<string>} Log content
   */
  async readLogFile(fileName) {
    return this.socket.request("logs:read-file", { fileName });
  }

  /**
   * List log files
   * @returns {Promise<Array>} File list
   */
  async listLogFiles() {
    return this.socket.request("logs:list-files");
  }

  /**
   * Clear logs
   * @returns {Promise<Object>} Clear result
   */
  async clearLogs() {
    return this.socket.request("logs:clear");
  }

  /**
   * Clear log files
   * @returns {Promise<Object>} Clear result
   */
  async clearLogFiles() {
    return this.socket.request("logs:clear-files");
  }

  // ===== Config Operations =====

  /**
   * Get config
   * @returns {Promise<Object>} Config
   */
  async getConfig() {
    return this._cachedRequest("getConfig", "getConfig", () => this.socket.request("config:get"));
  }

  /**
   * Update config
   * @param {Object} c - New config
   * @returns {Promise<Object>} Update result
   */
  async updateConfig(c) {
    return this.socket.request("config:update", { config: c });
  }

  // ===== Settings Operations =====

  /**
   * Get settings
   * @returns {Promise<Object>} Settings
   */
  async getSettings() {
    return this.socket.request("settings:get");
  }

  /**
   * Update settings
   * @param {Object} s - New settings
   * @returns {Promise<Object>} Update result
   */
  async updateSettings(s) {
    return this.socket.request("settings:update", { settings: s });
  }
}

window.StateAPI = StateAPI;
