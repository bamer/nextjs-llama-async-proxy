/**
 * State Socket Module - Orchestrates socket handlers
 */
/* global StateConnectionHandlers StateBroadcastHandlers StateResponseHandlers */

class StateSocket {
  constructor(stateCore) {
    this.core = stateCore;
    this.socket = null;
    this.pending = new Map();
    this.maxHistory = 1000; // Increased limit
    this.maxLogs = 100;
    this.maxPendingRequests = 200; // Prevent memory leaks from stale requests
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
    * Initialize the socket connection and set up all handlers
    * @param {Object} socket - Socket.IO socket instance (raw, not wrapped)
    */
  init(socket) {
    this.socket = socket;
    // All setup uses the raw Socket.IO socket directly
    this.connection.setup(socket);
    this.broadcast.setup(socket);
    this.response.setup(socket);
  }

  /**
   * Check if socket is currently connected
   * @returns {boolean} True if connected to server
   */
  isConnected() {
    return this.connection.isConnected();
  }

  /**
   * Add a new model to the models list in state
   * @param {Object} m - Model object to add
   */
  _addModel(m) {
    const currentModels = this.core.get("models") || [];
    this.core.set("models", [...currentModels, m]);
  }

  /**
   * Update an existing model in the models list
   * @param {Object} m - Model object with updated data (must include id)
   */
  _updateModelData(m) {
    const list = (this.core.get("models") || []).map((x) => (x.id === m.id ? m : x));
    this.core.set("models", list);
  }

  /**
   * Remove a model from the models list by ID
   * @param {string} id - ID of the model to remove
   */
  _removeModel(id) {
    const list = (this.core.get("models") || []).filter((m) => m.id !== id);
    this.core.set("models", list);
  }

  /**
   * Refresh models list from server and update state
   * @returns {Promise<void>}
   * @throws {Error} If the request to server fails
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
   * Add a metric data point to the metrics history in state
   * @param {Object} m - Metric data object to add
   */
  _addMetric(m) {
    const currentHistory = this.core.get("metricsHistory") || [];
    const newHistory = [...currentHistory, { ...m, ts: Date.now() }];

    const h = newHistory.slice(-this.maxHistory);
    this.core.set("metricsHistory", h);
    // Removed noisy debug log - metrics update every 30s, not needed
  }

  /**
   * Add a log entry to the logs array in state
   * @param {Object} e - Log entry object { level, message, source, timestamp }
   */
  _addLog(e) {
    const l = [e, ...(this.core.get("logs") || [])].slice(0, this.maxLogs);
    this.core.set("logs", l);
  }

  /**
    * Make an async request to the server - event-based with proper async/await
    * @param {string} event - Event name to request
    * @param {Object} [data={}] - Data payload to send
    * @returns {Promise<Object>} Response data from server
    */
  async request(event, data = {}) {
    // Wait for connection if needed
    if (!this.connection.isConnected()) {
      await this._waitForConnection();
    }
    return this._executeRequest(event, data);
  }

  /**
    * Wait for socket connection with timeout
    * @private
    * @returns {Promise<void>} Resolves when connected
    * @throws {Error} If timeout after 10 seconds
    */
  async _waitForConnection() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      await new Promise((resolve, reject) => {
        const onConnect = () => {
          this.socket.off("connect", onConnect);
          resolve();
        };

        controller.signal.addEventListener("abort", () => {
          this.socket.off("connect", onConnect);
          reject(new Error("Connection timeout"));
        });

        this.socket.on("connect", onConnect);
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
    * Prune oldest pending requests when map exceeds maximum size.
    * Prevents memory leaks from stale or timed-out requests.
    * @private
    */
  _prunePendingRequests() {
    if (this.pending.size > this.maxPendingRequests) {
      const firstKey = this.pending.keys().next().value;
      const stale = this.pending.get(firstKey);
      if (stale) {
        stale.reject(new Error("Request timed out or evicted"));
      }
      this.pending.delete(firstKey);
      console.warn("[StateSocket] Pruned stale request:", firstKey);
    }
  }

  /**
    * Execute the socket request immediately
    * @private
    * @param {string} event - Event name
    * @param {Object} data - Request data payload
    * @returns {Promise<Object>} Response promise
    */
   async _executeRequest(event, data) {
     const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

     // Prune oldest requests to prevent memory leaks
     this._prunePendingRequests();

     console.log("[StateSocket] Sending request:", event, "ID:", reqId, "Pending:", this.pending.size);

     return new Promise((resolve, reject) => {
       this.pending.set(reqId, { resolve, reject, event, timestamp: Date.now() });
       this.socket.emit(event, { ...data, requestId: reqId });

       // Add timeout to prevent hanging
       setTimeout(() => {
         if (this.pending.has(reqId)) {
           console.warn("[StateSocket] Request timeout:", event, "ID:", reqId);
           this.pending.delete(reqId);
           reject(new Error("Request timeout"));
         }
       }, 10000);
     });
   }

  /**
   * Clean up resources and disconnect handlers
   */
  destroy() {
    // Reject all pending requests before cleanup
    for (const [reqId, pending] of this.pending) {
      pending.reject(new Error("Socket destroyed"));
    }
    this.pending.clear();
    this.connection.destroy();
    this.broadcast?.destroy();
  }
}

window.StateSocket = StateSocket;
