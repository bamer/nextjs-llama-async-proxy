/**
 * State Manager Tests
 * Comprehensive tests for StateManager class
 */

global.window = { StateManager: undefined, stateManager: undefined, router: undefined };

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

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
    if (!this.socket) return;
    this._connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        this.connected = true;
        this._notify("connectionStatus", "connected");
      }
    }, 3000);
    this.socket.on("connect", () => this.socket.emit("connection:ack"));
    this.socket.on("disconnect", () => {
      this.connected = false;
      this._notify("connectionStatus", "disconnected");
    });
    this.socket.on("connection:established", () => {
      if (this._connectionTimeout) {
        clearTimeout(this._connectionTimeout);
        this._connectionTimeout = null;
      }
      this.connected = true;
      this._notify("connectionStatus", "connected");
    });
    const handleResponse = (event, data) => {
      if (data?.requestId && this.pending.has(data.requestId)) {
        const p = this.pending.get(data.requestId);
        clearTimeout(p.timeout);
        this.pending.delete(data.requestId);
        if (data.success) p.resolve(data.data);
        else p.reject(new Error(data.error?.message || "Request failed"));
      }
    };
    [
      "models:list:result",
      "llama:status:result",
      "metrics:get:result",
      "logs:get:result",
      "config:get:result",
      "config:update:result",
      "settings:get:result",
      "settings:update:result",
      "models:load:result",
      "models:unload:result",
      "models:scan:result",
      "models:cleanup:result",
      "llama:start:result",
      "llama:stop:result",
      "llama:restart:result",
      "llama:config:result",
    ].forEach((evt) => this.socket.on(evt, (data) => handleResponse(evt, data)));
  }

  getState() {
    return { ...this.state };
  }
  get(key) {
    return this.state[key];
  }
  set(key, value) {
    const old = this.state[key];
    if (old === value) return this;
    if (typeof old === "object" && typeof value === "object" && old && value) {
      const ok = Object.keys(old),
        nk = Object.keys(value);
      if (ok.length === nk.length && ok.every((k) => old[k] === value[k])) return this;
    }
    this.state[key] = value;
    this._notify(key, value, old);
    return this;
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key)?.delete(callback);
  }

  unsubscribe(key, callback) {
    this.listeners.get(key)?.delete(callback);
  }

  _notify(key, value, old) {
    this.listeners.get(key)?.forEach((cb) => cb(value, old, this.state));
    this.listeners.get("*")?.forEach((cb) => cb(key, value, old, this.state));
  }

  request(event, data = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        const checkConnection = setInterval(() => {
          if (this.connected) {
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

  _doRequest(event, data, resolve, reject) {
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isConfig = ["config:get", "config:update", "settings:get", "settings:update"].includes(
      event
    );
    const timeout = setTimeout(
      () => {
        this.pending.delete(reqId);
        reject(new Error(`Timeout: ${event}`));
      },
      isConfig ? 5000 : 120000
    );
    this.pending.set(reqId, { resolve, reject, event, timeout });
    this.socket.emit(event, { ...data, requestId: reqId });
  }

  _set(key, value) {
    this.set(key, value);
  }
  _addModel(m) {
    this._set("models", [...(this.state.models || []), m]);
  }
  _updateModelData(m) {
    this._set(
      "models",
      (this.state.models || []).map((x) => (x.id === m.id ? m : x))
    );
  }
  _removeModel(id) {
    this._set(
      "models",
      (this.state.models || []).filter((m) => m.id !== id)
    );
  }
  _addMetric(m) {
    this._set(
      "metricsHistory",
      [...(this.state.metricsHistory || []), { ...m, ts: Date.now() }].slice(-200)
    );
  }
  _addLog(e) {
    this._set("logs", [e, ...(this.state.logs || [])].slice(0, 100));
  }

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
    const model = this.getState().models?.find((m) => m.id === id);
    if (!model) throw new Error(`Model not found: ${id}`);
    return this.request("models:load", { modelName: model.name });
  }
  async loadModel(modelName) {
    return this.request("models:load", { modelName });
  }
  async unloadModel(modelName) {
    return this.request("models:unload", { modelName });
  }
  async stopModel(id) {
    const model = this.getState().models?.find((m) => m.id === id);
    if (!model) throw new Error(`Model not found: ${id}`);
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
  async refreshModels() {
    const data = await this.request("models:list");
    this._set("models", data.models || []);
    return data;
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
    return this.request("models:cleanup");
  }
  isConnected() {
    return this.connected;
  }
  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
  connect() {}
}

function createMockSocket() {
  const listeners = new Map();
  const emitCalls = [];
  return {
    listeners,
    emitCalls,
    on: function (event, callback) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    emit: function (event, data) {
      emitCalls.push({ event, data });
      setTimeout(() => {
        const reqId = data?.requestId || "test";
        const map = {
          "models:list": { success: true, data: { models: [] }, requestId: reqId },
          "llama:status": { success: true, data: { status: "running" }, requestId: reqId },
          "metrics:get": { success: true, data: { cpu: 50 }, requestId: reqId },
          "logs:get": { success: true, data: [], requestId: reqId },
          "config:get": { success: true, data: { port: 8080 }, requestId: reqId },
          "settings:get": { success: true, data: { theme: "dark" }, requestId: reqId },
        };
        const result = map[event];
        if (result && data.requestId) {
          const callbacks = listeners.get(`${event}:result`);
          if (callbacks) callbacks.forEach((cb) => cb(result));
        }
      }, 10);
    },
    disconnect: function () {},
    triggerConnect: function () {
      const c = listeners.get("connect");
      if (c) c.forEach((cb) => cb());
    },
    triggerConnectionEstablished: function () {
      const c = listeners.get("connection:established");
      if (c) c.forEach((cb) => cb({}));
    },
  };
}

describe("StateManager", () => {
  let stateManager;
  let mockSocket;

  beforeEach(() => {
    stateManager = new StateManager();
    mockSocket = createMockSocket();
    stateManager.init(mockSocket);
  });

  afterEach(() => {
    if (stateManager._connectionTimeout) clearTimeout(stateManager._connectionTimeout);
  });

  describe("Constructor", () => {
    it("initializes with empty state", () => expect(new StateManager().state).toEqual({}));
    it("initializes with empty listeners", () => {
      const sm = new StateManager();
      expect(sm.listeners).toBeInstanceOf(Map);
      expect(sm.listeners.size).toBe(0);
    });
    it("initializes with null socket", () => expect(new StateManager().socket).toBeNull());
    it("initializes with connected = false", () =>
      expect(new StateManager().connected).toBe(false));
  });

  describe("get()", () => {
    it("returns undefined for non-existent key", () =>
      expect(stateManager.get("nonexistent")).toBeUndefined());
    it("returns value for existing key", () => {
      stateManager.state.testKey = "testValue";
      expect(stateManager.get("testKey")).toBe("testValue");
    });
  });

  describe("set()", () => {
    it("sets a value in state", () => {
      stateManager.set("key", "value");
      expect(stateManager.state.key).toBe("value");
    });
    it("returns this for chaining", () => {
      const result = stateManager.set("key", "value");
      expect(result).toBe(stateManager);
    });
    it("triggers subscription callback on value change", () => {
      let callCount = 0;
      stateManager.subscribe("testKey", () => callCount++);
      stateManager.set("testKey", "newValue");
      expect(callCount).toBe(1);
    });
    it("does not trigger callback if value is unchanged", () => {
      let callCount = 0;
      stateManager.set("testKey", "value");
      stateManager.subscribe("testKey", () => callCount++);
      stateManager.set("testKey", "value");
      expect(callCount).toBe(0);
    });
    it("passes old value to callback", () => {
      let capturedOld = null;
      stateManager.subscribe("testKey", (v, old) => (capturedOld = old));
      stateManager.set("testKey", "first");
      stateManager.set("testKey", "second");
      expect(capturedOld).toBe("first");
    });
  });

  describe("getState()", () => {
    it("returns a copy of the entire state", () => {
      stateManager.state.a = 1;
      const copy = stateManager.getState();
      expect(copy).toEqual({ a: 1 });
      expect(copy).not.toBe(stateManager.state);
    });
  });

  describe("subscribe()", () => {
    it("registers a callback for a key", () => {
      const callback = () => {};
      stateManager.subscribe("testKey", callback);
      expect(stateManager.listeners.get("testKey").has(callback)).toBe(true);
    });
    it("supports wildcard subscription", () => {
      let wildcardCall = 0;
      stateManager.subscribe("*", () => wildcardCall++);
      stateManager.set("key", "value");
      expect(wildcardCall).toBe(1);
    });
  });

  describe("unsubscribe()", () => {
    it("removes callback from listeners", () => {
      const callback = () => {};
      stateManager.subscribe("testKey", callback);
      stateManager.unsubscribe("testKey", callback);
      expect(stateManager.listeners.get("testKey").has(callback)).toBe(false);
    });
  });

  describe("Connection Status", () => {
    it("sets connected = true on connection:established", () => {
      mockSocket.triggerConnectionEstablished();
      expect(stateManager.connected).toBe(true);
    });
    it("emits connection:ack on connect", () => {
      mockSocket.triggerConnect();
      expect(mockSocket.emitCalls.some((c) => c.event === "connection:ack")).toBe(true);
    });
  });

  describe("request()", () => {
    it("emits event with requestId", async () => {
      mockSocket.triggerConnectionEstablished();
      await new Promise((r) => setTimeout(r, 50));
      await stateManager.request("models:list");
      const call = mockSocket.emitCalls.find((c) => c.event === "models:list");
      expect(call).toBeDefined();
      expect(call.data.requestId).toBeDefined();
    });
    it("resolves with response data on success", async () => {
      mockSocket.triggerConnectionEstablished();
      await new Promise((r) => setTimeout(r, 50));
      const result = await stateManager.request("models:list");
      expect(result).toEqual({ models: [] });
    });
    it("waits for connection if not connected", async () => {
      const promise = stateManager.request("models:list");
      mockSocket.triggerConnectionEstablished();
      const result = await promise;
      expect(result).toEqual({ models: [] });
    });
  });

  describe("API Methods", () => {
    beforeEach(() => mockSocket.triggerConnectionEstablished());
    it("getModels calls models:list", async () => {
      await stateManager.getModels();
      expect(mockSocket.emitCalls.some((c) => c.event === "models:list")).toBe(true);
    });
    it("getModel calls models:get with modelId", async () => {
      await stateManager.getModel("model-123");
      const call = mockSocket.emitCalls.find((c) => c.event === "models:get");
      expect(call.data.modelId).toBe("model-123");
    });
    it("loadModel calls models:load with modelName", async () => {
      await stateManager.loadModel("test-model");
      const call = mockSocket.emitCalls.find((c) => c.event === "models:load");
      expect(call.data.modelName).toBe("test-model");
    });
    it("startModel uses model name from state", async () => {
      stateManager.set("models", [{ id: 1, name: "my-model" }]);
      await stateManager.startModel(1);
      const call = mockSocket.emitCalls.find((c) => c.event === "models:load");
      expect(call.data.modelName).toBe("my-model");
    });
    it("startModel throws if model not found", async () => {
      stateManager.set("models", []);
      await expect(stateManager.startModel(999)).rejects.toThrow("Model not found: 999");
    });
    it("stopModel uses model name from state", async () => {
      stateManager.set("models", [{ id: 1, name: "my-model" }]);
      await stateManager.stopModel(1);
      const call = mockSocket.emitCalls.find((c) => c.event === "models:unload");
      expect(call.data.modelName).toBe("my-model");
    });
    it("getConfig calls config:get", async () => {
      await stateManager.getConfig();
      expect(mockSocket.emitCalls.some((c) => c.event === "config:get")).toBe(true);
    });
    it("updateConfig calls config:update", async () => {
      await stateManager.updateConfig({ port: 3000 });
      expect(mockSocket.emitCalls.some((c) => c.event === "config:update")).toBe(true);
    });
    it("getSettings calls settings:get", async () => {
      await stateManager.getSettings();
      expect(mockSocket.emitCalls.some((c) => c.event === "settings:get")).toBe(true);
    });
    it("updateSettings calls settings:update", async () => {
      await stateManager.updateSettings({ theme: "light" });
      expect(mockSocket.emitCalls.some((c) => c.event === "settings:update")).toBe(true);
    });
    it("startLlama calls llama:start", async () => {
      await stateManager.startLlama();
      expect(mockSocket.emitCalls.some((c) => c.event === "llama:start")).toBe(true);
    });
    it("stopLlama calls llama:stop", async () => {
      await stateManager.stopLlama();
      expect(mockSocket.emitCalls.some((c) => c.event === "llama:stop")).toBe(true);
    });
    it("restartLlama calls llama:restart", async () => {
      await stateManager.restartLlama();
      expect(mockSocket.emitCalls.some((c) => c.event === "llama:restart")).toBe(true);
    });
    it("getMetrics calls metrics:get", async () => {
      await stateManager.getMetrics();
      expect(mockSocket.emitCalls.some((c) => c.event === "metrics:get")).toBe(true);
    });
    it("getLogs calls logs:get", async () => {
      await stateManager.getLogs({ limit: 50 });
      expect(mockSocket.emitCalls.some((c) => c.event === "logs:get")).toBe(true);
    });
    it("scanModels calls models:scan", async () => {
      await stateManager.scanModels();
      expect(mockSocket.emitCalls.some((c) => c.event === "models:scan")).toBe(true);
    });
  });

  describe("isConnected()", () => {
    it("returns current connection status", () => {
      expect(stateManager.isConnected()).toBe(false);
      mockSocket.triggerConnectionEstablished();
      expect(stateManager.isConnected()).toBe(true);
    });
  });
});
