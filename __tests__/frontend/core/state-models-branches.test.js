/**
 * StateModels Branch Coverage Tests
 * Tests to achieve ≥90% branch coverage for state-models.js
 * @jest-environment jsdom
 */

global.window = global.window || {};
global.window.document = global.window.document || {
  querySelector: () => null,
  createElement: (tag) => ({ tagName: tag.toUpperCase() }),
  addEventListener: () => {},
  removeEventListener: () => {},
};

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

const stateCorePath = new URL("../../../public/js/core/state/state-core.js", import.meta.url);
await import(stateCorePath.href);

const stateSocketPath = new URL("../../../public/js/core/state/state-socket.js", import.meta.url);
await import(stateSocketPath.href);

const stateModelsPath = new URL("../../../public/js/core/state/state-models.js", import.meta.url);
await import(stateModelsPath.href);

const connectionPath = new URL(
  "../../../public/js/core/state/handlers/connection.js",
  import.meta.url
);
await import(connectionPath.href);

const broadcastPath = new URL(
  "../../../public/js/core/state/handlers/broadcast.js",
  import.meta.url
);
await import(broadcastPath.href);

const responsePath = new URL("../../../public/js/core/state/handlers/response.js", import.meta.url);
await import(responsePath.href);

const StateCore = global.window.StateCore;
const StateSocket = global.window.StateSocket;
const StateModels = global.window.StateModels;
const StateConnectionHandlers = global.window.StateConnectionHandlers;

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

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

describe("StateModels Branch Coverage", function () {
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

  afterEach(function () {
    models = null;
    core = null;
  });

  describe("_updateModel() - models falsy branch", function () {
    it("handles undefined models state", function () {
      expect(core.get("models")).toBeUndefined();
      models._updateModel("model-1", "loaded");
      expect(core.get("models")).toBeUndefined();
    });

    it("handles null models state", function () {
      core.set("models", null);
      models._updateModel("model-1", "loaded");
      expect(core.get("models")).toBeNull();
    });

    it("handles empty array", function () {
      core.set("models", []);
      models._updateModel("model-1", "loaded");
      expect(core.get("models")).toEqual([]);
    });
  });

  describe("_updateModel() - model not found branch", function () {
    it("does nothing when updating non-existent model", function () {
      core.set("models", [
        { id: 1, name: "model-a", status: "loaded" },
        { id: 2, name: "model-b", status: "unloaded" },
      ]);
      models._updateModel(999, "loading");
      const modelsList = core.get("models");
      expect(modelsList).toHaveLength(2);
      expect(modelsList[0].status).toBe("loaded");
      expect(modelsList[1].status).toBe("unloaded");
    });

    it("only updates matching id", function () {
      core.set("models", [
        { id: 1, name: "model-a", status: "loaded", progress: 0 },
        { id: 2, name: "model-b", status: "unloaded", progress: 0 },
        { id: 3, name: "model-c", status: "loaded", progress: 100 },
      ]);
      models._updateModel(2, "loading", { progress: 50 });
      const modelsList = core.get("models");
      expect(modelsList[1].status).toBe("loading");
      expect(modelsList[1].progress).toBe(50);
      expect(modelsList[0].progress).toBe(0);
      expect(modelsList[2].progress).toBe(100);
    });
  });

  describe("_updateModelData() - models falsy branch", function () {
    it("handles undefined models state", function () {
      expect(core.get("models")).toBeUndefined();
      models._updateModelData({ id: 1, name: "new-model" });
      expect(core.get("models")).toEqual([]);
    });

    it("handles null models state", function () {
      core.set("models", null);
      models._updateModelData({ id: 1, name: "test" });
      expect(core.get("models")).toEqual([]);
    });

    it("updates existing model and calls set", function () {
      core.set("models", [{ id: 1, name: "old-name", status: "loaded" }]);
      models._updateModelData({ id: 1, name: "new-name", status: "updated" });
      const modelsList = core.get("models");
      expect(modelsList[0].name).toBe("new-name");
      expect(modelsList[0].status).toBe("updated");
    });
  });

  describe("_removeModel() - models falsy branch", function () {
    it("handles undefined models state", function () {
      expect(core.get("models")).toBeUndefined();
      models._removeModel(1);
      expect(core.get("models")).toEqual([]);
    });

    it("handles null models state", function () {
      core.set("models", null);
      models._removeModel(1);
      expect(core.get("models")).toEqual([]);
    });

    it("removes model from existing list", function () {
      core.set("models", [
        { id: 1, name: "model-1" },
        { id: 2, name: "model-2" },
        { id: 3, name: "model-3" },
      ]);
      models._removeModel(2);
      const modelsList = core.get("models");
      expect(modelsList).toHaveLength(2);
      expect(modelsList[0].id).toBe(1);
      expect(modelsList[1].id).toBe(3);
    });

    it("handles removing non-existent model", function () {
      core.set("models", [
        { id: 1, name: "model-1" },
        { id: 2, name: "model-2" },
      ]);
      models._removeModel(999);
      expect(core.get("models")).toHaveLength(2);
    });
  });

  describe("refreshModels() - data.models falsy branch", function () {
    it("handles successful response with empty models array", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();
      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: [] },
      });

      return refreshPromise.then(function () {
        expect(core.get("models")).toEqual([]);
        expect(core.get("models")).toHaveLength(0);
      });
    });

    it("handles successful response with null models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();
      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: null },
      });

      return refreshPromise.then(function () {
        expect(core.get("models")).toEqual([]);
      });
    });

    it("handles successful response with undefined models", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();
      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: {},
      });

      return refreshPromise.then(function () {
        expect(core.get("models")).toEqual([]);
      });
    });

    it("handles failed refresh", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(function () {});

      const refreshPromise = models.refreshModels();
      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: false,
        error: { message: "Network error" },
      });

      return refreshPromise.catch(function (e) {
        expect(e.message).toBe("Network error");
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining("[STATE-MODELS] refreshModels() error:"),
          "Network error"
        );
        consoleErrorSpy.mockRestore();
      });
    });

    it("populates models with valid data", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();
      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      const testModels = [
        { id: 1, name: "model-1", status: "loaded" },
        { id: 2, name: "model-2", status: "unloaded" },
      ];

      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: testModels },
      });

      return refreshPromise.then(function () {
        expect(core.get("models")).toEqual(testModels);
      });
    });
  });

  describe("startModel() - error branches", function () {
    it("throws error when models state is empty array", function () {
      core.set("models", []);
      return expect(models.startModel("model-1")).rejects.toThrow("Model not found: model-1");
    });

    it("throws error when model id doesn't match", function () {
      core.set("models", [
        { id: 1, name: "model-a" },
        { id: 2, name: "model-b" },
      ]);
      return expect(models.startModel(999)).rejects.toThrow("Model not found: 999");
    });

    it("succeeds when model exists", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      core.set("models", [{ id: 1, name: "test-model", status: "unloaded" }]);
      models.startModel(1);
      const loadCall = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:load";
      });
      expect(loadCall).toBeDefined();
      expect(loadCall.data.modelName).toBe("test-model");
    });
  });

  describe("stopModel() - error branches", function () {
    it("throws error when models state is empty array", function () {
      core.set("models", []);
      return expect(models.stopModel("model-1")).rejects.toThrow("Model not found: model-1");
    });

    it("throws error when model not in list", function () {
      core.set("models", [{ id: 1, name: "existing-model" }]);
      return expect(models.stopModel(999)).rejects.toThrow("Model not found: 999");
    });

    it("succeeds when model exists", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      core.set("models", [{ id: 1, name: "loaded-model", status: "loaded" }]);
      models.stopModel(1);
      const unloadCall = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:unload";
      });
      expect(unloadCall).toBeDefined();
      expect(unloadCall.data.modelName).toBe("loaded-model");
    });
  });

  describe("Cache Management", function () {
    it("_addModel handles undefined models cache", function () {
      expect(core.get("models")).toBeUndefined();
      models._addModel({ id: 1, name: "new-model" });
      expect(core.get("models")).toEqual([{ id: 1, name: "new-model" }]);
    });

    it("_addModel appends to existing cache", function () {
      core.set("models", [{ id: 1, name: "existing" }]);
      models._addModel({ id: 2, name: "new" });
      expect(core.get("models")).toHaveLength(2);
    });

    it("multiple _addModel calls accumulate", function () {
      models._addModel({ id: 1, name: "model-1" });
      models._addModel({ id: 2, name: "model-2" });
      models._addModel({ id: 3, name: "model-3" });
      expect(core.get("models")).toHaveLength(3);
    });

    it("getModels returns a promise", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      const result = models.getModels();
      expect(result).toBeInstanceOf(Promise);
      const listCall = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:list";
      });
      expect(listCall).toBeDefined();
    });
  });

  describe("Transition Handling", function () {
    it("handles loading to loaded transition", function () {
      core.set("models", [{ id: 1, name: "test", status: "loading", progress: 50 }]);
      models._updateModel(1, "loaded", { progress: 100 });
      const model = core.get("models")[0];
      expect(model.status).toBe("loaded");
      expect(model.progress).toBe(100);
    });

    it("handles error state transition", function () {
      core.set("models", [{ id: 1, name: "test", status: "loading" }]);
      models._updateModel(1, "error", { errorMessage: "Failed" });
      const model = core.get("models")[0];
      expect(model.status).toBe("error");
      expect(model.errorMessage).toBe("Failed");
    });

    it("handles unloaded state correctly", function () {
      core.set("models", [
        { id: 1, name: "model-1", status: "loaded" },
        { id: 2, name: "model-2", status: "loaded" },
      ]);
      models._updateModel(1, "unloaded");
      const modelsList = core.get("models");
      expect(modelsList[0].status).toBe("unloaded");
      expect(modelsList[1].status).toBe("loaded");
    });
  });

  describe("Validation Error Handling", function () {
    it("createModel emits correct event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.createModel({ name: "new-model", path: "/models/test.gguf" });
      const call = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:create";
      });
      expect(call).toBeDefined();
      expect(call.data.model.name).toBe("new-model");
    });

    it("updateModel emits correct event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.updateModel("model-123", { status: "loaded" });
      const call = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:update";
      });
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
      expect(call.data.updates.status).toBe("loaded");
    });

    it("deleteModel emits correct event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.deleteModel("model-123");
      const call = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:delete";
      });
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
    });

    it("loadModel emits correct event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.loadModel("test-model-name");
      const call = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:load";
      });
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("test-model-name");
    });

    it("unloadModel emits correct event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.unloadModel("test-model-name");
      const call = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:unload";
      });
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("test-model-name");
    });

    it("getModel emits correct event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.getModel("model-123");
      const call = mockSocket.getEmitCalls().find(function (c) {
        return c.event === "models:get";
      });
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
    });
  });

  describe("Scan and Cleanup", function () {
    it("scanModels emits models:scan event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.scanModels();
      expect(
        mockSocket.getEmitCalls().some(function (c) {
          return c.event === "models:scan";
        })
      ).toBe(true);
    });

    it("cleanupModels emits models:cleanup event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();
      models.cleanupModels();
      expect(
        mockSocket.getEmitCalls().some(function (c) {
          return c.event === "models:cleanup";
        })
      ).toBe(true);
    });
  });
});
