/**
 * StateModels Branch Coverage Tests
 * Tests to achieve ≥90% branch coverage for state-models.js
 * Covers: state model validation, transition handling, cache management, validation error handling
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

// Mock Map and Set
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

// Load state modules
const stateCorePath = new URL("../../../public/js/core/state/state-core.js", import.meta.url);
await import(stateCorePath.href);

const stateSocketPath = new URL("../../../public/js/core/state/state-socket.js", import.meta.url);
await import(stateSocketPath.href);

const stateModelsPath = new URL("../../../public/js/core/state/state-models.js", import.meta.url);
await import(stateModelsPath.href);

// Load handler modules
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
    if (models) {
      models = null;
    }
    if (core) {
      core = null;
    }
  });

  // ============================================
  // BRANCH 1: _updateModel() - models is falsy (|| [] branch)
  // ============================================
  describe("_updateModel() - models falsy branch", function () {
    it("handles undefined models state (triggers || [] branch)", function () {
      // This tests the branch where this.core.get("models") returns undefined
      // and the || [] fallback is executed
      expect(core.get("models")).toBeUndefined();

      // Update should not throw and should handle gracefully
      // When models is undefined, findIndex returns -1 and nothing happens
      models._updateModel("model-1", "loaded");

      // Models should remain undefined (no notification happened)
      expect(core.get("models")).toBeUndefined();
    });

    it("handles null models state (triggers || [] branch)", function () {
      // Set models to null explicitly
      core.set("models", null);

      // Update should not throw
      models._updateModel("model-1", "loaded");

      // Should remain null
      expect(core.get("models")).toBeNull();
    });

    it("handles empty array (truthy branch, but empty list)", function () {
      // Set models to empty array
      core.set("models", []);

      // Update non-existent model in empty list
      models._updateModel("model-1", "loaded");

      // Models should remain empty array
      expect(core.get("models")).toEqual([]);
    });
  });

  // ============================================
  // BRANCH 2: _updateModel() - model NOT found (idx === -1 branch)
  // ============================================
  describe("_updateModel() - model not found branch", function () {
    it("does nothing when updating non-existent model", function () {
      core.set("models", [
        { id: 1, name: "model-a", status: "loaded" },
        { id: 2, name: "model-b", status: "unloaded" },
      ]);

      // Try to update a model that doesn't exist
      models._updateModel(999, "loading");

      // Original models should be unchanged
      const modelsList = core.get("models");
      expect(modelsList).toHaveLength(2);
      expect(modelsList[0].status).toBe("loaded");
      expect(modelsList[1].status).toBe("unloaded");
    });

    it("does nothing when updating with string id that doesn't match", function () {
      core.set("models", [
        { id: "model-1", name: "Model 1", status: "loaded" },
        { id: "model-2", name: "Model 2", status: "unloaded" },
      ]);

      // Try to update with non-existent string id
      models._updateModel("model-999", "loading");

      const modelsList = core.get("models");
      expect(modelsList[0].status).toBe("loaded");
      expect(modelsList[1].status).toBe("unloaded");
    });

    it("only updates matching id and leaves others unchanged", function () {
      core.set("models", [
        { id: 1, name: "model-a", status: "loaded", progress: 0 },
        { id: 2, name: "model-b", status: "unloaded", progress: 0 },
        { id: 3, name: "model-c", status: "loaded", progress: 100 },
      ]);

      // Update model with id=2
      models._updateModel(2, "loading", { progress: 50 });

      const modelsList = core.get("models");
      // Model 1 should be unchanged
      expect(modelsList[0].status).toBe("loaded");
      expect(modelsList[0].progress).toBe(0);
      // Model 2 should be updated
      expect(modelsList[1].status).toBe("loading");
      expect(modelsList[1].progress).toBe(50);
      // Model 3 should be unchanged
      expect(modelsList[2].status).toBe("loaded");
      expect(modelsList[2].progress).toBe(100);
    });
  });

  // ============================================
  // BRANCH 3: _updateModelData() - models falsy branch
  // ============================================
  describe("_updateModelData() - models falsy branch", function () {
    it("handles undefined models state", function () {
      expect(core.get("models")).toBeUndefined();

      // Should not throw when models is undefined
      models._updateModelData({ id: 1, name: "new-model" });

      // Should create a new array with the model
      expect(core.get("models")).toEqual([{ id: 1, name: "new-model" }]);
    });

    it("handles null models state", function () {
      core.set("models", null);

      models._updateModelData({ id: 1, name: "test" });

      expect(core.get("models")).toEqual([{ id: 1, name: "test" }]);
    });

    it("updates matching model in existing list", function () {
      core.set("models", [
        { id: 1, name: "old-name", status: "loaded" },
        { id: 2, name: "other", status: "unloaded" },
      ]);

      models._updateModelData({ id: 1, name: "new-name", status: "updated" });

      const modelsList = core.get("models");
      expect(modelsList[0].name).toBe("new-name");
      expect(modelsList[0].status).toBe("updated");
      expect(modelsList[1].name).toBe("other");
    });

    it("adds new model when id doesn't match any (map creates new array)", function () {
      core.set("models", [
        { id: 1, name: "model-1" },
        { id: 2, name: "model-2" },
      ]);

      models._updateModelData({ id: 999, name: "new-model" });

      // Should add new model to the list
      const modelsList = core.get("models");
      expect(modelsList).toHaveLength(3);
      expect(modelsList[2]).toEqual({ id: 999, name: "new-model" });
    });
  });

  // ============================================
  // BRANCH 4: _removeModel() - models falsy branch
  // ============================================
  describe("_removeModel() - models falsy branch", function () {
    it("handles undefined models state", function () {
      expect(core.get("models")).toBeUndefined();

      // Should not throw
      models._removeModel(1);

      // Should create empty array
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

      // List should be unchanged
      expect(core.get("models")).toHaveLength(2);
    });

    it("handles removing all models (empty result)", function () {
      core.set("models", [{ id: 1, name: "model-1" }]);

      models._removeModel(1);

      expect(core.get("models")).toEqual([]);
    });
  });

  // ============================================
  // BRANCH 5: refreshModels() - data.models falsy branch
  // ============================================
  describe("refreshModels() - data.models falsy branch", function () {
    it("handles successful response with empty models array", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();

      // Find the models:list request
      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      expect(listCall).toBeDefined();

      const requestId = listCall.data.requestId;

      // Return success with empty models array
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: [] },
      });

      await refreshPromise;

      // Models should be empty array (not undefined)
      expect(core.get("models")).toEqual([]);
      expect(core.get("models")).toHaveLength(0);
    });

    it("handles successful response with null models (triggers || [] branch)", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      // Return success with null models
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: { models: null },
      });

      await refreshPromise;

      // Should fallback to empty array
      expect(core.get("models")).toEqual([]);
    });

    it("handles successful response with undefined models", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const refreshPromise = models.refreshModels();

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      // Return success with undefined models
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: true,
        data: {},
      });

      await refreshPromise;

      // Should fallback to empty array
      expect(core.get("models")).toEqual([]);
    });

    it("handles failed refresh (error branch)", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const refreshPromise = models.refreshModels();

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      const requestId = listCall.data.requestId;

      // Trigger error response
      mockSocket.triggerEvent("models:list:result", {
        requestId,
        success: false,
        error: { message: "Network error" },
      });

      await expect(refreshPromise).rejects.toThrow("Network error");

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[STATE-MODELS] refreshModels() error:"),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("populates models with valid data", async function () {
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

      await refreshPromise;

      expect(core.get("models")).toEqual(testModels);
    });
  });

  // ============================================
  // Additional Branch Coverage: Error Handling Branches
  // ============================================
  describe("startModel() - model not found error branch", function () {
    it("throws error when models state is null", async function () {
      core.set("models", null);

      await expect(models.startModel("model-1")).rejects.toThrow("Model not found: model-1");
    });

    it("throws error when models state is undefined", async function () {
      // Don't set models at all
      expect(core.get("models")).toBeUndefined();

      await expect(models.startModel("model-1")).rejects.toThrow("Model not found: model-1");
    });

    it("throws error when model id doesn't match any in list", async function () {
      core.set("models", [
        { id: 1, name: "model-a", status: "loaded" },
        { id: 2, name: "model-b", status: "unloaded" },
      ]);

      await expect(models.startModel(999)).rejects.toThrow("Model not found: 999");
    });

    it("succeeds when model exists", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      core.set("models", [{ id: 1, name: "test-model", status: "unloaded" }]);

      models.startModel(1);

      const loadCall = mockSocket.getEmitCalls().find((c) => c.event === "models:load");
      expect(loadCall).toBeDefined();
      expect(loadCall.data.modelName).toBe("test-model");
    });
  });

  describe("stopModel() - model not found error branch", function () {
    it("throws error when models state is empty array", async function () {
      core.set("models", []);

      await expect(models.stopModel("model-1")).rejects.toThrow("Model not found: model-1");
    });

    it("throws error when model not in list", async function () {
      core.set("models", [{ id: 1, name: "existing-model" }]);

      await expect(models.stopModel(999)).rejects.toThrow("Model not found: 999");
    });

    it("succeeds when model exists", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      core.set("models", [{ id: 1, name: "loaded-model", status: "loaded" }]);

      models.stopModel(1);

      const unloadCall = mockSocket.getEmitCalls().find((c) => c.event === "models:unload");
      expect(unloadCall).toBeDefined();
      expect(unloadCall.data.modelName).toBe("loaded-model");
    });
  });

  // ============================================
  // Cache Management Branches
  // ============================================
  describe("Cache Management - State Operations", function () {
    it("_addModel handles undefined models cache", function () {
      expect(core.get("models")).toBeUndefined();

      models._addModel({ id: 1, name: "new-model" });

      expect(core.get("models")).toEqual([{ id: 1, name: "new-model" }]);
    });

    it("_addModel appends to existing models cache", function () {
      core.set("models", [{ id: 1, name: "existing" }]);

      models._addModel({ id: 2, name: "new" });

      expect(core.get("models")).toHaveLength(2);
      expect(core.get("models")[0].name).toBe("existing");
      expect(core.get("models")[1].name).toBe("new");
    });

    it("multiple _addModel calls accumulate", function () {
      models._addModel({ id: 1, name: "model-1" });
      models._addModel({ id: 2, name: "model-2" });
      models._addModel({ id: 3, name: "model-3" });

      expect(core.get("models")).toHaveLength(3);
    });

    it("getModels returns promise that resolves with models data", async function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const promise = models.getModels();

      const listCall = mockSocket.getEmitCalls().find((c) => c.event === "models:list");
      expect(listCall).toBeDefined();
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  // ============================================
  // Transition Handling Branches
  // ============================================
  describe("Transition Handling - Status Changes", function () {
    it("handles loading to loaded transition", function () {
      core.set("models", [{ id: 1, name: "test", status: "loading", progress: 50 }]);

      models._updateModel(1, "loaded", { progress: 100 });

      const model = core.get("models")[0];
      expect(model.status).toBe("loaded");
      expect(model.progress).toBe(100);
    });

    it("handles loaded to unloading transition", function () {
      core.set("models", [{ id: 1, name: "test", status: "loaded" }]);

      models._updateModel(1, "unloading");

      expect(core.get("models")[0].status).toBe("unloading");
    });

    it("handles error state transition", function () {
      core.set("models", [{ id: 1, name: "test", status: "loading" }]);

      models._updateModel(1, "error", { errorMessage: "Failed to load" });

      const model = core.get("models")[0];
      expect(model.status).toBe("error");
      expect(model.errorMessage).toBe("Failed to load");
    });

    it("handles unloaded state correctly", function () {
      core.set("models", [
        { id: 1, name: "model-1", status: "loaded" },
        { id: 2, name: "model-2", status: "loaded" },
      ]);

      // Unload model 1
      models._updateModel(1, "unloaded");

      const modelsList = core.get("models");
      expect(modelsList[0].status).toBe("unloaded");
      expect(modelsList[1].status).toBe("loaded");
    });
  });

  // ============================================
  // Validation Error Handling Branches
  // ============================================
  describe("Validation Error Handling", function () {
    it("createModel emits correct event structure", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const modelData = { name: "new-model", path: "/models/test.gguf" };
      models.createModel(modelData);

      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:create");
      expect(call).toBeDefined();
      expect(call.data.model).toEqual(modelData);
    });

    it("updateModel emits correct event structure", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      const updates = { status: "loaded", progress: 100 };
      models.updateModel("model-123", updates);

      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:update");
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
      expect(call.data.updates).toEqual(updates);
    });

    it("deleteModel emits correct event structure", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      models.deleteModel("model-123");

      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:delete");
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
    });

    it("loadModel emits correct event structure", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      models.loadModel("test-model-name");

      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:load");
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("test-model-name");
    });

    it("unloadModel emits correct event structure", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      models.unloadModel("test-model-name");

      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:unload");
      expect(call).toBeDefined();
      expect(call.data.modelName).toBe("test-model-name");
    });

    it("getModel emits correct event structure", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      models.getModel("model-123");

      const call = mockSocket.getEmitCalls().find((c) => c.event === "models:get");
      expect(call).toBeDefined();
      expect(call.data.modelId).toBe("model-123");
    });
  });

  // ============================================
  // Scan and Cleanup Branches
  // ============================================
  describe("Scan and Cleanup Operations", function () {
    it("scanModels emits models:scan event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      models.scanModels();

      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:scan")).toBe(true);
    });

    it("cleanupModels emits models:cleanup event", function () {
      mockSocket.triggerConnectionEstablished();
      mockSocket.clearEmitCalls();

      models.cleanupModels();

      expect(mockSocket.getEmitCalls().some((c) => c.event === "models:cleanup")).toBe(true);
    });
  });
});
