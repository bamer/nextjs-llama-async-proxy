/**
 * State Requests Module Tests - Focus on uncovered branches
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

// Mock Map for environments that might not have them
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

// Load the state-requests module
const stateRequestsPath = new URL(
  "../../../public/js/core/state/state-requests.js",
  import.meta.url
);
await import(stateRequestsPath.href);

// Get the StateRequests from global window
const StateRequests = global.window.StateRequests;

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

describe("StateRequests - Uncovered Branches", function () {
  let mockSocket;
  let pending;

  beforeEach(function () {
    mockSocket = createMockSocket();
    pending = new Map();
  });

  afterEach(function () {
    // Clean up any pending timeouts
    pending.forEach(function (req) {
      if (req.timeout) {
        clearTimeout(req.timeout);
      }
    });
    pending.clear();
  });

  describe("request() - connection timeout branch", function () {
    it("rejects with Connection timeout when not connected and times out", async function () {
      jest.useFakeTimers();
      mockSocket.listeners.set("connect", []);

      const promise = StateRequests.request(mockSocket, false, "test:event", {}, pending);

      jest.advanceTimersByTime(10000);

      await expect(promise).rejects.toThrow("Connection timeout");
      jest.useRealTimers();
    });

    it("clears connection check interval on timeout", async function () {
      jest.useFakeTimers();
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      mockSocket.listeners.set("connect", []);

      const promise = StateRequests.request(mockSocket, false, "test:event", {}, pending);

      jest.advanceTimersByTime(10000);

      await expect(promise).rejects.toThrow("Connection timeout");
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
      jest.useRealTimers();
    });

    it("makes request immediately when connected=true", function () {
      // When connected is true, request is made immediately
      StateRequests.request(mockSocket, true, "test:event", { data: "test" }, pending);

      // Request should be in pending immediately
      expect(pending.size).toBe(1);

      const reqId = pending.keys().next().value;
      const req = pending.get(reqId);
      expect(req.event).toBe("test:event");
      expect(req.resolve).toBeDefined();
      expect(req.reject).toBeDefined();
    });
  });

  describe("_doRequest() - timeout branch", function () {
    it("removes request from pending on timeout", async function () {
      jest.useFakeTimers();

      StateRequests._doRequest(mockSocket, "config:get", {}, jest.fn(), jest.fn(), pending);

      const reqId = pending.keys().next().value;
      expect(pending.has(reqId)).toBe(true);

      jest.advanceTimersByTime(5000);

      expect(pending.has(reqId)).toBe(false);
      jest.useRealTimers();
    });

    it("rejects with Timeout error message on timeout", async function () {
      jest.useFakeTimers();
      const reject = jest.fn();

      StateRequests._doRequest(mockSocket, "models:list", {}, jest.fn(), reject, pending);

      const reqId = pending.keys().next().value;
      jest.advanceTimersByTime(120000);

      expect(reject).toHaveBeenCalledWith(new Error("Timeout: models:list"));
      jest.useRealTimers();
    });

    it("logs warning on timeout", async function () {
      jest.useFakeTimers();
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(function () {});

      StateRequests._doRequest(mockSocket, "models:list", {}, jest.fn(), jest.fn(), pending);

      const reqId = pending.keys().next().value;
      jest.advanceTimersByTime(120000);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[STATE-REQUESTS] Request timeout:",
        "models:list",
        "requestId:",
        reqId
      );
      consoleWarnSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe("Event name based timeout selection", function () {
    it("uses 5000ms for config: events", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      StateRequests._doRequest(mockSocket, "config:get", {}, jest.fn(), jest.fn(), pending);
      expect(capturedDelay).toBe(5000);

      global.setTimeout = originalSetTimeout;
      const reqId = pending.keys().next().value;
      clearTimeout(pending.get(reqId).timeout);
      pending.delete(reqId);
    });

    it("uses 5000ms for settings: events", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      StateRequests._doRequest(mockSocket, "settings:update", {}, jest.fn(), jest.fn(), pending);
      expect(capturedDelay).toBe(5000);

      global.setTimeout = originalSetTimeout;
      const reqId = pending.keys().next().value;
      clearTimeout(pending.get(reqId).timeout);
      pending.delete(reqId);
    });

    it("uses 120000ms for non-config events", function () {
      const mockSocket = createMockSocket();
      const pending = new Map();
      const originalSetTimeout = global.setTimeout;
      let capturedDelay = null;
      global.setTimeout = function (fn, delay) {
        capturedDelay = delay;
        return originalSetTimeout(fn, delay);
      };

      StateRequests._doRequest(mockSocket, "models:list", {}, jest.fn(), jest.fn(), pending);
      expect(capturedDelay).toBe(120000);

      global.setTimeout = originalSetTimeout;
      const reqId = pending.keys().next().value;
      clearTimeout(pending.get(reqId).timeout);
      pending.delete(reqId);
    });
  });

  describe("Request cancellation cleanup", function () {
    // Note: The following tests verify that StateRequests properly manages the pending map
    // The actual response handling and clearTimeout are done by the response handler module

    it("adds request to pending map with all required fields", function () {
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

      const reqId = pending.keys().next().value;
      const pendingReq = pending.get(reqId);

      expect(pendingReq).toBeDefined();
      expect(pendingReq.resolve).toBe(resolve);
      expect(pendingReq.reject).toBe(reject);
      expect(pendingReq.event).toBe("test:event");
      expect(pendingReq.timeout).toBeDefined();
      expect(typeof pendingReq.timeout).toBe("number"); // timeout ID from setTimeout
    });

    it("removes request from pending map on timeout", function () {
      jest.useFakeTimers();

      StateRequests._doRequest(mockSocket, "config:get", {}, jest.fn(), jest.fn(), pending);

      const reqId = pending.keys().next().value;
      expect(pending.has(reqId)).toBe(true);

      jest.advanceTimersByTime(5000);

      expect(pending.has(reqId)).toBe(false);
      jest.useRealTimers();
    });
  });
});
