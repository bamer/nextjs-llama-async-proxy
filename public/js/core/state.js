/**
 * Simple State Manager
 */

class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.socket = null;
    this.connected = false;
    this.queue = [];
    this.pending = new Map();
  }

  init(socket) {
    this.socket = socket;
    this._setupSocket();
    console.log("[DEBUG] StateManager initialized");
  }

  _setupSocket() {
    if (!this.socket) {
      console.warn("[DEBUG] Socket not initialized");
      return;
    }

    this.socket.on("connect", () => {
      console.log("[DEBUG] Socket connected, sending ack...");
      this.socket.emit("connection:ack");
    });

    this.socket.on("disconnect", () => {
      console.log("[DEBUG] Socket disconnected");
      this.connected = false;
      this._notify("connectionStatus", "disconnected");
    });

    this.socket.on("connection:established", () => {
      console.log("[DEBUG] Connection established");
      this.connected = true;
      this._notify("connectionStatus", "connected");
      this._processQueue();
    });

    // Handle broadcast events
    this.socket.on("models:list", (d) => {
      console.log("[DEBUG] Received models:list broadcast", d);
      if (d?.type === "broadcast") this._set("models", d.data?.models || []);
    });
    this.socket.on("models:status", (d) => {
      console.log("[DEBUG] Received models:status broadcast", d);
      if (d?.type === "broadcast") this._updateModel(d.data?.modelId, d.data?.status, d.data?.model);
    });
    this.socket.on("models:created", (d) => {
      console.log("[DEBUG] Received models:created broadcast", d);
      if (d?.type === "broadcast") this._addModel(d.data?.model);
    });
    this.socket.on("models:updated", (d) => {
      console.log("[DEBUG] Received models:updated broadcast", d);
      if (d?.type === "broadcast") this._updateModelData(d.data?.model);
    });
    this.socket.on("models:deleted", (d) => {
      console.log("[DEBUG] Received models:deleted broadcast", d);
      if (d?.type === "broadcast") this._removeModel(d.data?.modelId);
    });
    this.socket.on("models:scanned", (d) => {
      console.log("[DEBUG] Received models:scanned broadcast", d);
      if (d?.type === "broadcast") {
        console.log("[DEBUG] Scan complete:", d.data);
      }
    });
    this.socket.on("metrics:update", (d) => {
      if (d?.type === "broadcast") {
        this._set("metrics", d.data?.metrics);
        this._addMetric(d.data?.metrics);
      }
    });
    this.socket.on("logs:entry", (d) => {
      console.log("[DEBUG] Received logs:entry broadcast", d);
      if (d?.type === "broadcast") this._addLog(d.data?.entry);
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
      "models:list:result", "models:get:result", "models:create:result",
      "models:update:result", "models:delete:result", "models:start:result",
      "models:stop:result", "models:scan:result", "metrics:get:result", "metrics:history:result",
      "logs:get:result", "logs:clear:result", "config:get:result",
      "config:update:result", "settings:get:result", "settings:update:result",
      "llama:status:result", "llama:start:result", "llama:stop:result"
    ];

    responseEvents.forEach(evt => {
      this.socket.on(evt, (data) => handleResponse(evt, data));
    });
  }

  getState() { return { ...this.state }; }
  get(key) { return this.state[key]; }
  set(key, value) {
    const old = this.state[key];
    this.state[key] = value;
    this._notify(key, value, old);
    return this;
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key)?.delete(callback);
  }

  _notify(key, value, old) {
    this.listeners.get(key)?.forEach(cb => cb(value, old, this.state));
    this.listeners.get("*")?.forEach(cb => cb(key, value, old, this.state));
  }

  request(event, data = {}) {
    console.log("[DEBUG] StateManager request:", event, data);
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        console.log("[DEBUG] Not connected, queuing request:", event);
        this.queue.push({ event, data, resolve, reject });
        return;
      }
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timeout = setTimeout(() => {
        console.warn("[DEBUG] Request timeout:", event, reqId);
        this.pending.delete(reqId);
        reject(new Error(`Timeout: ${event}`));
      }, 30000);
      this.pending.set(reqId, { resolve, reject, event, timeout });
      this.socket.emit(event, { ...data, requestId: reqId });
      console.log("[DEBUG] Request sent:", event, { requestId: reqId });
    });
  }

  _processQueue() {
    const q = [...this.queue];
    this.queue = [];
    q.forEach(({ event, data, resolve, reject }) => {
      this.request(event, data).then(resolve).catch(reject);
    });
  }

  _set(key, value) { this.set(key, value); }
  _updateModel(id, status, model) {
    const list = this.state.models || [];
    const idx = list.findIndex(m => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status, ...model };
      this._notify("models", list, list);
    }
  }
  _addModel(m) { this._set("models", [...(this.state.models || []), m]); }
  _updateModelData(m) {
    const list = (this.state.models || []).map(x => x.id === m.id ? m : x);
    this._set("models", list);
  }
  _removeModel(id) {
    const list = (this.state.models || []).filter(m => m.id !== id);
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
  async getModels() { return this.request("models:list"); }
  async getModel(id) { return this.request("models:get", { modelId: id }); }
  async createModel(m) { return this.request("models:create", { model: m }); }
  async updateModel(id, u) {
    return this.request("models:update", { modelId: id, updates: u });
  }
  async deleteModel(id) { return this.request("models:delete", { modelId: id }); }
  async startModel(id) { return this.request("models:start", { modelId: id }); }
  async stopModel(id) { return this.request("models:stop", { modelId: id }); }
  async scanModels() { return this.request("models:scan"); }
  async getMetrics() { return this.request("metrics:get"); }
  async getMetricsHistory(p) { return this.request("metrics:history", p); }
  async getLogs(p) { return this.request("logs:get", p); }
  async clearLogs() { return this.request("logs:clear"); }
  async getConfig() { return this.request("config:get"); }
  async updateConfig(c) { return this.request("config:update", { config: c }); }
  async getSettings() { return this.request("settings:get"); }
  async updateSettings(s) { return this.request("settings:update", { settings: s }); }
  async getLlamaStatus() { return this.request("llama:status"); }
  async startLlama() { return this.request("llama:start"); }
  async stopLlama() { return this.request("llama:stop"); }
}

const stateManager = new StateManager();
window.StateManager = StateManager;
window.stateManager = stateManager;
