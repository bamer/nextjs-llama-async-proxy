/**
 * Simple State Manager - With Comprehensive Debug Logging
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.socket = null;
    this.connected = false;
    this.queue = [];
    this.pending = new Map();
    console.log("[STATE] StateManager constructor called");
  }

  init(socket) {
    console.log("[STATE] StateManager.init() called with socket:", !!socket);
    this.socket = socket;
    this._setupSocket();
    console.log("[STATE] StateManager initialized successfully");
  }

  _setupSocket() {
    console.log("[STATE] _setupSocket() called");
    if (!this.socket) {
      console.warn("[STATE] Socket not initialized in _setupSocket");
      return;
    }

    // Connection timeout fallback - set connected after 3 seconds even without handshake
    this._connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        console.log("[STATE] Connection timeout - setting connected=true");
        this.connected = true;
        this._notify("connectionStatus", "connected");
        this._processQueue();
      }
    }, 3000);

    this.socket.on("connect", () => {
      console.log("[STATE] Socket connected event fired");
      console.log("[STATE] Socket ID:", this.socket?.id);
      this.socket.emit("connection:ack");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[STATE] Socket disconnected, reason:", reason);
      this.connected = false;
      this._notify("connectionStatus", "disconnected");
    });

    this.socket.on("connection:established", (data) => {
      console.log("[STATE] Connection established event received");
      console.log("[STATE] Connection data:", JSON.stringify(data));
      // Clear the timeout since we got the proper response
      if (this._connectionTimeout) {
        clearTimeout(this._connectionTimeout);
        this._connectionTimeout = null;
      }
      this.connected = true;
      this._notify("connectionStatus", "connected");
      console.log("[STATE] Calling _processQueue()");
      this._processQueue();
    });

    // Handle broadcast events
    this.socket.on("models:list", (data) => {
      console.log("[STATE] Received models:list broadcast");
      console.log("[STATE] models:list data:", JSON.stringify(data)?.substring(0, 500));
      if (data?.type === "broadcast") {
        console.log("[STATE] Processing broadcast, setting models");
        this._set("models", data.data?.models || []);
      }
    });

    this.socket.on("models:created", (data) => {
      console.log("[STATE] Received models:created broadcast");
      console.log("[STATE] models:created data:", JSON.stringify(data)?.substring(0, 300));
      if (data?.type === "broadcast") {
        console.log("[STATE] Adding new model to list");
        this._addModel(data.data?.model);
      }
    });

    this.socket.on("models:updated", (data) => {
      console.log("[STATE] Received models:updated broadcast");
      console.log("[STATE] models:updated data:", JSON.stringify(data)?.substring(0, 300));
      if (data?.type === "broadcast") {
        console.log("[STATE] Updating model data");
        this._updateModelData(data.data?.model);
      }
    });

    this.socket.on("models:deleted", (data) => {
      console.log("[STATE] Received models:deleted broadcast");
      console.log("[STATE] models:deleted data:", JSON.stringify(data)?.substring(0, 300));
      if (data?.type === "broadcast") {
        console.log("[STATE] Removing model from list");
        this._removeModel(data.data?.modelId);
      }
    });

    this.socket.on("models:scanned", (data) => {
      console.log("[STATE] Received models:scanned broadcast");
      console.log("[STATE] models:scanned raw data:", JSON.stringify(data)?.substring(0, 500));
      console.log("[STATE] data.scanned:", data?.scanned);
      console.log("[STATE] data.updated:", data?.updated);
      console.log("[STATE] data.total:", data?.total);
      console.log("[STATE] Calling _refreshModels() after scan");
      this._refreshModels();
    });

    this.socket.on("models:router-stopped", () => {
      console.log("[STATE] Received models:router-stopped broadcast");
      // Reset all model statuses to unloaded
      const models = this.state.models || [];
      const updatedModels = models.map((m) => ({ ...m, status: "unloaded" }));
      this._set("models", updatedModels);
      this._set("routerStatus", null);
    });

    this.socket.on("metrics:update", (data) => {
      console.log("[STATE] Received metrics:update broadcast");
      if (data?.type === "broadcast") {
        this._set("metrics", data.data?.metrics);
        this._addMetric(data.data?.metrics);
      }
    });

    this.socket.on("logs:entry", (data) => {
      console.log("[STATE] Received logs:entry broadcast");
      if (data?.type === "broadcast") {
        this._addLog(data.data?.entry);
      }
    });

    // Handle response events - listen to any event ending with :result
    const handleResponse = (event, data) => {
      console.log("[STATE] Response received for:", event);
      console.log("[STATE] Response data:", JSON.stringify(data)?.substring(0, 300));
      if (data?.requestId && this.pending.has(data.requestId)) {
        const p = this.pending.get(data.requestId);
        clearTimeout(p.timeout);
        this.pending.delete(data.requestId);
        console.log("[STATE] Resolving pending request:", event, "requestId:", data.requestId);
        if (data.success) {
          console.log("[STATE] Request successful, resolving with data");
          p.resolve(data.data);
        } else {
          console.log("[STATE] Request failed, rejecting with error:", data.error?.message);
          p.reject(new Error(data.error?.message || "Request failed"));
        }
      } else {
        console.log("[STATE] No pending request found for:", event, "requestId:", data?.requestId);
      }
    };

    // Listen for all response events
    const responseEvents = [
      "models:list:result",
      "models:get:result",
      "models:create:result",
      "models:update:result",
      "models:delete:result",
      "models:start:result",
      "models:stop:result",
      "models:load:result",
      "models:unload:result",
      "models:router:status:result",
      "models:scan:result",
      "models:cleanup:result",
      "metrics:get:result",
      "metrics:history:result",
      "logs:get:result",
      "logs:clear:result",
      "config:get:result",
      "config:update:result",
      "settings:get:result",
      "settings:update:result",
      "llama:status:result",
      "llama:start:result",
      "llama:stop:result",
      "llama:restart:result",
      "llama:config:result",
    ];

    console.log("[STATE] Registering listeners for", responseEvents.length, "response events");
    responseEvents.forEach((evt) => {
      this.socket.on(evt, (data) => handleResponse(evt, data));
    });
  }

  getState() {
    console.log("[STATE] getState() called, returning state keys:", Object.keys(this.state).join(", "));
    return { ...this.state };
  }

  get(key) {
    const value = this.state[key];
    console.log("[STATE] get('" + key + "') called, value:", JSON.stringify(value)?.substring(0, 200));
    return value;
  }

  set(key, value) {
    console.log("[STATE] set('" + key + "') called");
    console.log("[STATE]   Old value:", JSON.stringify(this.state[key])?.substring(0, 200));
    console.log("[STATE]   New value:", JSON.stringify(value)?.substring(0, 200));
    const old = this.state[key];
    this.state[key] = value;
    this._notify(key, value, old);
    return this;
  }

  subscribe(key, callback) {
    console.log("[STATE] subscribe('" + key + "') called");
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    console.log("[STATE]   Now have", this.listeners.get(key).size, "listeners for", key);
    return () => {
      console.log("[STATE] Unsubscribing from '" + key + "'");
      this.listeners.get(key)?.delete(callback);
    };
  }

  _notify(key, value, old) {
    console.log("[STATE] _notify('" + key + "') called, listeners count:", this.listeners.get(key)?.size);
    this.listeners.get(key)?.forEach((cb) => {
      console.log("[STATE]   Calling listener for", key);
      cb(value, old, this.state);
    });
    this.listeners.get("*")?.forEach((cb) => cb(key, value, old, this.state));
  }

  request(event, data = {}) {
    console.log("[STATE] request('" + event + "') called with data:", JSON.stringify(data)?.substring(0, 300));
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        console.log("[STATE] Not connected, queuing request:", event);
        this.queue.push({ event, data, resolve, reject });
        console.log("[STATE] Queue now has", this.queue.length, "items");
        return;
      }
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log("[STATE] Sending request:", event, "with requestId:", reqId);
      // Shorter timeout for config operations (5 seconds), longer for scan (120 seconds)
      const isConfigOperation = event === "config:get" || event === "config:update" || event === "settings:get" || event === "settings:update";
      const timeoutMs = isConfigOperation ? 5000 : 120000;
      const timeout = setTimeout(() => {
        console.warn("[STATE] Request timeout:", event, "requestId:", reqId);
        this.pending.delete(reqId);
        reject(new Error(`Timeout: ${event}`));
      }, timeoutMs);
      this.pending.set(reqId, { resolve, reject, event, timeout });
      this.socket.emit(event, { ...data, requestId: reqId });
    });
  }

  _processQueue() {
    console.log("[STATE] _processQueue() called, processing", this.queue.length, "queued items");
    const q = [...this.queue];
    this.queue = [];
    q.forEach(({ event, data, resolve, reject }) => {
      console.log("[STATE] Processing queued request:", event);
      this.request(event, data).then(resolve).catch(reject);
    });
  }

  _set(key, value) {
    console.log("[STATE] _set('" + key + "') called, value:", JSON.stringify(value)?.substring(0, 200));
    this.set(key, value);
  }

  _updateModel(id, status, model) {
    console.log("[STATE] _updateModel() called:", { id, status });
    const list = this.state.models || [];
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      console.log("[STATE]   Found model at index", idx, "updating");
      list[idx] = { ...list[idx], status, ...model };
      this._notify("models", list, list);
    } else {
      console.log("[STATE]   Model not found in list");
    }
  }

  _addModel(m) {
    console.log("[STATE] _addModel() called:", m?.name);
    const currentModels = this.state.models || [];
    console.log("[STATE]   Current models count:", currentModels.length);
    this._set("models", [...currentModels, m]);
    console.log("[STATE]   New models count:", currentModels.length + 1);
  }

  _updateModelData(m) {
    console.log("[STATE] _updateModelData() called:", m?.name);
    const list = (this.state.models || []).map((x) => (x.id === m.id ? m : x));
    this._set("models", list);
  }

  _removeModel(id) {
    console.log("[STATE] _removeModel() called:", id);
    const list = (this.state.models || []).filter((m) => m.id !== id);
    console.log("[STATE]   Models before:", (this.state.models || []).length, "after:", list.length);
    this._set("models", list);
  }

  _addMetric(m) {
    const h = [...(this.state.metricsHistory || []), { ...m, ts: Date.now() }].slice(-200);
    this._set("metricsHistory", h);
  }

  _addLog(e) {
    const l = [e, ...(this.state.logs || [])].slice(0, 100);
    this._set("logs", l);
  }

  // API
  async getModels() {
    console.log("[STATE] getModels() called");
    return this.request("models:list");
  }

  async getModel(id) {
    console.log("[STATE] getModel() called for id:", id);
    return this.request("models:get", { modelId: id });
  }

  async createModel(m) {
    console.log("[STATE] createModel() called:", m?.name);
    return this.request("models:create", { model: m });
  }

  async updateModel(id, u) {
    console.log("[STATE] updateModel() called for id:", id);
    return this.request("models:update", { modelId: id, updates: u });
  }

  async deleteModel(id) {
    console.log("[STATE] deleteModel() called for id:", id);
    return this.request("models:delete", { modelId: id });
  }

  async startModel(id) {
    console.log("[STATE] startModel() called for id:", id);
    return this.request("models:start", { modelId: id });
  }

  async loadModel(modelName) {
    console.log("[STATE] loadModel() called for model:", modelName);
    return this.request("models:load", { modelName });
  }

  async unloadModel(modelName) {
    console.log("[STATE] unloadModel() called for model:", modelName);
    return this.request("models:unload", { modelName });
  }

  async stopModel(id) {
    console.log("[STATE] stopModel() called for id:", id);
    return this.request("models:stop", { modelId: id });
  }

  async getRouterStatus() {
    console.log("[STATE] getRouterStatus() called");
    return this.request("models:router:status");
  }

  async restartLlama() {
    console.log("[STATE] restartLlama() called");
    return this.request("llama:restart");
  }

  async configureLlama(settings) {
    console.log("[STATE] configureLlama() called with:", settings);
    return this.request("llama:config", { settings });
  }

  async scanModels() {
    console.log("[STATE] scanModels() called");
    return this.request("models:scan");
  }

  // Refresh models from server (useful after scan)
  async refreshModels() {
    console.log("[STATE] refreshModels() called");
    try {
      console.log("[STATE] Requesting models:list");
      const data = await this.request("models:list");
      console.log("[STATE] Got models:list response, models count:", data.models?.length);
      console.log("[STATE] First few models:", JSON.stringify(data.models?.slice(0, 2))?.substring(0, 500));
      this._set("models", data.models || []);
      console.log("[STATE] refreshModels() complete");
      return data;
    } catch (e) {
      console.error("[STATE] refreshModels() error:", e.message);
      throw e;
    }
  }

  // Internal method called after scan completes
  _refreshModels() {
    console.log("[STATE] _refreshModels() called (auto-refresh after scan)");
    this.refreshModels().catch((err) => {
      console.error("[STATE] Auto-refresh models failed:", err.message);
    });
  }

  async getMetrics() {
    return this.request("metrics:get");
  }

  async getMetricsHistory(p) {
    return this.request("metrics:history", p);
  }

  async getLogs(p) {
    return this.request("logs:get", p);
  }

  async clearLogs() {
    return this.request("logs:clear");
  }

  async getConfig() {
    return this.request("config:get");
  }

  async updateConfig(c) {
    return this.request("config:update", { config: c });
  }

  async getSettings() {
    return this.request("settings:get");
  }

  async updateSettings(s) {
    return this.request("settings:update", { settings: s });
  }

  async getLlamaStatus() {
    return this.request("llama:status");
  }

  async startLlama() {
    return this.request("llama:start");
  }

  async stopLlama() {
    return this.request("llama:stop");
  }

  async cleanupModels() {
    console.log("[STATE] cleanupModels() called");
    return this.request("models:cleanup");
  }
}

const stateManager = new StateManager();
window.StateManager = StateManager;
window.stateManager = stateManager;
console.log("[STATE] StateManager instantiated and exposed as window.stateManager");
