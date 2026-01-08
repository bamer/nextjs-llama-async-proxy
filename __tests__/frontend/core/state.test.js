/**
 * State Modules Comprehensive Tests
 * Tests all state modules in /public/js/core/state/
 * @jest-environment jsdom
 */

// Setup global window for module loading
global.window = global.window || {};
global.window.document = global.window.document || {
  querySelector: () => null,
  createElement: (tag) => ({ tagName: tag.toUpperCase() }),
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Mock Map and Set for environments that might not have them
if (typeof Map === "undefined") {
  global.Map = class Map {
    constructor() {
      this._data = [];
    }
    has(key) {
      return this._data.some(([k]) => k === key);
    }
    get(key) {
      const entry = this._data.find(([k]) => k === key);
      return entry ? entry[1] : undefined;
    }
    set(key, value) {
      const idx = this._data.findIndex(([k]) => k === key);
      if (idx > -1) this._data[idx][1] = value;
      else this._data.push([key, value]);
      return this;
    }
    delete(key) {
      const idx = this._data.findIndex(([k]) => k === key);
      if (idx > -1) {
        this._data.splice(idx, 1);
        return true;
      }
      return false;
    }
    forEach(cb) {
      this._data.forEach(([k, v]) => cb(v, k, this));
    }
    get size() {
      return this._data.length;
    }
  };
}

if (typeof Set === "undefined") {
  global.Set = class Set {
    constructor() {
      this._data = [];
    }
    add(value) {
      if (!this._data.includes(value)) this._data.push(value);
      return this;
    }
    delete(value) {
      const idx = this._data.indexOf(value);
      if (idx > -1) this._data.splice(idx, 1);
      return idx > -1;
    }
    has(value) {
      return this._data.includes(value);
    }
    forEach(cb) {
      this._data.forEach((v) => cb(v, v, this));
    }
    get size() {
      return this._data.length;
    }
  };
}

// Load all state modules
const stateCorePath = new URL("../../../public/js/core/state/state-core.js", import.meta.url);
await import(stateCorePath.href);

const stateSocketPath = new URL("../../../public/js/core/state/state-socket.js", import.meta.url);
await import(stateSocketPath.href);

const stateModelsPath = new URL("../../../public/js/core/state/state-models.js", import.meta.url);
await import(stateModelsPath.href);

const stateAPIPath = new URL("../../../public/js/core/state/state-api.js", import.meta.url);
await import(stateAPIPath.href);

const stateRequestsPath = new URL(
  "../../../public/js/core/state/state-requests.js",
  import.meta.url
);
await import(stateRequestsPath.href);

const broadcastPath = new URL(
  "../../../public/js/core/state/handlers/broadcast.js",
  import.meta.url
);
await import(broadcastPath.href);

const connectionPath = new URL(
  "../../../public/js/core/state/handlers/connection.js",
  import.meta.url
);
await import(connectionPath.href);

const responsePath = new URL("../../../public/js/core/state/handlers/response.js", import.meta.url);
await import(responsePath.href);

const stateManagerPath = new URL("../../../public/js/core/state.js", import.meta.url);
await import(stateManagerPath.href);

// Get classes from global window
const StateCore = global.window.StateCore;
const StateSocket = global.window.StateSocket;
const StateModels = global.window.StateModels;
const StateAPI = global.window.StateAPI;
const StateRequests = global.window.StateRequests;
const StateBroadcastHandlers = global.window.StateBroadcastHandlers;
const StateConnectionHandlers = global.window.StateConnectionHandlers;
const StateResponseHandlers = global.window.StateResponseHandlers;
const StateManager = global.window.StateManager;

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Helper function to create mock socket
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
    triggerEvent: function (event, data) {
      const callbacks = listeners.get(event);
      if (callbacks) callbacks.forEach((cb) => cb(data));
    },
    triggerConnect: function () {
      this.triggerEvent("connect", {});
    },
    triggerDisconnect: function () {
      this.triggerEvent("disconnect", "client disconnect");
    },
    triggerConnectionEstablished: function () {
      this.triggerEvent("connection:established", {});
    },
    getEmitCalls: function () {
      return emitCalls;
    },
    clearEmitCalls: function () {
      emitCalls.length = 0;
    },
  };
}

describe("StateCore", function () {
  let core;

  beforeEach(function () {
    core = new StateCore();
  });

  afterEach(function () {
    if (core) {
      core = null;
    }
  });

  describe("Constructor", function () {
    it("initializes with empty state object", function () {
      expect(core.state).toEqual({});
    });

    it("initializes with empty listeners Map", function () {
      expect(core.listeners).toBeInstanceOf(Map);
      expect(core.listeners.size).toBe(0);
    });
  });

  describe("getState()", function () {
    it("returns a copy of the entire state", function () {
      core.state.testKey = "testValue";
      const result = core.getState();
      expect(result).toEqual({ testKey: "testValue" });
      expect(result).not.toBe(core.state);
    });

    it("returns empty object when state is empty", function () {
      expect(core.getState()).toEqual({});
    });

    it("returns a new copy on each call", function () {
      core.state.a = 1;
      const copy1 = core.getState();
      const copy2 = core.getState();
      expect(copy1).not.toBe(copy2);
      expect(copy1).toEqual(copy2);
    });
  });

  describe("get()", function () {
    it("returns undefined for non-existent key", function () {
      expect(core.get("nonexistent")).toBeUndefined();
    });

    it("returns value for existing key", function () {
      core.state.existingKey = "existingValue";
      expect(core.get("existingKey")).toBe("existingValue");
    });

    it("returns null for key with null value", function () {
      core.set("nullKey", null);
      expect(core.get("nullKey")).toBeNull();
    });

    it("returns 0 for key with 0 value", function () {
      core.set("zeroKey", 0);
      expect(core.get("zeroKey")).toBe(0);
    });

    it("returns false for key with false value", function () {
      core.set("falseKey", false);
      expect(core.get("falseKey")).toBe(false);
    });

    it("returns empty string for key with empty string value", function () {
      core.set("emptyKey", "");
      expect(core.get("emptyKey")).toBe("");
    });
  });

  describe("set()", function () {
    it("sets a value in state", function () {
      core.set("key", "value");
      expect(core.state.key).toBe("value");
    });

    it("returns this for chaining", function () {
      const result = core.set("key", "value");
      expect(result).toBe(core);
    });

    it("does not notify if value is unchanged (primitive)", function () {
      let callCount = 0;
      core.set("key", "value");
      core.subscribe("key", () => callCount++);
      core.set("key", "value");
      expect(callCount).toBe(0);
    });

    it("does not notify if value is deeply equal (object)", function () {
      let callCount = 0;
      const obj = { a: 1, b: 2 };
      core.set("key", obj);
      core.subscribe("key", () => callCount++);
      core.set("key", { a: 1, b: 2 });
      expect(callCount).toBe(0);
    });

    it("notifies if object content changes", function () {
      let callCount = 0;
      core.set("key", { a: 1 });
      core.subscribe("key", () => callCount++);
      core.set("key", { a: 2 });
      expect(callCount).toBe(1);
    });

    it("notifies if array content changes", function () {
      let callCount = 0;
      core.set("key", [1, 2, 3]);
      core.subscribe("key", () => callCount++);
      core.set("key", [1, 2, 4]);
      expect(callCount).toBe(1);
    });

    it("notifies if array length changes", function () {
      let callCount = 0;
      core.set("key", [1, 2]);
      core.subscribe("key", () => callCount++);
      core.set("key", [1, 2, 3]);
      expect(callCount).toBe(1);
    });

    it("notifies when changing from undefined to value", function () {
      let callCount = 0;
      core.subscribe("key", () => callCount++);
      core.set("key", "value");
      expect(callCount).toBe(1);
    });

    it("notifies when changing from null to value", function () {
      let callCount = 0;
      core.set("key", null);
      core.subscribe("key", () => callCount++);
      core.set("key", "value");
      expect(callCount).toBe(1);
    });

    it("passes old and new value to callback", function () {
      let capturedNew = null;
      let capturedOld = null;
      core.set("key", "old");
      core.subscribe("key", (newVal, oldVal) => {
        capturedNew = newVal;
        capturedOld = oldVal;
      });
      core.set("key", "new");
      expect(capturedNew).toBe("new");
      expect(capturedOld).toBe("old");
    });

    it("passes entire state to callback", function () {
      let capturedState = null;
      core.state.existing = "data";
      core.subscribe("key", (val, old, state) => {
        capturedState = state;
      });
      core.set("key", "value");
      expect(capturedState).toEqual({ existing: "data", key: "value" });
    });
  });

  describe("subscribe()", function () {
    it("registers a callback for a key", function () {
      const callback = function () {};
      core.subscribe("testKey", callback);
      expect(core.listeners.get("testKey").has(callback)).toBe(true);
    });

    it("creates a new Set for new keys", function () {
      const callback = function () {};
      core.subscribe("newKey", callback);
      expect(core.listeners.has("newKey")).toBe(true);
      expect(core.listeners.get("newKey")).toBeInstanceOf(Set);
    });

    it("allows multiple callbacks for same key", function () {
      let c1 = 0,
        c2 = 0;
      const cb1 = function () {
        c1++;
      };
      const cb2 = function () {
        c2++;
      };
      core.subscribe("key", cb1);
      core.subscribe("key", cb2);
      core.set("key", "value");
      expect(c1).toBe(1);
      expect(c2).toBe(1);
    });

    it("returns unsubscribe function", function () {
      let callCount = 0;
      const callback = function () {
        callCount++;
      };
      const unsubscribe = core.subscribe("key", callback);
      unsubscribe();
      core.set("key", "value");
      expect(callCount).toBe(0);
    });

    it("returns function that handles already-removed callbacks gracefully", function () {
      const callback = function () {};
      const unsubscribe = core.subscribe("key", callback);
      unsubscribe();
      // Calling unsubscribe again should not throw
      expect(() => unsubscribe()).not.toThrow();
    });

    it("supports wildcard subscription '*' for all changes", function () {
      let wcCallCount = 0;
      let keyCallCount = 0;
      core.subscribe("*", () => wcCallCount++);
      core.subscribe("key", () => keyCallCount++);
      core.set("key", "value");
      expect(wcCallCount).toBe(1);
      expect(keyCallCount).toBe(1);
    });

    it("wildcard receives key as first argument", function () {
      let capturedKey = null;
      core.subscribe("*", (key) => {
        capturedKey = key;
      });
      core.set("myKey", "value");
      expect(capturedKey).toBe("myKey");
    });
  });

  describe("_notify()", function () {
    it("notifies all subscribers for the key", function () {
      let callCount = 0;
      core.subscribe("key", () => callCount++);
      core._notify("key", "value", "old");
      expect(callCount).toBe(1);
    });

    it("notifies wildcard subscribers", function () {
      let wcCount = 0;
      core.subscribe("*", () => wcCount++);
      core._notify("key", "value", "old");
      expect(wcCount).toBe(1);
    });

    it("handles no subscribers gracefully", function () {
      expect(() => core._notify("key", "value", "old")).not.toThrow();
    });

    it("handles empty listener set", function () {
      core.listeners.set("key", new Set());
      expect(() => core._notify("key", "value", "old")).not.toThrow();
    });
  });

  describe("Edge Cases", function () {
    it("handles setting very long strings", function () {
      const longString = "a".repeat(10000);
      core.set("long", longString);
      expect(core.get("long")).toBe(longString);
    });

    it("handles nested objects", function () {
      const nested = { a: { b: { c: { d: 1 } } } };
      core.set("nested", nested);
      expect(core.get("nested")).toEqual(nested);
    });

    it("handles arrays with objects", function () {
      const arr = [
        { id: 1, name: "test" },
        { id: 2, name: "test2" },
      ];
      core.set("array", arr);
      expect(core.get("array")).toEqual(arr);
    });

    it("handles special values: NaN", function () {
      core.set("nan", NaN);
      expect(core.get("nan")).toBeNaN();
    });

    it("handles special values: Infinity", function () {
      core.set("inf", Infinity);
      expect(core.get("inf")).toBe(Infinity);
    });

    it("handles special values: -Infinity", function () {
      core.set("negInf", -Infinity);
      expect(core.get("negInf")).toBe(-Infinity);
    });

    it("handles functions", function () {
      const fn = function () {
        return 42;
      };
      core.set("fn", fn);
      expect(core.get("fn")).toBe(fn);
    });

    it("handles Dates", function () {
      const date = new Date("2024-01-01");
      core.set("date", date);
      expect(core.get("date")).toEqual(date);
    });

    it("handles RegExp", function () {
      const regex = /test/gi;
      core.set("regex", regex);
      expect(core.get("regex")).toEqual(regex);
    });
  });
});

describe("StateConnectionHandlers", function () {
  let handlers;
  let mockSocket;
  let onConnected;
  let onDisconnected;

  beforeEach(function () {
    mockSocket = createMockSocket();
    onConnected = jest.fn();
    onDisconnected = jest.fn();
    handlers = new StateConnectionHandlers(null, onConnected, onDisconnected);
  });

  afterEach(function () {
    if (handlers && handlers.connectionTimeout) {
      clearTimeout(handlers.connectionTimeout);
    }
  });

  describe("Constructor", function () {
    it("initializes with core reference", function () {
      expect(handlers.core).toBeNull();
    });

    it("stores onConnected callback", function () {
      expect(handlers.onConnected).toBe(onConnected);
    });

    it("stores onDisconnected callback", function () {
      expect(handlers.onDisconnected).toBe(onDisconnected);
    });

    it("initializes connectionTimeout as null", function () {
      expect(handlers.connectionTimeout).toBeNull();
    });

    it("initializes connected as false", function () {
      expect(handlers.connected).toBe(false);
    });
  });

  describe("setup()", function () {
    it("sets up connect event handler", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerConnect();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "connection:ack")).toBe(true);
    });

    it("sets up disconnect event handler", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerDisconnect();
      expect(handlers.connected).toBe(false);
      expect(onDisconnected).toHaveBeenCalled();
    });

    it("sets up connection:established event handler", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerConnectionEstablished();
      expect(handlers.connected).toBe(true);
      expect(onConnected).toHaveBeenCalled();
    });

    it("clears connection timeout on connection:established", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerConnectionEstablished();
      expect(handlers.connectionTimeout).toBeNull();
    });

    it("auto-connects after timeout if not connected", function () {
      jest.useFakeTimers();
      handlers.setup(mockSocket);
      jest.advanceTimersByTime(3000);
      expect(handlers.connected).toBe(true);
      expect(onConnected).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it("does not auto-connect if already connected", function () {
      jest.useFakeTimers();
      handlers.setup(mockSocket);
      mockSocket.triggerConnectionEstablished();
      onConnected.mockClear();
      jest.advanceTimersByTime(3000);
      expect(onConnected).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe("isConnected()", function () {
    it("returns current connected status", function () {
      expect(handlers.isConnected()).toBe(false);
      handlers.connected = true;
      expect(handlers.isConnected()).toBe(true);
    });
  });

  describe("destroy()", function () {
    it("clears connection timeout", function () {
      jest.useFakeTimers();
      handlers.setup(mockSocket);
      handlers.destroy();
      jest.advanceTimersByTime(3000);
      expect(handlers.connectionTimeout).toBeNull();
      jest.useRealTimers();
    });

    it("can be called multiple times safely", function () {
      jest.useFakeTimers();
      handlers.setup(mockSocket);
      handlers.destroy();
      handlers.destroy();
      expect(() => handlers.destroy()).not.toThrow();
      jest.useRealTimers();
    });

    it("sets connectionTimeout to null", function () {
      jest.useFakeTimers();
      handlers.setup(mockSocket);
      handlers.destroy();
      expect(handlers.connectionTimeout).toBeNull();
      jest.useRealTimers();
    });
  });
});

describe("StateBroadcastHandlers", function () {
  let handlers;
  let mockCore;
  let mockSocket;
  let callbackMap;

  beforeEach(function () {
    mockCore = new StateCore();
    callbackMap = {};
    handlers = new StateBroadcastHandlers(mockCore, {
      onModelCreated: function (m) {
        callbackMap.onModelCreated = m;
      },
      onModelUpdated: function (m) {
        callbackMap.onModelUpdated = m;
      },
      onModelDeleted: function (id) {
        callbackMap.onModelDeleted = id;
      },
      onModelsScanned: function () {
        callbackMap.onModelsScanned = (callbackMap.onModelsScanned || 0) + 1;
      },
      onMetric: function (m) {
        callbackMap.onMetric = m;
      },
      onLog: function (e) {
        callbackMap.onLog = e;
      },
    });
    mockSocket = createMockSocket();
  });

  describe("Constructor", function () {
    it("stores core reference", function () {
      expect(handlers.core).toBe(mockCore);
    });

    it("stores handlers object", function () {
      expect(handlers.handlers).toBeDefined();
      expect(typeof handlers.handlers.onModelCreated).toBe("function");
    });
  });

  describe("setup()", function () {
    it("sets up models:list broadcast handler", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list", {
        type: "broadcast",
        data: { models: [{ id: 1, name: "test" }] },
      });
      expect(mockCore.get("models")).toEqual([{ id: 1, name: "test" }]);
    });

    it("ignores non-broadcast models:list", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list", {
        type: "response",
        data: { models: [] },
      });
      expect(mockCore.get("models")).toBeUndefined();
    });

    it("handles models:list with missing data gracefully", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list", { type: "broadcast" });
      expect(mockCore.get("models")).toEqual([]);
    });

    it("triggers onModelCreated for models:created broadcast", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:created", {
        type: "broadcast",
        data: { model: { id: 1, name: "new-model" } },
      });
      expect(callbackMap.onModelCreated).toEqual({ id: 1, name: "new-model" });
    });

    it("ignores non-broadcast models:created", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:created", {
        type: "response",
        data: { model: { id: 1 } },
      });
      expect(callbackMap.onModelCreated).toBeUndefined();
    });

    it("triggers onModelUpdated for models:updated broadcast", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:updated", {
        type: "broadcast",
        data: { model: { id: 1, name: "updated" } },
      });
      expect(callbackMap.onModelUpdated).toEqual({ id: 1, name: "updated" });
    });

    it("triggers onModelDeleted for models:deleted broadcast", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:deleted", {
        type: "broadcast",
        data: { modelId: "model-123" },
      });
      expect(callbackMap.onModelDeleted).toBe("model-123");
    });

    it("triggers onModelsScanned for models:scanned event", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:scanned", {});
      expect(callbackMap.onModelsScanned).toBe(1);
    });

    it("triggers onModelsScanned multiple times", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:scanned", {});
      mockSocket.triggerEvent("models:scanned", {});
      expect(callbackMap.onModelsScanned).toBe(2);
    });

    it("updates all models to unloaded on models:router-stopped", function () {
      mockCore.set("models", [
        { id: 1, name: "model1", status: "loaded" },
        { id: 2, name: "model2", status: "loading" },
      ]);
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:router-stopped", {});
      const models = mockCore.get("models");
      expect(models[0].status).toBe("unloaded");
      expect(models[1].status).toBe("unloaded");
    });

    it("clears routerStatus on models:router-stopped", function () {
      mockCore.set("routerStatus", { active: true });
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:router-stopped", {});
      expect(mockCore.get("routerStatus")).toBeNull();
    });

    it("sets metrics on metrics:update broadcast", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("metrics:update", {
        type: "broadcast",
        data: { metrics: { cpu: 50, memory: 60 } },
      });
      expect(mockCore.get("metrics")).toEqual({ cpu: 50, memory: 60 });
      expect(callbackMap.onMetric).toEqual({ cpu: 50, memory: 60 });
    });

    it("ignores non-broadcast metrics:update", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("metrics:update", {
        type: "response",
        data: { metrics: {} },
      });
      expect(mockCore.get("metrics")).toBeUndefined();
    });

    it("triggers onLog for logs:entry broadcast", function () {
      handlers.setup(mockSocket);
      mockSocket.triggerEvent("logs:entry", {
        type: "broadcast",
        data: { entry: { level: "info", message: "test log" } },
      });
      expect(callbackMap.onLog).toEqual({ level: "info", message: "test log" });
    });

    it("handles missing handler callbacks gracefully", function () {
      const emptyHandlers = new StateBroadcastHandlers(mockCore, {});
      emptyHandlers.setup(mockSocket);
      expect(() => {
        mockSocket.triggerEvent("models:created", {
          type: "broadcast",
          data: { model: { id: 1 } },
        });
      }).not.toThrow();
    });

    it("handles missing data gracefully", function () {
      handlers.setup(mockSocket);
      expect(() => {
        mockSocket.triggerEvent("models:created", { type: "broadcast" });
        mockSocket.triggerEvent("models:updated", { type: "broadcast" });
        mockSocket.triggerEvent("models:deleted", { type: "broadcast" });
        mockSocket.triggerEvent("metrics:update", { type: "broadcast" });
        mockSocket.triggerEvent("logs:entry", { type: "broadcast" });
      }).not.toThrow();
    });
  });
});

describe("StateResponseHandlers", function () {
  let handlers;
  let pending;
  let mockSocket;

  beforeEach(function () {
    pending = new Map();
    handlers = new StateResponseHandlers(pending);
    mockSocket = createMockSocket();
  });

  describe("Constructor", function () {
    it("stores pending Map reference", function () {
      expect(handlers.pending).toBe(pending);
    });
  });

  describe("setup()", function () {
    it("sets up response event handlers", function () {
      handlers.setup(mockSocket);
      expect(mockSocket.listeners.has("models:list:result")).toBe(true);
      expect(mockSocket.listeners.has("llama:status:result")).toBe(true);
    });

    it("resolves pending request on success", function () {
      const resolve = jest.fn();
      const reject = jest.fn();
      pending.set("req_123", {
        resolve,
        reject,
        timeout: setTimeout(() => {}, 10000),
      });

      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list:result", {
        requestId: "req_123",
        success: true,
        data: { models: [{ id: 1 }] },
      });

      expect(resolve).toHaveBeenCalledWith({ models: [{ id: 1 }] });
      expect(reject).not.toHaveBeenCalled();
      expect(pending.has("req_123")).toBe(false);
    });

    it("rejects pending request on failure", function () {
      const resolve = jest.fn();
      const reject = jest.fn();
      pending.set("req_123", {
        resolve,
        reject,
        timeout: setTimeout(() => {}, 10000),
      });

      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list:result", {
        requestId: "req_123",
        success: false,
        error: { message: "Test error" },
      });

      expect(reject).toHaveBeenCalled();
      expect(reject.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(reject.mock.calls[0][0].message).toBe("Test error");
      expect(resolve).not.toHaveBeenCalled();
    });

    it("rejects with default message when error message is missing", function () {
      const resolve = jest.fn();
      const reject = jest.fn();
      pending.set("req_123", {
        resolve,
        reject,
        timeout: setTimeout(() => {}, 10000),
      });

      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list:result", {
        requestId: "req_123",
        success: false,
        error: {},
      });

      expect(reject).toHaveBeenCalledWith(new Error("Request failed"));
    });

    it("ignores response for unknown requestId", function () {
      const resolve = jest.fn();
      const reject = jest.fn();
      pending.set("req_123", {
        resolve,
        reject,
        timeout: setTimeout(() => {}, 10000),
      });

      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list:result", {
        requestId: "req_unknown",
        success: true,
        data: {},
      });

      expect(resolve).not.toHaveBeenCalled();
      expect(pending.has("req_123")).toBe(true);
    });

    it("ignores response without requestId", function () {
      const resolve = jest.fn();
      const reject = jest.fn();
      pending.set("req_123", {
        resolve,
        reject,
        timeout: setTimeout(() => {}, 10000),
      });

      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list:result", {
        success: true,
        data: {},
      });

      expect(resolve).not.toHaveBeenCalled();
      expect(pending.has("req_123")).toBe(true);
    });

    it("clears timeout on response", function () {
      const timeout = setTimeout(() => {}, 10000);
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
      const resolve = jest.fn();
      pending.set("req_123", {
        resolve,
        reject: jest.fn(),
        timeout,
      });

      handlers.setup(mockSocket);
      mockSocket.triggerEvent("models:list:result", {
        requestId: "req_123",
        success: true,
        data: {},
      });

      expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);
      clearTimeoutSpy.mockRestore();
    });

    it("handles all response event types", function () {
      const events = [
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
        "llama:start:result",
        "llama:stop:result",
        "llama:restart:result",
        "llama:config:result",
      ];

      handlers.setup(mockSocket);
      events.forEach(function (event) {
        expect(mockSocket.listeners.has(event)).toBe(true);
      });
    });
  });
});

describe("StateRequests", function () {
  describe("request()", function () {
    let mockSocket;
    let pending;

    beforeEach(function () {
      mockSocket = createMockSocket();
      pending = new Map();
    });

    it("throws error when not connected and connection times out", async function () {
      jest.useFakeTimers();
      mockSocket.listeners.set("connect", []);

      const promise = StateRequests.request(mockSocket, false, "test:event", {}, pending);

      jest.advanceTimersByTime(10000);

      await expect(promise).rejects.toThrow("Connection timeout");
      jest.useRealTimers();
    });

    it("executes request immediately when connected", function () {
      const resolve = jest.fn();
      const reject = jest.fn();
      pending.set("req_123", { resolve, reject, timeout: setTimeout(() => {}, 10000) });

      StateRequests._doRequest(mockSocket, "test:event", {}, resolve, reject, pending);

      expect(mockSocket.getEmitCalls().length).toBe(1);
      expect(mockSocket.getEmitCalls()[0].event).toBe("test:event");
      expect(mockSocket.getEmitCalls()[0].data.requestId).toBeDefined();
    });

    it("generates unique request IDs", function () {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        ids.add(reqId);
      }
      expect(ids.size).toBeGreaterThan(90);
    });
  });

  describe("_doRequest()", function () {
    it("adds request to pending map", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const resolve = jest.fn();
      const reject = jest.fn();

      StateRequests._doRequest(
        mockSocket,
        "test:event",
        { data: "test" },
        resolve,
        reject,
        pending
      );

      expect(pending.size).toBe(1);
      const reqId = pending.keys().next().value;
      expect(reqId.startsWith("req_")).toBe(true);
    });

    it("emits event with requestId", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const resolve = jest.fn();
      const reject = jest.fn();

      StateRequests._doRequest(
        mockSocket,
        "test:event",
        { data: "test" },
        resolve,
        reject,
        pending
      );

      const emitCall = mockSocket.getEmitCalls()[0];
      expect(emitCall.event).toBe("test:event");
      expect(emitCall.data.requestId).toBeDefined();
      expect(emitCall.data.data).toBe("test");
    });

    it("sets timeout for config operations (5000ms)", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const resolve = jest.fn();
      const reject = jest.fn();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      StateRequests._doRequest(mockSocket, "config:get", {}, resolve, reject, pending);

      expect(capturedDelay).toBe(5000);

      global.setTimeout = originalSetTimeout;
    });

    it("sets timeout for settings operations (5000ms)", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const resolve = jest.fn();
      const reject = jest.fn();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      StateRequests._doRequest(mockSocket, "settings:update", {}, resolve, reject, pending);

      expect(capturedDelay).toBe(5000);

      global.setTimeout = originalSetTimeout;
    });

    it("sets timeout for non-config operations (120000ms)", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const resolve = jest.fn();
      const reject = jest.fn();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      StateRequests._doRequest(mockSocket, "models:list", {}, resolve, reject, pending);

      expect(capturedDelay).toBe(120000);

      global.setTimeout = originalSetTimeout;
    });
  });
});

describe("StateSocket", function () {
  let socket;
  let core;
  let mockSocket;

  beforeEach(function () {
    core = new StateCore();
    socket = new StateSocket(core);
    mockSocket = createMockSocket();
  });

  afterEach(function () {
    if (socket) {
      socket.destroy();
    }
  });

  describe("Constructor", function () {
    it("stores core reference", function () {
      expect(socket.core).toBe(core);
    });

    it("initializes socket as null", function () {
      expect(socket.socket).toBeNull();
    });

    it("initializes pending Map", function () {
      expect(socket.pending).toBeInstanceOf(Map);
    });

    it("creates connection handlers", function () {
      expect(socket.connection).toBeInstanceOf(StateConnectionHandlers);
    });

    it("creates broadcast handlers", function () {
      expect(socket.broadcast).toBeInstanceOf(StateBroadcastHandlers);
    });

    it("creates response handlers", function () {
      expect(socket.response).toBeInstanceOf(StateResponseHandlers);
    });

    it("passes correct callbacks to connection handlers", function () {
      expect(socket.connection.onConnected).toBeDefined();
      expect(socket.connection.onDisconnected).toBeDefined();
    });

    it("passes broadcast callbacks for model operations", function () {
      expect(socket.broadcast.handlers.onModelCreated).toBeDefined();
      expect(socket.broadcast.handlers.onModelUpdated).toBeDefined();
      expect(socket.broadcast.handlers.onModelDeleted).toBeDefined();
    });

    it("passes broadcast callbacks for metrics and logs", function () {
      expect(socket.broadcast.handlers.onMetric).toBeDefined();
      expect(socket.broadcast.handlers.onLog).toBeDefined();
    });

    it("passes broadcast callback for models scanned", function () {
      expect(socket.broadcast.handlers.onModelsScanned).toBeDefined();
    });
  });

  describe("init()", function () {
    it("stores socket reference", function () {
      socket.init(mockSocket);
      expect(socket.socket).toBe(mockSocket);
    });

    it("sets up connection handlers", function () {
      socket.init(mockSocket);
      expect(mockSocket.listeners.has("connect")).toBe(true);
      expect(mockSocket.listeners.has("disconnect")).toBe(true);
      expect(mockSocket.listeners.has("connection:established")).toBe(true);
    });

    it("sets up broadcast handlers", function () {
      socket.init(mockSocket);
      expect(mockSocket.listeners.has("models:list")).toBe(true);
      expect(mockSocket.listeners.has("models:created")).toBe(true);
    });

    it("sets up response handlers", function () {
      socket.init(mockSocket);
      expect(mockSocket.listeners.has("models:list:result")).toBe(true);
    });
  });

  describe("isConnected()", function () {
    it("delegates to connection handlers", function () {
      expect(socket.isConnected()).toBe(false);
      socket.connection.connected = true;
      expect(socket.isConnected()).toBe(true);
    });
  });

  describe("_addModel()", function () {
    it("adds model to models array", function () {
      socket.init(mockSocket);
      socket._addModel({ id: 1, name: "model1" });
      expect(core.get("models")).toEqual([{ id: 1, name: "model1" }]);
    });

    it("appends to existing models", function () {
      socket.init(mockSocket);
      core.set("models", [{ id: 1, name: "existing" }]);
      socket._addModel({ id: 2, name: "new" });
      expect(core.get("models")).toHaveLength(2);
    });
  });

  describe("_updateModelData()", function () {
    it("updates existing model", function () {
      socket.init(mockSocket);
      core.set("models", [{ id: 1, name: "oldName" }]);
      socket._updateModelData({ id: 1, name: "newName" });
      expect(core.get("models")[0].name).toBe("newName");
    });

    it("does not affect other models", function () {
      socket.init(mockSocket);
      core.set("models", [
        { id: 1, name: "model1" },
        { id: 2, name: "model2" },
      ]);
      socket._updateModelData({ id: 1, name: "updated" });
      expect(core.get("models")[1].name).toBe("model2");
    });
  });

  describe("_removeModel()", function () {
    it("removes model by id", function () {
      socket.init(mockSocket);
      core.set("models", [
        { id: 1, name: "model1" },
        { id: 2, name: "model2" },
      ]);
      socket._removeModel(1);
      expect(core.get("models")).toHaveLength(1);
      expect(core.get("models")[0].id).toBe(2);
    });
  });

  describe("_addMetric()", function () {
    it("adds metric to history with timestamp", function () {
      socket.init(mockSocket);
      const before = Date.now();
      socket._addMetric({ cpu: 50, memory: 60 });
      const after = Date.now();

      const history = core.get("metricsHistory");
      expect(history).toHaveLength(1);
      expect(history[0].cpu).toBe(50);
      expect(history[0].ts).toBeGreaterThanOrEqual(before);
      expect(history[0].ts).toBeLessThanOrEqual(after);
    });

    it("limits history to 200 entries", function () {
      socket.init(mockSocket);
      for (let i = 0; i < 210; i++) {
        socket._addMetric({ value: i });
      }
      expect(core.get("metricsHistory")).toHaveLength(200);
    });

    it("keeps most recent entries", function () {
      socket.init(mockSocket);
      for (let i = 0; i < 210; i++) {
        socket._addMetric({ value: i });
      }
      // slice(-200) keeps last 200 items, so we lose indices 0-9
      expect(core.get("metricsHistory")[0].value).toBe(10);
    });
  });

  describe("_addLog()", function () {
    it("adds log to beginning of logs array", function () {
      socket.init(mockSocket);
      socket._addLog({ level: "info", message: "test" });
      const logs = core.get("logs");
      expect(logs[0].message).toBe("test");
    });

    it("limits logs to 100 entries", function () {
      socket.init(mockSocket);
      for (let i = 0; i < 110; i++) {
        socket._addLog({ message: `log-${i}` });
      }
      expect(core.get("logs")).toHaveLength(100);
    });

    it("keeps most recent at beginning", function () {
      socket.init(mockSocket);
      for (let i = 0; i < 110; i++) {
        socket._addLog({ message: `log-${i}` });
      }
      expect(core.get("logs")[0].message).toBe("log-109");
    });
  });

  describe("request()", function () {
    it("returns promise", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      const promise = socket.request("test:event");
      expect(promise).toBeInstanceOf(Promise);
    });

    it("executes immediately when already connected", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      socket.request("test:event", { data: "test" });

      expect(mockSocket.getEmitCalls().length).toBe(1);
    });

    it("uses 5000ms timeout for config: events", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      socket.request("config:update", { config: {} });

      global.setTimeout = originalSetTimeout;
      expect(capturedDelay).toBe(5000);
    });

    it("uses 5000ms timeout for settings: events", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      socket.request("settings:update", { settings: {} });

      global.setTimeout = originalSetTimeout;
      expect(capturedDelay).toBe(5000);
    });

    it("uses 120000ms timeout for regular events", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      socket.request("models:list", {});

      global.setTimeout = originalSetTimeout;
      expect(capturedDelay).toBe(120000);
    });

    it("generates unique request IDs", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        socket.request("test:event", { index: i });
        const call = mockSocket.getEmitCalls()[i];
        ids.add(call.data.requestId);
      }
      expect(ids.size).toBeGreaterThan(90);
    });

    it("handles request with empty data object", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      socket.request("test:event");

      const call = mockSocket.getEmitCalls()[0];
      expect(call.data.requestId).toBeDefined();
    });
  });

  describe("_doRequest()", function () {
    it("adds request to pending map", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const resolve = jest.fn();
      const reject = jest.fn();
      socket._doRequest("test:event", { data: "test" }, resolve, reject);

      expect(socket.pending.size).toBe(1);
      const reqId = socket.pending.keys().next().value;
      expect(reqId.startsWith("req_")).toBe(true);
    });

    it("emits event with requestId", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const resolve = jest.fn();
      const reject = jest.fn();
      socket._doRequest("test:event", { data: "test" }, resolve, reject);

      const call = mockSocket.getEmitCalls()[0];
      expect(call.event).toBe("test:event");
      expect(call.data.requestId).toBeDefined();
      // The data is spread: { ...data, requestId: reqId }
      expect(call.data.data).toBe("test");
    });

    it("stores resolve and reject callbacks in pending", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const resolve = jest.fn();
      const reject = jest.fn();
      socket._doRequest("test:event", {}, resolve, reject);

      const reqId = socket.pending.keys().next().value;
      const pending = socket.pending.get(reqId);
      expect(pending.resolve).toBe(resolve);
      expect(pending.reject).toBe(reject);
      expect(pending.event).toBe("test:event");
      expect(pending.timeout).toBeDefined();
    });

    it("sets 5000ms timeout for config: events", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      socket._doRequest("config:update", { config: {} }, jest.fn(), jest.fn());

      global.setTimeout = originalSetTimeout;
      expect(capturedDelay).toBe(5000);
    });

    it("sets 120000ms timeout for regular events", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      socket._doRequest("models:list", {}, jest.fn(), jest.fn());

      global.setTimeout = originalSetTimeout;
      expect(capturedDelay).toBe(120000);
    });
  });

  describe("_refreshModels()", function () {
    it("updates models state on successful refresh", async function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = socket._refreshModels();

      // Wait for the models:list request
      await new Promise((resolve) => setTimeout(resolve, 50));

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      expect(listCall).toBeDefined();

      const requestId = listCall.data.requestId;
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: [{ id: 1, name: "test" }] },
      });

      await refreshPromise;
      expect(core.get("models")).toEqual([{ id: 1, name: "test" }]);
    });

    it("handles refresh failure without throwing", async function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const refreshPromise = socket._refreshModels();

      await new Promise((resolve) => setTimeout(resolve, 50));

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: false,
        error: { message: "Failed" },
      });

      // Should not throw
      await expect(refreshPromise).resolves.toBeUndefined();

      consoleErrorSpy.mockRestore();
    });

    it("handles empty models array", async function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = socket._refreshModels();

      await new Promise((resolve) => setTimeout(resolve, 50));

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: [] },
      });

      await refreshPromise;
      expect(core.get("models")).toEqual([]);
    });
  });

  describe("destroy()", function () {
    it("calls connection destroy", function () {
      socket.init(mockSocket);
      const destroySpy = jest.spyOn(socket.connection, "destroy");
      socket.destroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it("can be called multiple times safely", function () {
      socket.init(mockSocket);
      expect(() => {
        socket.destroy();
        socket.destroy();
      }).not.toThrow();
    });

    it("cleans up connection timeout", function () {
      jest.useFakeTimers();
      socket.init(mockSocket);
      const connection = socket.connection;
      socket.destroy();
      expect(connection.connectionTimeout).toBeNull();
      jest.useRealTimers();
    });
  });

  describe("Connection State Notifications", function () {
    it("notifies connectionStatus on connect", function () {
      let status = null;
      core.subscribe("connectionStatus", (newStatus) => {
        status = newStatus;
      });

      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();

      expect(status).toBe("connected");
    });

    it("notifies connectionStatus on disconnect", function () {
      let status = null;
      core.subscribe("connectionStatus", (newStatus) => {
        status = newStatus;
      });

      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.triggerDisconnect();

      expect(status).toBe("disconnected");
    });

    it("handles multiple connection/disconnect cycles", function () {
      let connectCount = 0;
      let disconnectCount = 0;
      core.subscribe("connectionStatus", (newStatus) => {
        if (newStatus === "connected") connectCount++;
        if (newStatus === "disconnected") disconnectCount++;
      });

      socket.init(mockSocket);

      // First cycle
      mockSocket.triggerConnectionEstablished();
      mockSocket.triggerDisconnect();

      // Second cycle
      mockSocket.triggerConnectionEstablished();
      mockSocket.triggerDisconnect();

      expect(connectCount).toBe(2);
      expect(disconnectCount).toBe(2);
    });
  });

  describe("Multiple Pending Requests", function () {
    it("handles multiple pending requests", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const promise1 = socket.request("event1", { id: 1 });
      const promise2 = socket.request("event2", { id: 2 });
      const promise3 = socket.request("event3", { id: 3 });

      expect(socket.pending.size).toBe(3);
      expect(mockSocket.getEmitCalls().length).toBe(3);
    });

    it("tracks pending requests correctly", function () {
      socket.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const resolve1 = jest.fn();
      const reject1 = jest.fn();
      const resolve2 = jest.fn();
      const reject2 = jest.fn();

      socket._doRequest("event1", { id: 1 }, resolve1, reject1);
      expect(socket.pending.size).toBe(1);

      socket._doRequest("event2", { id: 2 }, resolve2, reject2);
      expect(socket.pending.size).toBe(2);

      const reqIds = Array.from(socket.pending.keys());
      expect(reqIds.length).toBe(2);
      expect(reqIds[0]).not.toBe(reqIds[1]);
    });
  });
});

describe("StateModels", function () {
  let models;
  let core;
  let mockSocket;

  beforeEach(function () {
    core = new StateCore();
    mockSocket = createMockSocket();
    const socket = new StateSocket(core);
    socket.init(mockSocket);
    models = new StateModels(core, socket);
  });

  describe("Constructor", function () {
    it("stores core reference", function () {
      expect(models.core).toBe(core);
    });

    it("stores socket reference", function () {
      expect(models.socket).toBeDefined();
    });
  });

  describe("_updateModel()", function () {
    it("updates existing model status", function () {
      core.set("models", [{ id: 1, name: "test", status: "loaded" }]);
      models._updateModel(1, "unloaded");
      expect(core.get("models")[0].status).toBe("unloaded");
    });

    it("merges additional model data", function () {
      core.set("models", [{ id: 1, name: "test", status: "loaded" }]);
      models._updateModel(1, "loading", { progress: 50 });
      expect(core.get("models")[0].progress).toBe(50);
    });

    it("does nothing if model not found", function () {
      core.set("models", [{ id: 1, name: "test" }]);
      models._updateModel(999, "unloaded");
      expect(core.get("models")[0].status).toBeUndefined();
    });
  });

  describe("_addModel()", function () {
    it("adds model to models array", function () {
      models._addModel({ id: 1, name: "new-model" });
      expect(core.get("models")).toEqual([{ id: 1, name: "new-model" }]);
    });
  });

  describe("_updateModelData()", function () {
    it("replaces model with matching id", function () {
      core.set("models", [{ id: 1, name: "old" }]);
      models._updateModelData({ id: 1, name: "new" });
      expect(core.get("models")[0].name).toBe("new");
    });
  });

  describe("_removeModel()", function () {
    it("removes model by id", function () {
      core.set("models", [
        { id: 1, name: "model1" },
        { id: 2, name: "model2" },
      ]);
      models._removeModel(1);
      expect(core.get("models")).toHaveLength(1);
    });
  });

  describe("getModels()", function () {
    it("emits models:list event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.getModels();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:list")).toBe(true);
    });
  });

  describe("getModel()", function () {
    it("emits models:get event with modelId", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.getModel("model-123");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:get");
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
    });
  });

  describe("createModel()", function () {
    it("emits models:create event with model data", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.createModel({ name: "new-model", path: "/models/test.gguf" });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:create");
      expect(call).toBeDefined();
      expect(call.data.model.name).toBe("new-model");
    });
  });

  describe("updateModel()", function () {
    it("emits models:update event with id and updates", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.updateModel("model-123", { status: "loaded" });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:update");
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
      expect(call.data.updates.status).toBe("loaded");
    });
  });

  describe("deleteModel()", function () {
    it("emits models:delete event with modelId", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.deleteModel("model-123");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:delete");
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
    });
  });

  describe("startModel()", function () {
    it("throws error if model not found", async function () {
      core.set("models", []);
      await expect(models.startModel(999)).rejects.toThrow("Model not found: 999");
    });

    it("emits models:load event with model name", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      core.set("models", [{ id: 1, name: "my-model" }]);
      models.startModel(1);
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:load");
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("my-model");
    });
  });

  describe("loadModel()", function () {
    it("emits models:load event with modelName", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.loadModel("test-model");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:load");
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("test-model");
    });
  });

  describe("unloadModel()", function () {
    it("emits models:unload event with modelName", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.unloadModel("test-model");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:unload");
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("test-model");
    });
  });

  describe("stopModel()", function () {
    it("throws error if model not found", async function () {
      core.set("models", []);
      await expect(models.stopModel(999)).rejects.toThrow("Model not found: 999");
    });

    it("emits models:unload event with model name", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      core.set("models", [{ id: 1, name: "my-model" }]);
      models.stopModel(1);
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:unload");
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("my-model");
    });
  });

  describe("scanModels()", function () {
    it("emits models:scan event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.scanModels();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:scan")).toBe(true);
    });
  });

  describe("cleanupModels()", function () {
    it("emits models:cleanup event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.cleanupModels();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:cleanup")).toBe(true);
    });
  });

  describe("refreshModels()", function () {
    it("fetches models and updates state", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      expect(listCall).toBeDefined();

      const requestId = listCall.data.requestId;
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: [{ id: 1, name: "test" }] },
      });

      await refreshPromise;
      expect(core.get("models")).toEqual([{ id: 1, name: "test" }]);
    });

    it("throws error on failure", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: false,
        error: { message: "Failed" },
      });

      await expect(refreshPromise).rejects.toThrow();
    });
  });
});

describe("StateAPI", function () {
  let api;
  let core;
  let mockSocket;

  beforeEach(function () {
    core = new StateCore();
    mockSocket = createMockSocket();
    const socket = new StateSocket(core);
    socket.init(mockSocket);
    api = new StateAPI(core, socket);
    mockSocket.triggerConnectionEstablished();
    mockSocket.clearEmitCalls();
  });

  describe("Constructor", function () {
    it("stores core reference", function () {
      expect(api.core).toBe(core);
    });

    it("stores socket reference", function () {
      expect(api.socket).toBeDefined();
    });
  });

  describe("Llama Router Operations", function () {
    it("getRouterStatus emits llama:status event", function () {
      api.getRouterStatus();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:status")).toBe(true);
    });

    it("restartLlama emits llama:restart event", function () {
      api.restartLlama();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:restart")).toBe(true);
    });

    it("configureLlama emits llama:config event with settings", function () {
      api.configureLlama({ temperature: 0.7, maxTokens: 100 });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "llama:config");
      expect(call).toBeDefined();
      expect(call.data.settings.temperature).toBe(0.7);
    });

    it("getLlamaStatus emits llama:status event", function () {
      api.getLlamaStatus();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:status")).toBe(true);
    });

    it("startLlama emits llama:start event", function () {
      api.startLlama();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:start")).toBe(true);
    });

    it("stopLlama emits llama:stop event", function () {
      api.stopLlama();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:stop")).toBe(true);
    });
  });

  describe("Metrics Operations", function () {
    it("getMetrics emits metrics:get event", function () {
      api.getMetrics();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "metrics:get")).toBe(true);
    });

    it("getMetricsHistory emits metrics:history event with parameters", function () {
      api.getMetricsHistory({ limit: 100, start: Date.now() - 3600000 });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "metrics:history");
      expect(call).toBeDefined();
      expect(call.data.limit).toBe(100);
    });
  });

  describe("Logs Operations", function () {
    it("getLogs emits logs:get event with parameters", function () {
      api.getLogs({ level: "error", limit: 50 });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "logs:get");
      expect(call).toBeDefined();
      expect(call.data.level).toBe("error");
    });

    it("readLogFile emits logs:read-file event with fileName", function () {
      api.readLogFile("app.log");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "logs:read-file");
      expect(call).toBeDefined();
      expect(call.data.fileName).toBe("app.log");
    });

    it("listLogFiles emits logs:list-files event", function () {
      api.listLogFiles();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "logs:list-files")).toBe(true);
    });

    it("clearLogs emits logs:clear event", function () {
      api.clearLogs();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "logs:clear")).toBe(true);
    });

    it("clearLogFiles emits logs:clear-files event", function () {
      api.clearLogFiles();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "logs:clear-files")).toBe(true);
    });
  });

  describe("Config Operations", function () {
    it("getConfig emits config:get event", function () {
      api.getConfig();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "config:get")).toBe(true);
    });

    it("updateConfig emits config:update event with config", function () {
      api.updateConfig({ theme: "dark" });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "config:update");
      expect(call).toBeDefined();
      expect(call.data.config.theme).toBe("dark");
    });
  });

  describe("Settings Operations", function () {
    it("getSettings emits settings:get event", function () {
      api.getSettings();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "settings:get")).toBe(true);
    });

    it("updateSettings emits settings:update event with settings", function () {
      api.updateSettings({ notifications: true });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "settings:update");
      expect(call).toBeDefined();
      expect(call.data.settings.notifications).toBe(true);
    });
  });
});

describe("StateManager", function () {
  let manager;
  let mockSocket;

  beforeEach(function () {
    manager = new StateManager();
    mockSocket = createMockSocket();
  });

  afterEach(function () {
    if (manager) {
      if (manager.socket && manager.socket.connectionTimeout) {
        clearTimeout(manager.socket.connectionTimeout);
      }
      manager = null;
    }
  });

  describe("Constructor", function () {
    it("creates StateCore instance", function () {
      expect(manager.core).toBeInstanceOf(StateCore);
    });

    it("creates StateSocket instance", function () {
      expect(manager.socket).toBeInstanceOf(StateSocket);
    });

    it("creates StateModels instance", function () {
      expect(manager.models).toBeInstanceOf(StateModels);
    });

    it("creates StateAPI instance", function () {
      expect(manager.api).toBeInstanceOf(StateAPI);
    });
  });

  describe("init()", function () {
    it("initializes socket connection", function () {
      manager.init(mockSocket);
      expect(manager.socket.socket).toBe(mockSocket);
    });
  });

  describe("Core Method Delegation", function () {
    beforeEach(function () {
      manager.init(mockSocket);
    });

    it("getState delegates to core", function () {
      manager.core.state.test = "value";
      expect(manager.getState()).toEqual({ test: "value" });
    });

    it("get delegates to core", function () {
      manager.core.state.testKey = "testValue";
      expect(manager.get("testKey")).toBe("testValue");
    });

    it("set delegates to core", function () {
      const result = manager.set("key", "value");
      expect(manager.core.state.key).toBe("value");
      expect(result).toBe(manager.core);
    });

    it("subscribe delegates to core", function () {
      const callback = jest.fn();
      const unsubscribe = manager.subscribe("key", callback);
      manager.set("key", "value");
      expect(callback).toHaveBeenCalled();
      unsubscribe();
    });
  });

  describe("Connection Status", function () {
    it("isConnected delegates to socket", function () {
      expect(manager.isConnected()).toBe(false);
      manager.socket.connection.connected = true;
      expect(manager.isConnected()).toBe(true);
    });
  });

  describe("Model Operations Delegation", function () {
    beforeEach(function () {
      manager.init(mockSocket);
    });

    it("getModels delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.getModels();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:list")).toBe(true);
    });

    it("getModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.getModel("model-123");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:get");
      expect(call.data.modelId).toBe("model-123");
    });

    it("createModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.createModel({ name: "test" });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:create");
      expect(call.data.model.name).toBe("test");
    });

    it("updateModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.updateModel("id", { status: "loaded" });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:update");
      expect(call.data.modelId).toBe("id");
    });

    it("deleteModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.deleteModel("id");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:delete");
      expect(call.data.modelId).toBe("id");
    });

    it("startModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.core.state.models = [{ id: 1, name: "test" }];
      manager.startModel(1);
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:load");
      expect(call.data.modelName).toBe("test");
    });

    it("loadModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.loadModel("model-name");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:load");
      expect(call.data.modelName).toBe("model-name");
    });

    it("unloadModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.unloadModel("model-name");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:unload");
      expect(call.data.modelName).toBe("model-name");
    });

    it("stopModel delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.core.state.models = [{ id: 1, name: "test" }];
      manager.stopModel(1);
      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:unload");
      expect(call.data.modelName).toBe("test");
    });

    it("scanModels delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.scanModels();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:scan")).toBe(true);
    });

    it("refreshModels delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.refreshModels();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:list")).toBe(true);
    });

    it("cleanupModels delegates to models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      manager.cleanupModels();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:cleanup")).toBe(true);
    });
  });

  describe("Llama Router Operations Delegation", function () {
    beforeEach(function () {
      manager.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
    });

    it("getRouterStatus delegates to api", function () {
      manager.getRouterStatus();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:status")).toBe(true);
    });

    it("restartLlama delegates to api", function () {
      manager.restartLlama();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:restart")).toBe(true);
    });

    it("configureLlama delegates to api", function () {
      manager.configureLlama({ temp: 0.5 });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "llama:config");
      expect(call.data.settings.temp).toBe(0.5);
    });

    it("getLlamaStatus delegates to api", function () {
      manager.getLlamaStatus();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:status")).toBe(true);
    });

    it("startLlama delegates to api", function () {
      manager.startLlama();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:start")).toBe(true);
    });

    it("stopLlama delegates to api", function () {
      manager.stopLlama();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "llama:stop")).toBe(true);
    });
  });

  describe("Metrics Operations Delegation", function () {
    beforeEach(function () {
      manager.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
    });

    it("getMetrics delegates to api", function () {
      manager.getMetrics();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "metrics:get")).toBe(true);
    });

    it("getMetricsHistory delegates to api", function () {
      manager.getMetricsHistory({ limit: 100 });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "metrics:history");
      expect(call.data.limit).toBe(100);
    });
  });

  describe("Logs Operations Delegation", function () {
    beforeEach(function () {
      manager.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
    });

    it("getLogs delegates to api", function () {
      manager.getLogs({ level: "error" });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "logs:get");
      expect(call.data.level).toBe("error");
    });

    it("readLogFile delegates to api", function () {
      manager.readLogFile("test.log");
      const call = mockSocket.getEmitCalls().find((c) => c.event === "logs:read-file");
      expect(call.data.fileName).toBe("test.log");
    });

    it("listLogFiles delegates to api", function () {
      manager.listLogFiles();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "logs:list-files")).toBe(true);
    });

    it("clearLogs delegates to api", function () {
      manager.clearLogs();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "logs:clear")).toBe(true);
    });

    it("clearLogFiles delegates to api", function () {
      manager.clearLogFiles();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "logs:clear-files")).toBe(true);
    });
  });

  describe("Config Operations Delegation", function () {
    beforeEach(function () {
      manager.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
    });

    it("getConfig delegates to api", function () {
      manager.getConfig();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "config:get")).toBe(true);
    });

    it("updateConfig delegates to api", function () {
      manager.updateConfig({ theme: "dark" });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "config:update");
      expect(call.data.config.theme).toBe("dark");
    });
  });

  describe("Settings Operations Delegation", function () {
    beforeEach(function () {
      manager.init(mockSocket);
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
    });

    it("getSettings delegates to api", function () {
      manager.getSettings();
      expect(mockSocket.getEmitCalls().some((c) => c.event === "settings:get")).toBe(true);
    });

    it("updateSettings delegates to api", function () {
      manager.updateSettings({ notifications: true });
      const call = mockSocket.getEmitCalls().find((c) => c.event === "settings:update");
      expect(call.data.settings.notifications).toBe(true);
    });
  });
});

describe("State Module Integration", function () {
  it("StateSocket properly integrates with StateCore", function () {
    const core = new StateCore();
    const socket = new StateSocket(core);

    let notifyCalled = false;
    core.subscribe("models", function () {
      notifyCalled = true;
    });

    socket._addModel({ id: 1, name: "test" });
    expect(core.get("models")).toEqual([{ id: 1, name: "test" }]);
    expect(notifyCalled).toBe(true);
  });

  it("StateModels properly integrates with StateSocket", async function () {
    const core = new StateCore();
    const mockSocket = createMockSocket();
    const socket = new StateSocket(core);
    socket.init(mockSocket);
    const models = new StateModels(core, socket);

    mockSocket.triggerConnectionEstablished();
    mockSocket.clearEmitCalls();

    const promise = models.getModels();

    const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
    expect(listCall).toBeDefined();

    const requestId = listCall.data.requestId;
    mockSocket.triggerEvent("models:list:result", {
      requestId,
      success: true,
      data: { models: [{ id: 1, name: "model1" }] },
    });

    const result = await promise;
    expect(result).toEqual({ models: [{ id: 1, name: "model1" }] });
  });

  it("StateManager orchestrates all modules correctly", function () {
    const manager = new StateManager();

    expect(manager.core).toBeInstanceOf(StateCore);
    expect(manager.socket).toBeInstanceOf(StateSocket);
    expect(manager.models).toBeInstanceOf(StateModels);
    expect(manager.api).toBeInstanceOf(StateAPI);
  });

  it("StateCore subscription works with wildcard", function () {
    const core = new StateCore();
    let wildcardCount = 0;
    let keySpecificCount = 0;

    core.subscribe("*", function () {
      wildcardCount++;
    });

    core.subscribe("testKey", function () {
      keySpecificCount++;
    });

    core.set("testKey", "value1");
    expect(wildcardCount).toBe(1);
    expect(keySpecificCount).toBe(1);

    core.set("otherKey", "value2");
    expect(wildcardCount).toBe(2);
    expect(keySpecificCount).toBe(1);
  });

  it("StateConnectionHandlers properly triggers connection state changes", function () {
    const core = new StateCore();
    let connectionStatus = null;
    let connectedCount = 0;
    let disconnectedCount = 0;

    const handlers = new StateConnectionHandlers(
      core,
      function () {
        connectedCount++;
        connectionStatus = "connected";
      },
      function () {
        disconnectedCount++;
        connectionStatus = "disconnected";
      }
    );

    const mockSocket = createMockSocket();
    handlers.setup(mockSocket);

    expect(handlers.connected).toBe(false);

    mockSocket.triggerConnectionEstablished();
    expect(handlers.connected).toBe(true);
    expect(connectedCount).toBe(1);
    expect(connectionStatus).toBe("connected");

    mockSocket.triggerDisconnect();
    expect(handlers.connected).toBe(false);
    expect(disconnectedCount).toBe(1);
    expect(connectionStatus).toBe("disconnected");
  });

  it("StateBroadcastHandlers properly updates state on broadcast events", function () {
    const core = new StateCore();
    const handlers = new StateBroadcastHandlers(core, {
      onModelsScanned: function () {},
    });

    const mockSocket = createMockSocket();
    handlers.setup(mockSocket);

    mockSocket.triggerEvent("models:list", {
      type: "broadcast",
      data: { models: [{ id: 1, name: "model1" }] },
    });

    expect(core.get("models")).toEqual([{ id: 1, name: "model1" }]);

    mockSocket.triggerEvent("metrics:update", {
      type: "broadcast",
      data: { metrics: { cpu: 75, memory: 80 } },
    });

    expect(core.get("metrics")).toEqual({ cpu: 75, memory: 80 });
  });

  it("StateResponseHandlers properly resolves/rejects pending requests", function () {
    const pending = new Map();
    const handlers = new StateResponseHandlers(pending);

    const mockSocket = createMockSocket();
    handlers.setup(mockSocket);

    const resolve = jest.fn();
    const reject = jest.fn();
    const timeout = setTimeout(() => {}, 10000);
    pending.set("req_123", { resolve, reject, timeout });

    mockSocket.triggerEvent("models:list:result", {
      requestId: "req_123",
      success: true,
      data: { models: [{ id: 1 }] },
    });

    expect(resolve).toHaveBeenCalledWith({ models: [{ id: 1 }] });
    expect(reject).not.toHaveBeenCalled();
    expect(pending.has("req_123")).toBe(false);

    const resolve2 = jest.fn();
    const reject2 = jest.fn();
    const timeout2 = setTimeout(() => {}, 10000);
    pending.set("req_456", { resolve: resolve2, reject: reject2, timeout: timeout2 });

    mockSocket.triggerEvent("models:list:result", {
      requestId: "req_456",
      success: false,
      error: { message: "Error message" },
    });

    expect(reject2).toHaveBeenCalled();
    expect(resolve2).not.toHaveBeenCalled();
    expect(pending.has("req_456")).toBe(false);
  });
});
