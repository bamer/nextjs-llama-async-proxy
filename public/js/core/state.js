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

  getState() {
    return this.core.getState();
  }

  get(key) {
    return this.core.get(key);
  }

  set(key, value) {
    return this.core.set(key, value);
  }

  subscribe(key, callback) {
    return this.core.subscribe(key, callback);
  }

  // ===== Connection Status =====

  isConnected() {
    return this.socket.isConnected();
  }

  // ===== Model Operations (delegate to StateModels) =====

  async getModels() {
    return this.models.getModels();
  }

  async getModel(id) {
    return this.models.getModel(id);
  }

  async createModel(m) {
    return this.models.createModel(m);
  }

  async updateModel(id, u) {
    return this.models.updateModel(id, u);
  }

  async deleteModel(id) {
    return this.models.deleteModel(id);
  }

  async startModel(id) {
    return this.models.startModel(id);
  }

  async loadModel(modelName) {
    return this.models.loadModel(modelName);
  }

  async unloadModel(modelName) {
    return this.models.unloadModel(modelName);
  }

  async stopModel(id) {
    return this.models.stopModel(id);
  }

  async scanModels() {
    return this.models.scanModels();
  }

  async refreshModels() {
    return this.models.refreshModels();
  }

  async cleanupModels() {
    return this.models.cleanupModels();
  }

  // ===== Llama Router Operations (delegate to StateAPI) =====

  async getRouterStatus() {
    return this.api.getRouterStatus();
  }

  async restartLlama() {
    return this.api.restartLlama();
  }

  async configureLlama(settings) {
    return this.api.configureLlama(settings);
  }

  async getLlamaStatus() {
    return this.api.getLlamaStatus();
  }

  async startLlama() {
    return this.api.startLlama();
  }

  async stopLlama() {
    return this.api.stopLlama();
  }

  // ===== Metrics Operations (delegate to StateAPI) =====

  async getMetrics() {
    return this.api.getMetrics();
  }

  async getMetricsHistory(p) {
    return this.api.getMetricsHistory(p);
  }

  // ===== Logs Operations (delegate to StateAPI) =====

  async getLogs(p) {
    return this.api.getLogs(p);
  }

  async readLogFile(fileName) {
    return this.api.readLogFile(fileName);
  }

  async listLogFiles() {
    return this.api.listLogFiles();
  }

  async clearLogs() {
    return this.api.clearLogs();
  }

  async clearLogFiles() {
    return this.api.clearLogFiles();
  }

  // ===== Direct Request Operations (delegate to StateSocket) =====

  /**
   * Request with connection guard
   * @param {string} event - Event name
   * @param {Object} data - Request data
   * @returns {Promise} Response promise
   */
  async request(event, data = {}) {
    if (!this.isConnected()) {
      console.warn("[STATE-MANAGER] Connection guard: Not connected, rejecting request:", event);
      return Promise.reject(new Error("Not connected to server. Please check your connection."));
    }
    console.log("[DEBUG] StateManager request:", { event, data });
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

  async getConfig() {
    return this.api.getConfig();
  }

  async updateConfig(c) {
    return this.api.updateConfig(c);
  }

  // ===== Settings Operations (delegate to StateAPI) =====

  async getSettings() {
    return this.api.getSettings();
  }

  async updateSettings(s) {
    return this.api.updateSettings(s);
  }
}

const stateManager = new StateManager();
window.StateManager = StateManager;
window.stateManager = stateManager;
