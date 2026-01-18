/**
 * State Manager - Orchestrates state modules
 */
/* global StateCore StateSocket StateModels StateAPI */

class StateManager {
  constructor() {
    this.core = new StateCore();
    this.socket = new StateSocket(this.core);
    this.models = new StateModels(this.core, this.socket);
    this.api = new StateAPI(this.core, this.socket);
  }

  /**
     * Initialize with socket connection
     * @param {Object} socket - Socket.IO socket instance
     */
  init(socket) {
    this.socket.init(socket);
  }

  // ===== Core Methods (delegate to StateCore) =====

  /**
     * Get entire state object
     * @returns {Object} Copy of current state
     */
  getState() {
    return this.core.getState();
  }

  /**
     * Get a value from state by key
     * @param {string} key - State key to retrieve
     * @returns {*} Value stored at key or undefined
     */
  get(key) {
    return this.core.get(key);
  }

  /**
     * Set a value in state
     * @param {string} key - State key
     * @param {*} value - Value to store
     * @returns {StateCore} StateCore instance for chaining
     */
  set(key, value) {
    return this.core.set(key, value);
  }

  /**
     * Subscribe to state changes
     * @param {string} key - State key to listen to (or "*" for all)
     * @param {Function} callback - Function called on change (value, old, state)
     * @returns {Function} Unsubscribe function
     */
  subscribe(key, callback) {
    return this.core.subscribe(key, callback);
  }

  // ===== Connection Status =====

  /**
     * Check if socket is connected
     * @returns {boolean} True if connected
     */
  isConnected() {
    return this.socket.isConnected();
  }

  // ===== Model Operations (delegate to StateModels) =====

  /**
     * Get all models from server
     * @returns {Promise<Array>} List of models
     */
  async getModels() {
    return this.models.getModels();
  }

  /**
     * Get a specific model by ID
     * @param {string} id - Model ID
     * @returns {Promise<Object>} Model data
     */
  async getModel(id) {
    return this.models.getModel(id);
  }

  /**
     * Create a new model
     * @param {Object} m - Model data to create
     * @returns {Promise<Object>} Created model
     */
  async createModel(m) {
    return this.models.createModel(m);
  }

  /**
     * Update an existing model
     * @param {string} id - Model ID to update
     * @param {Object} u - Updates to apply
     * @returns {Promise<Object>} Updated model
     */
  async updateModel(id, u) {
    return this.models.updateModel(id, u);
  }

  /**
     * Delete a model
     * @param {string} id - Model ID to delete
     * @returns {Promise<void>} Deletion result
     */
  async deleteModel(id) {
    return this.models.deleteModel(id);
  }

  /**
     * Start/load a model by ID
     * @param {string} id - Model ID to start
     * @returns {Promise<Object>} Start result
     */
  async startModel(id) {
    return this.models.startModel(id);
  }

  /**
     * Load a model by name
     * @param {string} modelName - Model name to load
     * @returns {Promise<Object>} Load result
     */
  async loadModel(modelName) {
    return this.models.loadModel(modelName);
  }

  /**
     * Unload a model by name
     * @param {string} modelName - Model name to unload
     * @returns {Promise<Object>} Unload result
     */
  async unloadModel(modelName) {
    return this.models.unloadModel(modelName);
  }

  /**
     * Stop/unload a model by ID
     * @param {string} id - Model ID to stop
     * @returns {Promise<Object>} Stop result
     */
  async stopModel(id) {
    return this.models.stopModel(id);
  }

  /**
     * Scan for available models on disk
     * @returns {Promise<Object>} Scan result with new models
     */
  async scanModels() {
    return this.models.scanModels();
  }

  /**
     * Refresh models list from server
     * @returns {Promise<Object>} Refreshed models data
     */
  async refreshModels() {
    return this.models.refreshModels();
  }

  /**
     * Cleanup unused or corrupted models
     * @returns {Promise<Object>} Cleanup result
     */
  async cleanupModels() {
    return this.models.cleanupModels();
  }

  // ===== Llama Router Operations (delegate to StateAPI) =====

  /**
     * Get router/server status
     * @returns {Promise<Object>} Router status data
     */
  async getRouterStatus() {
    return this.api.getRouterStatus();
  }

  /**
     * Restart the Llama router/server
     * @returns {Promise<Object>} Restart result
     */
  async restartLlama() {
    return this.api.restartLlama();
  }

  /**
     * Configure Llama server settings
     * @param {Object} settings - Settings to configure
     * @returns {Promise<Object>} Configuration result
     */
  async configureLlama(settings) {
    return this.api.configureLlama(settings);
  }

  /**
     * Get Llama server status
     * @returns {Promise<Object>} Status data
     */
  async getLlamaStatus() {
    return this.api.getLlamaStatus();
  }

  /**
      * Start the Llama server
      * @returns {Promise<Object>} Start result
      */
  async startLlama() {
    return this.api.startLlama();
  }

  /**
      * Start the Llama server with a preset
      * @param {string} presetName - Name of the preset to use
      * @returns {Promise<Object>} Start result
      */
  async startLlamaWithPreset(presetName) {
    return this.socket.request("llama:start-with-preset", { presetName });
  }

  /**
      * Stop the Llama server
      * @returns {Promise<Object>} Stop result
      */
  async stopLlama() {
    return this.api.stopLlama();
  }

  // ===== Metrics Operations (delegate to StateAPI) =====

  /**
     * Get current metrics from server
     * @returns {Promise<Object>} Metrics data
     */
  async getMetrics() {
    return this.api.getMetrics();
  }

  /**
     * Get historical metrics
     * @param {Object} p - Query parameters (limit, offset, etc.)
     * @returns {Promise<Array>} Metrics history array
     */
  async getMetricsHistory(p) {
    return this.api.getMetricsHistory(p);
  }

  // ===== Logs Operations (delegate to StateAPI) =====

  /**
     * Get logs from server
     * @param {Object} p - Query parameters (level, limit, etc.)
     * @returns {Promise<Array>} Logs array
     */
  async getLogs(p) {
    return this.api.getLogs(p);
  }

  /**
     * Read contents of a specific log file
     * @param {string} fileName - Name of the log file
     * @returns {Promise<string>} Log file contents
     */
  async readLogFile(fileName) {
    return this.api.readLogFile(fileName);
  }

  /**
     * List available log files
     * @returns {Promise<Array>} List of log file names
     */
  async listLogFiles() {
    return this.api.listLogFiles();
  }

  /**
     * Clear in-memory logs
     * @returns {Promise<Object>} Clear operation result
     */
  async clearLogs() {
    return this.api.clearLogs();
  }

  /**
      * Delete log files from disk
      * @returns {Promise<Object>} Clear operation result
      */
  async clearLogFiles() {
    return this.api.clearLogFiles();
  }

  /**
      * Send a log entry to the server
      * @param {string} level - Log level (debug, info, warn, error)
      * @param {string} message - Log message
      * @param {string} source - Source identifier (default: "client")
      * @returns {void}
      */
  log(level, message, source = "client") {
    this.api.log(level, message, source);
  }

  // ===== Direct Request Operations (delegate to StateSocket) =====

  /**
     * Request with automatic connection waiting
     * @param {string} event - Event name
     * @param {Object} data - Request data
     * @returns {Promise} Response promise
     */
  async request(event, data = {}) {
    // Delegate to socket which has built-in retry logic for connection waits
    return this.socket.request(event, data);
  }

  /**
     * Execute operation with connection check
     * @param {Function} fn - Async function to execute
     * @param {string} context - Operation context for error messages
     * @returns {Promise} Result promise
     */
  async withConnection(fn, context = "operation") {
    if (!this.isConnected()) {
      console.warn("[STATE-MANAGER] Connection guard: Not connected for", context);
      return Promise.reject(new Error(`Cannot ${context}: Not connected to server`));
    }
    return fn();
  }

  // ===== Config Operations (delegate to StateAPI) =====

  /**
     * Get server configuration
     * @returns {Promise<Object>} Configuration object
     */
  async getConfig() {
    return this.api.getConfig();
  }

  /**
     * Update server configuration
     * @param {Object} c - New configuration values
     * @returns {Promise<Object>} Update result
     */
  async updateConfig(c) {
    return this.api.updateConfig(c);
  }

  /**
     * Get application settings
     * @returns {Promise<Object>} Settings object
     */
  async getSettings() {
    return this.api.getSettings();
  }

   /**
      * Update application settings
      * @param {Object} s - New settings values
      * @returns {Promise<Object>} Update result
      */
   async updateSettings(s) {
     return this.api.updateSettings(s);
   }

   // ===== Router Config Operations (Unified Schema) =====

   /**
      * Get router configuration
      * @returns {Promise<Object>} Router configuration object
      */
   async getRouterConfig() {
     return this.api.getRouterConfig();
   }

   /**
      * Update router configuration
      * @param {Object} c - New router configuration values
      * @returns {Promise<Object>} Update result
      */
   async updateRouterConfig(c) {
     return this.api.updateRouterConfig(c);
   }

   /**
      * Reset router configuration to defaults
      * @returns {Promise<Object>} Default configuration
      */
   async resetRouterConfig() {
     return this.api.resetRouterConfig();
   }

   /**
      * Get logging configuration
      * @returns {Promise<Object>} Logging configuration object
      */
   async getLoggingConfig() {
     return this.api.getLoggingConfig();
   }

   /**
      * Update logging configuration
      * @param {Object} c - New logging configuration values
      * @returns {Promise<Object>} Update result
      */
   async updateLoggingConfig(c) {
     return this.api.updateLoggingConfig(c);
   }

   /**
      * Reset logging configuration to defaults
      * @returns {Promise<Object>} Default configuration
      */
   async resetLoggingConfig() {
     return this.api.resetLoggingConfig();
   }

   // ===== Event-Driven Methods (Phase 3.1.1) =====

  /**
   * Emit an action event that components can listen to
   * @param {string} event - Event name (e.g., "models:scan")
   * @param {any} data - Event data
   */
  emit(event, data = null) {
    // Use event directly as key (don't add prefix)
    this.core.set(event, {
      data,
      timestamp: Date.now(),
      event,
    });
  }

  /**
   * Subscribe to action events with wildcard support
   * @param {string} event - Event pattern (e.g., "actions:models:*" or "models:*")
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeAction(event, callback) {
    // Normalize event pattern - remove "actions:" prefix if present for pattern matching
    const patternStr = event.replace(/^actions:/, "");
    const pattern = new RegExp(`^${patternStr.replace(/\*/g, ".*")}$`);

    return this.core.subscribe("actions", (actions) => {
      if (pattern.test(actions.event)) {
        callback(actions);
      }
    });
  }

  /**
   * Set page-specific state for components to react to
   * @param {string} page - Page name (e.g., "dashboard")
   * @param {string} key - State key
   * @param {any} value - State value
   */
  setPageState(page, key, value) {
    const pageKey = `page:${page}`;
    const current = this.core.get(pageKey) || {};
    current[key] = value;
    this.core.set(pageKey, current);
  }

  /**
   * Get page-specific state
   * @param {string} page - Page name
   * @returns {Object} Page state
   */
  getPageState(page) {
    return this.core.get(`page:${page}`) || {};
  }

  /**
   * Set action status for components to display (loading, success, error)
   * @param {string} action - Action identifier (e.g., "models:scan")
   * @param {Object} status - Status object { status, message, progress, error }
   */
  setActionStatus(action, status) {
    this.core.set(`actions:${action}`, {
      ...status,
      timestamp: Date.now(),
    });
  }

  /**
   * Get action status
   * @param {string} action - Action identifier
   * @returns {Object|null} Status object or null
   */
  getActionStatus(action) {
    return this.core.get(`actions:${action}`);
  }
}

const stateManager = new StateManager();
window.StateManager = StateManager;
window.stateManager = stateManager;
