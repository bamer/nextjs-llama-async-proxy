/**
 * Simple State Manager - With Essential Logging Only
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.socket = null;
    this.connected = false;
    this.pending = new Map();
  }

  init(socket) {
    this.socket = socket;
    this._setupSocket();
  }

  _setupSocket() {
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
      }
    }, 3000);

    this.socket.on("connect", () => {
      this.socket.emit("connection:ack");
    });

    this.socket.on("disconnect", (reason) => {
      this.connected = false;
      this._notify("connectionStatus", "disconnected");
    });

    this.socket.on("connection:established", (data) => {
      // Clear the timeout since we got the proper response
      if (this._connectionTimeout) {
        clearTimeout(this._connectionTimeout);
        this._connectionTimeout = null;
      }
      this.connected = true;
      this._notify("connectionStatus", "connected");
    });

    // Handle broadcast events
    this.socket.on("models:list", (data) => {
      if (data?.type === "broadcast") {
        this._set("models", data.data?.models || []);
      }
    });

    this.socket.on("models:created", (data) => {
      if (data?.type === "broadcast") {
        this._addModel(data.data?.model);
      }
    });

    this.socket.on("models:updated", (data) => {
      if (data?.type === "broadcast") {
        this._updateModelData(data.data?.model);
      }
    });

    this.socket.on("models:deleted", (data) => {
      if (data?.type === "broadcast") {
        this._removeModel(data.data?.modelId);
      }
    });

    this.socket.on("models:scanned", (data) => {
      this._refreshModels();
    });

    this.socket.on("models:router-stopped", () => {
      // Reset all model statuses to unloaded
      const models = this.state.models || [];
      const updatedModels = models.map((m) => ({ ...m, status: "unloaded" }));
      this._set("models", updatedModels);
      this._set("routerStatus", null);
    });

    this.socket.on("metrics:update", (data) => {
      if (data?.type === "broadcast") {
        this._set("metrics", data.data?.metrics);
        this._addMetric(data.data?.metrics);
      }
    });

    this.socket.on("logs:entry", (data) => {
      if (data?.type === "broadcast") {
        this._addLog(data.data?.entry);
      }
    });

    // Handle response events - listen to any event ending with :result
    const handleResponse = (event, data) => {
      if (data?.requestId && this.pending.has(data.requestId)) {
        const p = this.pending.get(data.requestId);
        clearTimeout(p.timeout);
        this.pending.delete(data.requestId);
        if (data.success) {
          p.resolve(data.data);
        } else {
          p.reject(new Error(data.error?.message || "Request failed"));
        }
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
      "llama:status:result",
      "models:scan:result",
      "models:cleanup:result",
      "metrics:get:result",
      "metrics:history:result",
      "logs:get:result",
      "logs:read-file:result",
      "logs:list-files:result",
      "logs:clear:result",
      "logs:clear-files:result",
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

    responseEvents.forEach((evt) => {
      this.socket.on(evt, (data) => handleResponse(evt, data));
    });
  }

  getState() {
    return { ...this.state };
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    const old = this.state[key];

    // Skip notification if value hasn't changed (performance optimization)
    if (old === value) {
      return this;
    }

    // For objects, do shallow comparison
    if (typeof old === "object" && typeof value === "object" && old !== null && value !== null) {
      const oldKeys = Object.keys(old);
      const newKeys = Object.keys(value);
      if (oldKeys.length === newKeys.length && oldKeys.every((k) => old[k] === value[k])) {
        return this;
      }
    }

    this.state[key] = value;
    this._notify(key, value, old);
    return this;
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  _notify(key, value, old) {
    this.listeners.get(key)?.forEach((cb) => {
      cb(value, old, this.state);
    });
    this.listeners.get("*")?.forEach((cb) => cb(key, value, old, this.state));
  }

  request(event, data = {}) {
    return new Promise((resolve, reject) => {
      // If not connected yet, wait for connection
      if (!this.connected) {
        const checkConnection = setInterval(() => {
          if (this.connected) {
            clearInterval(checkConnection);
            this._doRequest(event, data, resolve, reject);
          }
        }, 100);
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error("Connection timeout"));
        }, 10000);
        return;
      }
      this._doRequest(event, data, resolve, reject);
    });
  }

  _doRequest(event, data, resolve, reject) {
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isConfigOperation =
      event === "config:get" ||
      event === "config:update" ||
      event === "settings:get" ||
      event === "settings:update";
    const timeoutMs = isConfigOperation ? 5000 : 120000;
    const timeout = setTimeout(() => {
      console.warn("[STATE] Request timeout:", event, "requestId:", reqId);
      this.pending.delete(reqId);
      reject(new Error(`Timeout: ${event}`));
    }, timeoutMs);
    this.pending.set(reqId, { resolve, reject, event, timeout });
    this.socket.emit(event, { ...data, requestId: reqId });
  }

  _set(key, value) {
    this.set(key, value);
  }

  _updateModel(id, status, model) {
    const list = this.state.models || [];
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status, ...model };
      this._notify("models", list, list);
    }
  }

  _addModel(m) {
    const currentModels = this.state.models || [];
    this._set("models", [...currentModels, m]);
  }

  _updateModelData(m) {
    const list = (this.state.models || []).map((x) => (x.id === m.id ? m : x));
    this._set("models", list);
  }

  _removeModel(id) {
    const list = (this.state.models || []).filter((m) => m.id !== id);
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
    return this.request("models:list");
  }

  async getModel(id) {
    return this.request("models:get", { modelId: id });
  }

  async createModel(m) {
    return this.request("models:create", { model: m });
  }

  async updateModel(id, u) {
    return this.request("models:update", { modelId: id, updates: u });
  }

  async deleteModel(id) {
    return this.request("models:delete", { modelId: id });
  }

  async startModel(id) {
    const model = this.getState().models.find((m) => m.id === id);
    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }
    return this.request("models:load", { modelName: model.name });
  }

  async loadModel(modelName) {
    return this.request("models:load", { modelName });
  }

  async unloadModel(modelName) {
    return this.request("models:unload", { modelName });
  }

  async stopModel(id) {
    const model = this.getState().models.find((m) => m.id === id);
    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }
    return this.request("models:unload", { modelName: model.name });
  }

  async getRouterStatus() {
    return this.request("llama:status");
  }

  async restartLlama() {
    return this.request("llama:restart");
  }

  async configureLlama(settings) {
    return this.request("llama:config", { settings });
  }

  async scanModels() {
    return this.request("models:scan");
  }

  // Refresh models from server (useful after scan)
  async refreshModels() {
    try {
      const data = await this.request("models:list");
      this._set("models", data.models || []);
      return data;
    } catch (e) {
      console.error("[STATE] refreshModels() error:", e.message);
      throw e;
    }
  }

  // Internal method called after scan completes
  _refreshModels() {
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

  async readLogFile(fileName) {
    return this.request("logs:read-file", { fileName });
  }

  async listLogFiles() {
    return this.request("logs:list-files");
  }

  async clearLogs() {
    return this.request("logs:clear");
  }

  async clearLogFiles() {
    return this.request("logs:clear-files");
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
    return this.request("models:cleanup");
  }
}

const stateManager = new StateManager();
window.StateManager = StateManager;
window.stateManager = stateManager;
