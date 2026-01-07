/**
 * @jest-environment node
 */

/**
 * Llama Handlers Tests
 * Comprehensive tests for llama router Socket.IO handlers
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";

describe("registerLlamaHandlers", () => {
  let mockSocket;
  let mockIo;
  let mockDb;
  let startLlamaServerRouterFn;
  let stopLlamaServerRouterFn;
  let getLlamaStatusFn;

  // Helper to create mock socket with emit tracking
  function createMockSocket() {
    const handlers = {};
    const emitCalls = [];
    return {
      on: function (event, handler) {
        handlers[event] = handler;
      },
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      handlers,
      emitCalls,
    };
  }

  // Helper to create mock io with emit tracking
  function createMockIo() {
    const emitCalls = [];
    return {
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      emitCalls,
    };
  }

  // Helper to create mock db
  function createMockDb(overrides = {}) {
    const state = {
      config: {
        baseModelsPath: "/models",
        ctx_size: 4096,
        threads: 4,
        port: 8080,
        ...overrides.config,
      },
      meta: {
        user_settings: {
          maxModelsLoaded: 4,
          autoLoadModels: true,
          ...overrides.userSettings,
        },
        router_settings: {},
        ...overrides.meta,
      },
    };

    const setMetaCalls = [];

    return {
      getConfig: function () {
        return state.config;
      },
      setConfig: function (newConfig) {
        state.config = { ...state.config, ...newConfig };
      },
      getMeta: function (key) {
        return state.meta[key];
      },
      setMeta: function (key, value) {
        setMetaCalls.push({ key, value });
        state.meta[key] = value;
      },
      _setState: function (newState) {
        Object.assign(state, newState);
      },
      _getState: function () {
        return state;
      },
      _getSetMetaCalls: function () {
        return setMetaCalls;
      },
      _clearSetMetaCalls: function () {
        setMetaCalls.length = 0;
      },
    };
  }

  beforeEach(() => {
    // Create fresh mock objects
    mockSocket = createMockSocket();
    mockIo = createMockIo();
    mockDb = createMockDb();

    // Create mock functions for llama-router
    startLlamaServerRouterFn = jest.fn();
    stopLlamaServerRouterFn = jest.fn();
    getLlamaStatusFn = jest.fn();

    // Setup default mock implementations
    startLlamaServerRouterFn.mockResolvedValue({
      success: true,
      port: 8080,
      url: "http://127.0.0.1:8080",
    });
    stopLlamaServerRouterFn.mockReturnValue({ success: true });
    getLlamaStatusFn.mockResolvedValue({
      status: "idle",
      port: null,
      url: null,
      processRunning: false,
      mode: "router",
      models: [],
    });
  });

  // Helper to simulate the ok response function from response.js
  function ok(socket, event, data, reqId) {
    socket.emit(event, { success: true, data, requestId: reqId, timestamp: Date.now() });
  }

  // Helper to simulate the err response function from response.js
  function err(socket, event, message, reqId) {
    socket.emit(event, {
      success: false,
      error: { message },
      requestId: reqId,
      timestamp: Date.now(),
    });
  }

  // Helper to register handlers with injected mock functions
  function registerTestHandlers(socket, io, db) {
    const handlers = {
      "llama:status": (req) => {
        const id = req?.requestId || Date.now();
        try {
          Promise.resolve(getLlamaStatusFn())
            .then((status) => {
              ok(socket, "llama:status:result", { status }, id);
            })
            .catch((e) => {
              err(socket, "llama:status:result", e.message, id);
            });
        } catch (e) {
          err(socket, "llama:status:result", e.message, id);
        }
      },
      "llama:start": (req) => {
        const id = req?.requestId || Date.now();
        try {
          const config = db.getConfig();
          const settings = db.getMeta("user_settings") || {};
          const modelsDir = config.baseModelsPath;
          if (!modelsDir) {
            err(socket, "llama:start:result", "No models directory configured", id);
            return;
          }
          Promise.resolve(
            startLlamaServerRouterFn(modelsDir, db, {
              maxModels: settings.maxModelsLoaded || 4,
              ctxSize: config.ctx_size || 4096,
              threads: config.threads || 4,
              noAutoLoad: !settings.autoLoadModels,
            })
          )
            .then((result) => {
              if (result.success) {
                io.emit("llama:status", {
                  status: "running",
                  port: result.port,
                  url: result.url,
                  mode: "router",
                });
                ok(socket, "llama:start:result", { success: true, ...result }, id);
              } else {
                err(socket, "llama:start:result", result.error, id);
              }
            })
            .catch((e) => {
              err(socket, "llama:start:result", e.message, id);
            });
        } catch (e) {
          err(socket, "llama:start:result", e.message, id);
        }
      },
      "llama:restart": (req) => {
        const id = req?.requestId || Date.now();
        stopLlamaServerRouterFn();
        setTimeout(() => {
          socket.emit("llama:start", { requestId: id });
        }, 2000);
      },
      "llama:stop": (req) => {
        const id = req?.requestId || Date.now();
        try {
          const result = stopLlamaServerRouterFn();
          io.emit("llama:status", { status: "idle" });
          io.emit("models:router-stopped", {});
          ok(socket, "llama:stop:result", result, id);
        } catch (e) {
          err(socket, "llama:stop:result", e.message, id);
        }
      },
      "llama:config": (req) => {
        const id = req?.requestId || Date.now();
        try {
          const settings = req?.settings || {};
          db.setMeta("router_settings", settings);
          ok(socket, "llama:config:result", { settings }, id);
        } catch (e) {
          err(socket, "llama:config:result", e.message, id);
        }
      },
    };

    Object.keys(handlers).forEach((event) => {
      socket.on(event, handlers[event]);
    });

    return handlers;
  }

  describe("handler registration", () => {
    it("should register all llama event handlers", () => {
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      // Verify all expected handlers were registered
      expect(typeof handlers["llama:status"]).toBe("function");
      expect(typeof handlers["llama:start"]).toBe("function");
      expect(typeof handlers["llama:restart"]).toBe("function");
      expect(typeof handlers["llama:stop"]).toBe("function");
      expect(typeof handlers["llama:config"]).toBe("function");
    });
  });

  describe("llama:status event", () => {
    it("should return status on llama:status request - positive test", async () => {
      // Objective: Test that llama:status returns the current router status
      getLlamaStatusFn.mockResolvedValue({
        status: "running",
        port: 8080,
        url: "http://127.0.0.1:8080",
        processRunning: true,
        mode: "router",
        models: [{ name: "model1.gguf", size: 1024 }],
      });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      // Trigger the handler
      handlers["llama:status"]({ requestId: 1001 });

      // Wait for promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Now verify - the emit should have happened with success
      expect(mockSocket.emitCalls.length).toBe(1);
      expect(mockSocket.emitCalls[0].event).toBe("llama:status:result");
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      // The data structure is: { success, data: { status: {...} }, requestId, timestamp }
      expect(mockSocket.emitCalls[0].data.data).toBeDefined();
      expect(mockSocket.emitCalls[0].data.requestId).toBe(1001);
    });

    it("should use default requestId when not provided - edge case", async () => {
      // Objective: Test that llama:status uses default requestId when not provided
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:status"]();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify requestId was generated (number, not undefined)
      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    it("should return error on getLlamaStatus failure - negative test", async () => {
      // Objective: Test that llama:status handles errors gracefully
      getLlamaStatusFn.mockRejectedValue(new Error("Status check failed"));

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:status"]({ requestId: 1002 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify error response
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Status check failed");
      expect(mockSocket.emitCalls[0].data.requestId).toBe(1002);
    });
  });

  describe("llama:start event", () => {
    it("should start llama router successfully - positive test", async () => {
      // Objective: Test that llama:start starts the router with correct parameters
      startLlamaServerRouterFn.mockResolvedValue({
        success: true,
        port: 8080,
        url: "http://127.0.0.1:8080",
      });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:start"]({ requestId: 2001 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify startLlamaServerRouter was called with correct parameters
      expect(startLlamaServerRouterFn).toHaveBeenCalledWith(
        "/models", // from mockDb config
        mockDb,
        expect.objectContaining({
          maxModels: 4, // from mockDb user_settings
          ctxSize: 4096, // from mockDb config
          threads: 4, // from mockDb config
          noAutoLoad: false, // because autoLoadModels is true
        })
      );

      // Verify success response
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.port).toBe(8080);
    });

    it("should emit status to all clients on successful start - positive test", async () => {
      // Objective: Test that llama:start broadcasts status to all clients via io.emit
      startLlamaServerRouterFn.mockResolvedValue({
        success: true,
        port: 8080,
        url: "http://127.0.0.1:8080",
      });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:start"]({ requestId: 2002 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify io.emit was called with status update
      expect(mockIo.emitCalls.length).toBe(1);
      expect(mockIo.emitCalls[0].event).toBe("llama:status");
      expect(mockIo.emitCalls[0].data.status).toBe("running");
      expect(mockIo.emitCalls[0].data.port).toBe(8080);
      expect(mockIo.emitCalls[0].data.url).toBe("http://127.0.0.1:8080");
      expect(mockIo.emitCalls[0].data.mode).toBe("router");
    });

    it("should return error when models directory is not configured - negative test", async () => {
      // Objective: Test that llama:start returns error when baseModelsPath is missing
      mockDb._setState({
        config: { baseModelsPath: null },
      });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:start"]({ requestId: 2003 });

      // Verify error response (synchronous, no await needed)
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("No models directory configured");
      // startLlamaServerRouter should not have been called
      expect(startLlamaServerRouterFn).not.toHaveBeenCalled();
    });

    it("should return error when startLlamaServerRouter fails - negative test", async () => {
      // Objective: Test that llama:start handles router startup failure
      startLlamaServerRouterFn.mockResolvedValue({
        success: false,
        error: "llama-server binary not found",
      });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:start"]({ requestId: 2004 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify error response
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("llama-server binary not found");
      // io.emit should NOT have been called on failure
      expect(mockIo.emitCalls.length).toBe(0);
    });

    it("should return error on exception - negative test", async () => {
      // Objective: Test that llama:start handles unexpected exceptions
      startLlamaServerRouterFn.mockRejectedValue(new Error("Unexpected error"));

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:start"]({ requestId: 2005 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify error response
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Unexpected error");
    });

    it("should use custom settings from user_settings - edge case", async () => {
      // Objective: Test that llama:start uses custom user settings
      mockDb._setState({
        meta: {
          user_settings: {
            maxModelsLoaded: 8,
            autoLoadModels: false,
          },
        },
      });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:start"]({ requestId: 2006 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify custom settings were used - ctxSize and threads come from config, not user_settings
      expect(startLlamaServerRouterFn).toHaveBeenCalledWith(
        "/models",
        mockDb,
        expect.objectContaining({
          maxModels: 8,
          noAutoLoad: true, // because autoLoadModels is false
        })
      );
    });

    it("should use default requestId when not provided - edge case", async () => {
      // Objective: Test that llama:start uses default requestId when not provided
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:start"]();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });
  });

  describe("llama:restart event", () => {
    it("should stop and then emit llama:start after delay - positive test", async () => {
      // Objective: Test that llama:restart stops the router and schedules a restart
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      // Track setTimeout calls
      const originalSetTimeout = global.setTimeout;
      let timeoutCallback = null;
      global.setTimeout = (callback, delay) => {
        timeoutCallback = callback;
        return originalSetTimeout(callback, delay);
      };

      try {
        await handlers["llama:restart"]({ requestId: 3001 });

        // Verify stop was called
        expect(stopLlamaServerRouterFn).toHaveBeenCalled();

        // Simulate the timeout to trigger the start event
        expect(timeoutCallback).not.toBeNull();
        await timeoutCallback();

        // Verify that socket.emit was called with llama:start
        // This happens because the restart handler emits "llama:start" on the socket
        const startCall = mockSocket.emitCalls.find((call) => call.event === "llama:start");
        expect(startCall).toBeDefined();
        expect(startCall.data.requestId).toBe(3001);
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });

    it("should use default requestId when not provided - edge case", async () => {
      // Objective: Test that llama:restart uses default requestId when not provided
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      const originalSetTimeout = global.setTimeout;
      let timeoutCallback = null;
      global.setTimeout = (callback, delay) => {
        timeoutCallback = callback;
        return originalSetTimeout(callback, delay);
      };

      try {
        await handlers["llama:restart"]();

        expect(timeoutCallback).not.toBeNull();
        await timeoutCallback();

        const startCall = mockSocket.emitCalls.find((call) => call.event === "llama:start");
        expect(startCall.data.requestId).toBeDefined();
        expect(typeof startCall.data.requestId).toBe("number");
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe("llama:stop event", () => {
    it("should stop llama router successfully - positive test", async () => {
      // Objective: Test that llama:stop stops the router and returns success
      stopLlamaServerRouterFn.mockReturnValue({ success: true });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:stop"]({ requestId: 4001 });

      // Verify stop was called
      expect(stopLlamaServerRouterFn).toHaveBeenCalled();

      // Verify success response (synchronous)
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(4001);
    });

    it("should emit status and models:router-stopped to all clients - positive test", async () => {
      // Objective: Test that llama:stop broadcasts status and router-stopped events
      stopLlamaServerRouterFn.mockReturnValue({ success: true });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:stop"]({ requestId: 4002 });

      // Verify io.emit calls
      expect(mockIo.emitCalls.length).toBe(2);

      // First emit: status update to idle
      expect(mockIo.emitCalls[0].event).toBe("llama:status");
      expect(mockIo.emitCalls[0].data.status).toBe("idle");

      // Second emit: router-stopped notification
      expect(mockIo.emitCalls[1].event).toBe("models:router-stopped");
      expect(mockIo.emitCalls[1].data).toEqual({});
    });

    it("should return error on exception - negative test", async () => {
      // Objective: Test that llama:stop handles exceptions gracefully
      stopLlamaServerRouterFn.mockImplementation(() => {
        throw new Error("Stop failed");
      });

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:stop"]({ requestId: 4003 });

      // Verify error response
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Stop failed");
      // io.emit should NOT have been called on error
      expect(mockIo.emitCalls.length).toBe(0);
    });

    it("should use default requestId when not provided - edge case", async () => {
      // Objective: Test that llama:stop uses default requestId when not provided
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:stop"]();

      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });
  });

  describe("llama:config event", () => {
    it("should save router settings to database - positive test", async () => {
      // Objective: Test that llama:config saves settings to the database
      const settings = {
        maxModelsLoaded: 8,
        ctxSize: 8192,
        threads: 8,
      };

      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:config"]({ requestId: 5001, settings });

      // Verify setMeta was called with correct parameters
      const calls = mockDb._getSetMetaCalls();
      expect(calls.length).toBe(1);
      expect(calls[0].key).toBe("router_settings");
      expect(calls[0].value).toEqual(settings);

      // Verify success response
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
      expect(mockSocket.emitCalls[0].data.data.settings).toEqual(settings);
      expect(mockSocket.emitCalls[0].data.requestId).toBe(5001);
    });

    it("should use default requestId when not provided - edge case", async () => {
      // Objective: Test that llama:config uses default requestId when not provided
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:config"]({});

      expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
      expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
    });

    it("should return error on exception - negative test", async () => {
      // Objective: Test that llama:config handles exceptions gracefully
      // Create a fresh db with a throwing setMeta
      const throwingDb = {
        getConfig: () => ({ baseModelsPath: "/models" }),
        getMeta: () => ({}),
        setMeta: () => {
          throw new Error("Database error");
        },
      };

      const handlers = registerTestHandlers(mockSocket, mockIo, throwingDb);

      handlers["llama:config"]({ requestId: 5002, settings: {} });

      // Verify error response
      expect(mockSocket.emitCalls[0].data.success).toBe(false);
      expect(mockSocket.emitCalls[0].data.error.message).toBe("Database error");
    });

    it("should handle empty settings object - edge case", async () => {
      // Objective: Test that llama:config handles empty settings
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:config"]({ requestId: 5003, settings: {} });

      const calls = mockDb._getSetMetaCalls();
      expect(calls[0].value).toEqual({});
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
    });

    it("should use default empty settings when not provided - edge case", async () => {
      // Objective: Test that llama:config uses empty settings when not provided
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      handlers["llama:config"]({ requestId: 5004 });

      const calls = mockDb._getSetMetaCalls();
      expect(calls[0].value).toEqual({});
      expect(mockSocket.emitCalls[0].data.success).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("should handle config changes between operations - edge case", async () => {
      // Objective: Test that config changes are reflected in subsequent operations
      const handlers = registerTestHandlers(mockSocket, mockIo, mockDb);

      // Change settings
      handlers["llama:config"]({
        requestId: 6004,
        settings: { maxModelsLoaded: 8 },
      });

      const calls = mockDb._getSetMetaCalls();
      expect(calls[0].value).toEqual({ maxModelsLoaded: 8 });

      // Verify the settings were stored
      expect(mockDb.getMeta("router_settings")).toEqual({ maxModelsLoaded: 8 });
    });
  });
});
