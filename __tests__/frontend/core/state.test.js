/**
 * State Manager Tests
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
    ["models:list:result", "llama:status:result"].forEach((evt) =>
      this.socket.on(evt, (data) => handleResponse(evt, data))
    );
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
        }, 10);
        setTimeout(() => {
          clearInterval(checkConnection);
          reject(new Error("Connection timeout"));
        }, 5000);
        return;
      }
      this._doRequest(event, data, resolve, reject);
    });
  }

  _doRequest(event, data, resolve, reject) {
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isConfig = ["config:get", "config:update"].includes(event);
    const timeout = setTimeout(
      () => {
        this.pending.delete(reqId);
        reject(new Error(`Timeout: ${event}`));
      },
      isConfig ? 2000 : 5000
    );
    this.pending.set(reqId, { resolve, reject, event, timeout });
    this.socket.emit(event, { ...data, requestId: reqId });
  }

  async getModels() {
    return this.request("models:list");
  }
  async getModel(id) {
    return this.request("models:get", { modelId: id });
  }
  async startModel(id) {
    const model = this.getState().models?.find((m) => m.id === id);
    if (!model) throw new Error(`Model not found: ${id}`);
    return this.request("models:load", { modelName: model.name });
  }
  async stopModel(id) {
    const model = this.getState().models?.find((m) => m.id === id);
    if (!model) throw new Error(`Model not found: ${id}`);
    return this.request("models:unload", { modelName: model.name });
  }
  async getConfig() {
    return this.request("config:get");
  }
  async getSettings() {
    return this.request("settings:get");
  }
  async startLlama() {
    return this.request("llama:start");
  }
  async stopLlama() {
    return this.request("llama:stop");
  }
  isConnected() {
    return this.connected;
  }
  disconnect() {
    if (this.socket) this.socket.disconnect();
  }
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
    it("initializes with empty pending Map", () => {
      const sm = new StateManager();
      expect(sm.pending).toBeInstanceOf(Map);
      expect(sm.pending.size).toBe(0);
    });
  });

  describe("get()", () => {
    it("returns undefined for non-existent key", () =>
      expect(stateManager.get("nonexistent")).toBeUndefined());
    it("returns value for existing key", () => {
      stateManager.state.testKey = "testValue";
      expect(stateManager.get("testKey")).toBe("testValue");
    });
    it("returns null for key with null value", () => {
      stateManager.set("nullKey", null);
      expect(stateManager.get("nullKey")).toBeNull();
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
    it("does not trigger callback if object is shallowly equal", () => {
      let callCount = 0;
      const obj = { a: 1, b: 2 };
      stateManager.set("testKey", obj);
      stateManager.subscribe("testKey", () => callCount++);
      stateManager.set("testKey", { a: 1, b: 2 });
      expect(callCount).toBe(0);
    });
    it("triggers callback if object content changes", () => {
      let callCount = 0;
      stateManager.set("testKey", { a: 1 });
      stateManager.subscribe("testKey", () => callCount++);
      stateManager.set("testKey", { a: 2 });
      expect(callCount).toBe(1);
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
    it("allows multiple callbacks", () => {
      let c1 = 0,
        c2 = 0;
      stateManager.subscribe("testKey", () => c1++);
      stateManager.subscribe("testKey", () => c2++);
      stateManager.set("testKey", "v");
      expect(c1).toBe(1);
      expect(c2).toBe(1);
    });
    it("returns unsubscribe function", () => {
      let count = 0;
      const cb = () => count++;
      const unsub = stateManager.subscribe("testKey", cb);
      unsub();
      stateManager.set("testKey", "v");
      expect(count).toBe(0);
    });
    it("supports wildcard subscription", () => {
      let wc = 0,
        kc = 0;
      stateManager.subscribe("*", () => wc++);
      stateManager.subscribe("key", () => kc++);
      stateManager.set("key", "v");
      expect(wc).toBe(1);
      expect(kc).toBe(1);
    });
  });

  describe("unsubscribe()", () => {
    it("removes callback from listeners", () => {
      const cb = () => {};
      stateManager.subscribe("testKey", cb);
      stateManager.unsubscribe("testKey", cb);
      expect(stateManager.listeners.get("testKey").has(cb)).toBe(false);
    });
    it("does not affect other callbacks", () => {
      let c1 = 0,
        c2 = 0;
      const cb1 = () => c1++;
      const cb2 = () => c2++;
      stateManager.subscribe("testKey", cb1);
      stateManager.subscribe("testKey", cb2);
      stateManager.unsubscribe("testKey", cb1);
      stateManager.set("testKey", "v");
      expect(c1).toBe(0);
      expect(c2).toBe(1);
    });
  });

  describe("Connection Status", () => {
    it("starts with connected = false", () => expect(stateManager.connected).toBe(false));
    it("sets connected = true on connection:established", () => {
      mockSocket.triggerConnectionEstablished();
      expect(stateManager.connected).toBe(true);
    });
    it("emits connection:ack on connect", () => {
      mockSocket.triggerConnect();
      expect(mockSocket.emitCalls.some((c) => c.event === "connection:ack")).toBe(true);
    });
  });

  describe("API Methods (emit verification)", () => {
    beforeEach(() => mockSocket.triggerConnectionEstablished());
    it("getModels emits models:list event", () => {
      stateManager.getModels();
      expect(mockSocket.emitCalls.some((c) => c.event === "models:list")).toBe(true);
    });
    it("getModel emits models:get event", () => {
      stateManager.getModel("model-123");
      const call = mockSocket.emitCalls.find((c) => c.event === "models:get");
      expect(call.data.modelId).toBe("model-123");
    });
    it("startModel uses model name from state", () => {
      stateManager.set("models", [{ id: 1, name: "my-model" }]);
      stateManager.startModel(1);
      const call = mockSocket.emitCalls.find((c) => c.event === "models:load");
      expect(call.data.modelName).toBe("my-model");
    });
    it("startModel throws if model not found", async () => {
      stateManager.set("models", []);
      await expect(stateManager.startModel(999)).rejects.toThrow("Model not found: 999");
    });
    it("getConfig emits config:get event", () => {
      stateManager.getConfig();
      expect(mockSocket.emitCalls.some((c) => c.event === "config:get")).toBe(true);
    });
    it("getSettings emits settings:get event", () => {
      stateManager.getSettings();
      expect(mockSocket.emitCalls.some((c) => c.event === "settings:get")).toBe(true);
    });
    it("startLlama emits llama:start event", () => {
      stateManager.startLlama();
      expect(mockSocket.emitCalls.some((c) => c.event === "llama:start")).toBe(true);
    });
    it("stopLlama emits llama:stop event", () => {
      stateManager.stopLlama();
      expect(mockSocket.emitCalls.some((c) => c.event === "llama:stop")).toBe(true);
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
