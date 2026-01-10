/**
 * State Socket Module - Orchestrates socket handlers
 */
/* global StateConnectionHandlers StateBroadcastHandlers StateResponseHandlers */

class StateSocket {
  constructor(stateCore) {
    this.core = stateCore;
    this.socket = null;
    this.pending = new Map();
    this.maxHistory = 500; // Configurable max history size
    this.maxLogs = 100; // Configurable max logs size
    this.connection = new StateConnectionHandlers(
      stateCore,
      () => this.core._notify("connectionStatus", "connected"),
      () => this.core._notify("connectionStatus", "disconnected")
    );
    this.broadcast = new StateBroadcastHandlers(stateCore, {
      onModelCreated: (m) => this._addModel(m),
      onModelUpdated: (m) => this._updateModelData(m),
      onModelDeleted: (id) => this._removeModel(id),
      onModelsScanned: () => this._refreshModels(),
      onMetric: (m) => this._addMetric(m),
      onLog: (e) => this._addLog(e),
    });
    this.response = new StateResponseHandlers(this.pending);
  }

  /**
   * Initialize socket connection
   * @param {Object} socket - Socket.IO socket instance
   */
  init(socket) {
    this.socket = socket;
    this.connection.setup(socket);
    this.broadcast.setup(socket);
    this.response.setup(socket);
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connection.isConnected();
  }

  /**
   * Add a model to state
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
   * Remove a model from state
   * @param {string} id - Model ID to remove
   */
  _removeModel(id) {
    const list = (this.core.get("models") || []).filter((m) => m.id !== id);
    this.core.set("models", list);
  }

  /**
   * Refresh models from server
   */
  async _refreshModels() {
    try {
      const data = await this.request("models:list");
      this.core.set("models", data.models || []);
    } catch (e) {
      console.error("[STATE-SOCKET] Auto-refresh models failed:", e.message);
    }
  }

  /**
   * Add metric to history
   * @param {Object} m - Metric data
   */
  _addMetric(m) {
    const currentHistory = this.core.get("metricsHistory") || [];
    const newHistory = [...currentHistory, { ...m, ts: Date.now() }];

    // Add warning when approaching limit
    if (currentHistory.length >= this.maxHistory - 10) {
      console.warn("[STATE-SOCKET] Metrics history approaching limit:", {
        current: currentHistory.length,
        max: this.maxHistory,
      });
    }

    const h = newHistory.slice(-this.maxHistory);
    this.core.set("metricsHistory", h);
    console.log("[DEBUG] StateSocket._addMetric:", {
      newLength: h.length,
      maxHistory: this.maxHistory,
    });
  }

  /**
   * Add log entry
   * @param {Object} e - Log entry
   */
  _addLog(e) {
    const l = [e, ...(this.core.get("logs") || [])].slice(0, this.maxLogs);
    this.core.set("logs", l);
  }

  /**
   * Make an async request
   * @param {string} event - Event name
   * @param {Object} data - Request data
   * @returns {Promise} Response promise
   */
  request(event, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connection.isConnected()) {
        const checkConnection = setInterval(() => {
          if (this.connection.isConnected()) {
            clearInterval(checkConnection);
            this._doRequest(event, data, resolve, reject);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error("Connection timeout"));
        }, 10000);
        return;
      }
      this._doRequest(event, data, resolve, reject);
    });
  }

  /**
   * Execute the actual request
   * @param {string} event - Event name
   * @param {Object} data - Request data
   * @param {Function} resolve - Resolve callback
   * @param {Function} reject - Reject callback
   */
  _doRequest(event, data, resolve, reject) {
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isConfigOperation = event.startsWith("config:") || event.startsWith("settings:");
    const timeoutMs = isConfigOperation ? 5000 : 120000;
    const timeout = setTimeout(() => {
      console.warn("[STATE-SOCKET] Request timeout:", {
        event,
        requestId: reqId,
        timeoutMs,
        timeoutSeconds: timeoutMs / 1000,
      });
      this.pending.delete(reqId);
      reject(new Error(`Request timeout after ${timeoutMs / 1000}s for event: ${event}`));
    }, timeoutMs);
    this.pending.set(reqId, { resolve, reject, event, timeout });
    this.socket.emit(event, { ...data, requestId: reqId });
    console.log("[DEBUG] StateSocket._doRequest:", { event, requestId: reqId, timeoutMs });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.connection.destroy();
  }
}

window.StateSocket = StateSocket;
