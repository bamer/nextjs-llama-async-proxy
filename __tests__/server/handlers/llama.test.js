/**
 * @jest-environment node
 */

/**
 * Llama Handlers Tests
 * Comprehensive tests for llama router Socket.IO handlers
 * Tests the actual registerLlamaHandlers function from server/handlers/llama.js
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock the llama-router module before importing llama.js
const mockStartLlamaServerRouter = jest.fn();
const mockStopLlamaServerRouter = jest.fn();
const mockGetLlamaStatus = jest.fn();

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js",
  () => ({
    startLlamaServerRouter: mockStartLlamaServerRouter,
    stopLlamaServerRouter: mockStopLlamaServerRouter,
    getLlamaStatus: mockGetLlamaStatus,
  })
);

// Import after mocking
const { registerLlamaHandlers } =
  await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama.js");

describe("registerLlamaHandlers", () => {
  let mockSocket;
  let mockIo;
  let mockDb;

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

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockStartLlamaServerRouter.mockResolvedValue({
      success: true,
      port: 8080,
      url: "http://127.0.0.1:8080",
    });
    mockStopLlamaServerRouter.mockReturnValue({ success: true });
    mockGetLlamaStatus.mockResolvedValue({
      status: "idle",
      port: null,
      url: null,
      processRunning: false,
      mode: "router",
      models: [],
    });
  });

  describe("handler registration", () => {
    it("should register all llama event handlers", () => {
      // Objective: Test that registerLlamaHandlers registers all expected event handlers
      registerLlamaHandlers(mockSocket, mockIo, mockDb);

      // Verify all expected handlers were registered
      expect(typeof mockSocket.handlers["llama:status"]).toBe("function");
      expect(typeof mockSocket.handlers["llama:start"]).toBe("function");
      expect(typeof mockSocket.handlers["llama:restart"]).toBe("function");
      expect(typeof mockSocket.handlers["llama:stop"]).toBe("function");
      expect(typeof mockSocket.handlers["llama:config"]).toBe("function");
    });

    it("should not emit anything during registration", () => {
      // Objective: Test that handler registration doesn't emit any events
      registerLlamaHandlers(mockSocket, mockIo, mockDb);

      // No emits should happen during registration
      expect(mockSocket.emitCalls.length).toBe(0);
      expect(mockIo.emitCalls.length).toBe(0);
    });
  });

  describe("llama:status event", () => {
    describe("positive tests - correct functionality", () => {
      it("should return status on llama:status request", async () => {
        // Objective: Test that llama:status returns the current router status
        mockGetLlamaStatus.mockResolvedValue({
          status: "running",
          port: 8080,
          url: "http://127.0.0.1:8080",
          processRunning: true,
          mode: "router",
          models: [{ name: "model1.gguf", size: 1024 }],
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        // Trigger the handler
        mockSocket.handlers["llama:status"]({ requestId: 1001 });

        // Wait for promises to resolve
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify success response
        expect(mockSocket.emitCalls.length).toBe(1);
        expect(mockSocket.emitCalls[0].event).toBe("llama:status:result");
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data).toBeDefined();
        expect(mockSocket.emitCalls[0].data.requestId).toBe(1001);
        expect(mockSocket.emitCalls[0].data.data.status.status).toBe("running");
        expect(mockSocket.emitCalls[0].data.data.status.port).toBe(8080);
      });

      it("should call getLlamaStatus to retrieve router status", async () => {
        // Objective: Test that llama:status calls the getLlamaStatus function
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:status"]({});

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockGetLlamaStatus).toHaveBeenCalled();
      });

      it("should use default requestId when not provided", async () => {
        // Objective: Test that llama:status uses default requestId when not provided
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:status"]();

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify requestId was generated (number, not undefined)
        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
        expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
      });

      it("should include timestamp in response", async () => {
        // Objective: Test that llama:status response includes a timestamp
        const beforeCall = Date.now();
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:status"]({});

        await new Promise((resolve) => setTimeout(resolve, 10));

        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(typeof response.timestamp).toBe("number");
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error on getLlamaStatus rejection", async () => {
        // Objective: Test that llama:status handles getLlamaStatus rejection gracefully
        mockGetLlamaStatus.mockRejectedValue(new Error("Status check failed"));

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:status"]({ requestId: 1002 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Status check failed");
        expect(mockSocket.emitCalls[0].data.requestId).toBe(1002);
      });

      it("should handle synchronous exception in status handler", async () => {
        // Objective: Test that llama:status handles synchronous exceptions
        mockGetLlamaStatus.mockImplementation(() => {
          throw new Error("Sync error");
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:status"]({ requestId: 1003 });

        // Wait for any async operations
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Sync error");
      });

      it("should handle null request gracefully", async () => {
        // Objective: Test that llama:status handles null request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:status"](null);

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data).toBeDefined();
      });

      it("should handle undefined request gracefully", async () => {
        // Objective: Test that llama:status handles undefined request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:status"](undefined);

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });
    });
  });

  describe("llama:start event", () => {
    describe("positive tests - correct functionality", () => {
      it("should start llama router successfully", async () => {
        // Objective: Test that llama:start starts the router with correct parameters
        mockStartLlamaServerRouter.mockResolvedValue({
          success: true,
          port: 8080,
          url: "http://127.0.0.1:8080",
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2001 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify startLlamaServerRouter was called with correct parameters
        expect(mockStartLlamaServerRouter).toHaveBeenCalledWith(
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
        expect(mockSocket.emitCalls[0].data.requestId).toBe(2001);
      });

      it("should emit status to all clients on successful start", async () => {
        // Objective: Test that llama:start broadcasts status to all clients via io.emit
        mockStartLlamaServerRouter.mockResolvedValue({
          success: true,
          port: 8080,
          url: "http://127.0.0.1:8080",
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2002 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify io.emit was called with status update
        expect(mockIo.emitCalls.length).toBe(1);
        expect(mockIo.emitCalls[0].event).toBe("llama:status");
        expect(mockIo.emitCalls[0].data.status).toBe("running");
        expect(mockIo.emitCalls[0].data.port).toBe(8080);
        expect(mockIo.emitCalls[0].data.url).toBe("http://127.0.0.1:8080");
        expect(mockIo.emitCalls[0].data.mode).toBe("router");
      });

      it("should use custom settings from user_settings", async () => {
        // Objective: Test that llama:start uses custom user settings
        mockDb._setState({
          meta: {
            user_settings: {
              maxModelsLoaded: 8,
              autoLoadModels: false,
            },
          },
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2006 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify custom settings were used
        expect(mockStartLlamaServerRouter).toHaveBeenCalledWith(
          "/models",
          mockDb,
          expect.objectContaining({
            maxModels: 8,
            noAutoLoad: true, // because autoLoadModels is false
          })
        );
      });

      it("should use default requestId when not provided", async () => {
        // Objective: Test that llama:start uses default requestId when not provided
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]();

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
        expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
      });

      it("should include timestamp in response", async () => {
        // Objective: Test that llama:start response includes a timestamp
        const beforeCall = Date.now();
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({});

        await new Promise((resolve) => setTimeout(resolve, 10));

        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should use default maxModels when user_settings returns null", async () => {
        // Objective: Test that llama:start uses default maxModels when getMeta returns null
        mockDb.getMeta = function () {
          return null; // Explicitly return null
        };

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2008 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Should use default maxModels: 4
        expect(mockStartLlamaServerRouter).toHaveBeenCalledWith(
          "/models",
          mockDb,
          expect.objectContaining({
            maxModels: 4, // default when settings is null/undefined
          })
        );
      });

      it("should use default ctxSize and threads when config values are 0", async () => {
        // Objective: Test that llama:start uses defaults when config has 0 values
        mockDb._setState({
          config: {
            baseModelsPath: "/models",
            ctx_size: 0, // falsy value
            threads: 0, // falsy value
          },
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2009 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Should use defaults: ctxSize: 4096, threads: 4
        expect(mockStartLlamaServerRouter).toHaveBeenCalledWith(
          "/models",
          mockDb,
          expect.objectContaining({
            ctxSize: 4096, // default when ctx_size is 0
            threads: 4, // default when threads is 0
          })
        );
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error when models directory is not configured", async () => {
        // Objective: Test that llama:start returns error when baseModelsPath is missing
        mockDb._setState({
          config: { baseModelsPath: null },
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2003 });

        // Verify error response (synchronous, no await needed)
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("No models directory configured");
        // startLlamaServerRouter should not have been called
        expect(mockStartLlamaServerRouter).not.toHaveBeenCalled();
        // io.emit should NOT have been called
        expect(mockIo.emitCalls.length).toBe(0);
      });

      it("should return error when models directory is empty string", async () => {
        // Objective: Test that llama:start returns error when baseModelsPath is empty string
        mockDb._setState({
          config: { baseModelsPath: "" },
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2003 });

        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("No models directory configured");
      });

      it("should return error when startLlamaServerRouter returns failure", async () => {
        // Objective: Test that llama:start handles router startup failure (success: false)
        mockStartLlamaServerRouter.mockResolvedValue({
          success: false,
          error: "llama-server binary not found",
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2004 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("llama-server binary not found");
        // io.emit should NOT have been called on failure
        expect(mockIo.emitCalls.length).toBe(0);
      });

      it("should return error on exception", async () => {
        // Objective: Test that llama:start handles unexpected exceptions
        mockStartLlamaServerRouter.mockRejectedValue(new Error("Unexpected error"));

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2005 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Unexpected error");
        // io.emit should NOT have been called on error
        expect(mockIo.emitCalls.length).toBe(0);
      });

      it("should handle synchronous exception in start handler", async () => {
        // Objective: Test that llama:start handles synchronous exceptions
        mockDb.getConfig = function () {
          throw new Error("Config error");
        };

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"]({ requestId: 2007 });

        await new Promise((resolve) => setTimeout(resolve, 10));

        // Verify error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Config error");
      });

      it("should handle null request gracefully", async () => {
        // Objective: Test that llama:start handles null request (uses defaults)
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:start"](null);

        await new Promise((resolve) => setTimeout(resolve, 10));

        // When null request is passed, it uses default values from mockDb
        // which has baseModelsPath set, so it proceeds to start the router
        expect(mockStartLlamaServerRouter).toHaveBeenCalled();
      });
    });
  });

  describe("llama:restart event", () => {
    describe("positive tests - correct functionality", () => {
      it("should stop and then emit llama:start after delay", async () => {
        // Objective: Test that llama:restart stops the router and schedules a restart
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        // Track setTimeout calls
        const originalSetTimeout = global.setTimeout;
        let timeoutCallback = null;
        global.setTimeout = (callback, delay) => {
          timeoutCallback = callback;
          return originalSetTimeout(callback, delay);
        };

        try {
          await mockSocket.handlers["llama:restart"]({ requestId: 3001 });

          // Verify stop was called
          expect(mockStopLlamaServerRouter).toHaveBeenCalled();

          // Simulate the timeout to trigger the start event
          expect(timeoutCallback).not.toBeNull();
          await timeoutCallback();

          // Verify that socket.emit was called with llama:start
          const startCall = mockSocket.emitCalls.find((call) => call.event === "llama:start");
          expect(startCall).toBeDefined();
          expect(startCall.data.requestId).toBe(3001);
        } finally {
          global.setTimeout = originalSetTimeout;
        }
      });

      it("should use default requestId when not provided", async () => {
        // Objective: Test that llama:restart uses default requestId when not provided
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        const originalSetTimeout = global.setTimeout;
        let timeoutCallback = null;
        global.setTimeout = (callback, delay) => {
          timeoutCallback = callback;
          return originalSetTimeout(callback, delay);
        };

        try {
          await mockSocket.handlers["llama:restart"]();

          expect(timeoutCallback).not.toBeNull();
          await timeoutCallback();

          const startCall = mockSocket.emitCalls.find((call) => call.event === "llama:start");
          expect(startCall.data.requestId).toBeDefined();
          expect(typeof startCall.data.requestId).toBe("number");
        } finally {
          global.setTimeout = originalSetTimeout;
        }
      });

      it("should always call stopLlamaServerRouter even if start fails later", async () => {
        // Objective: Test that llama:restart always calls stop first
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        // Make start fail
        mockStartLlamaServerRouter.mockRejectedValue(new Error("Start failed"));

        const originalSetTimeout = global.setTimeout;
        let timeoutCallback = null;
        global.setTimeout = (callback, delay) => {
          timeoutCallback = callback;
          return originalSetTimeout(callback, delay);
        };

        try {
          await mockSocket.handlers["llama:restart"]({ requestId: 3002 });
          await timeoutCallback();

          // Stop should have been called regardless of start outcome
          expect(mockStopLlamaServerRouter).toHaveBeenCalled();
        } finally {
          global.setTimeout = originalSetTimeout;
        }
      });
    });

    describe("negative tests - error handling", () => {
      it("should handle null request gracefully", async () => {
        // Objective: Test that llama:restart handles null request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        const originalSetTimeout = global.setTimeout;
        let timeoutCallback = null;
        global.setTimeout = (callback, delay) => {
          timeoutCallback = callback;
          return originalSetTimeout(callback, delay);
        };

        try {
          await mockSocket.handlers["llama:restart"](null);

          expect(timeoutCallback).not.toBeNull();
          expect(mockStopLlamaServerRouter).toHaveBeenCalled();
        } finally {
          global.setTimeout = originalSetTimeout;
        }
      });

      it("should handle undefined request gracefully", async () => {
        // Objective: Test that llama:restart handles undefined request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        const originalSetTimeout = global.setTimeout;
        let timeoutCallback = null;
        global.setTimeout = (callback, delay) => {
          timeoutCallback = callback;
          return originalSetTimeout(callback, delay);
        };

        try {
          await mockSocket.handlers["llama:restart"](undefined);

          expect(timeoutCallback).not.toBeNull();
          expect(mockStopLlamaServerRouter).toHaveBeenCalled();
        } finally {
          global.setTimeout = originalSetTimeout;
        }
      });
    });
  });

  describe("llama:stop event", () => {
    describe("positive tests - correct functionality", () => {
      it("should stop llama router successfully", async () => {
        // Objective: Test that llama:stop stops the router and returns success
        mockStopLlamaServerRouter.mockReturnValue({ success: true });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"]({ requestId: 4001 });

        // Verify stop was called
        expect(mockStopLlamaServerRouter).toHaveBeenCalled();

        // Verify success response (synchronous)
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.data.success).toBe(true);
        expect(mockSocket.emitCalls[0].data.requestId).toBe(4001);
      });

      it("should emit status and models:router-stopped to all clients", async () => {
        // Objective: Test that llama:stop broadcasts status and router-stopped events
        mockStopLlamaServerRouter.mockReturnValue({ success: true });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"]({ requestId: 4002 });

        // Verify io.emit calls
        expect(mockIo.emitCalls.length).toBe(2);

        // First emit: status update to idle
        expect(mockIo.emitCalls[0].event).toBe("llama:status");
        expect(mockIo.emitCalls[0].data.status).toBe("idle");

        // Second emit: router-stopped notification
        expect(mockIo.emitCalls[1].event).toBe("models:router-stopped");
        expect(mockIo.emitCalls[1].data).toEqual({});
      });

      it("should use default requestId when not provided", async () => {
        // Objective: Test that llama:stop uses default requestId when not provided
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"]();

        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
        expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
      });

      it("should include timestamp in response", async () => {
        // Objective: Test that llama:stop response includes a timestamp
        const beforeCall = Date.now();
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"]({});

        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should return the result from stopLlamaServerRouter", async () => {
        // Objective: Test that llama:stop returns the result from stopLlamaServerRouter
        mockStopLlamaServerRouter.mockReturnValue({ success: true, pid: 12345 });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"]({ requestId: 4005 });

        expect(mockSocket.emitCalls[0].data.data).toEqual({ success: true, pid: 12345 });
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error on exception", async () => {
        // Objective: Test that llama:stop handles exceptions gracefully
        mockStopLlamaServerRouter.mockImplementation(() => {
          throw new Error("Stop failed");
        });

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"]({ requestId: 4003 });

        // Verify error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Stop failed");
        // io.emit should NOT have been called on error
        expect(mockIo.emitCalls.length).toBe(0);
      });

      it("should handle null request gracefully", async () => {
        // Objective: Test that llama:stop handles null request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"](null);

        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockIo.emitCalls.length).toBe(2);
      });

      it("should handle undefined request gracefully", async () => {
        // Objective: Test that llama:stop handles undefined request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:stop"](undefined);

        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        expect(mockIo.emitCalls.length).toBe(2);
      });
    });
  });

  describe("llama:config event", () => {
    describe("positive tests - correct functionality", () => {
      it("should save router settings to database", async () => {
        // Objective: Test that llama:config saves settings to the database
        const settings = {
          maxModelsLoaded: 8,
          ctxSize: 8192,
          threads: 8,
        };

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"]({ requestId: 5001, settings });

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

      it("should use default requestId when not provided", async () => {
        // Objective: Test that llama:config uses default requestId when not provided
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"]({});

        expect(mockSocket.emitCalls[0].data.requestId).toBeDefined();
        expect(typeof mockSocket.emitCalls[0].data.requestId).toBe("number");
      });

      it("should include timestamp in response", async () => {
        // Objective: Test that llama:config response includes a timestamp
        const beforeCall = Date.now();
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"]({});

        const response = mockSocket.emitCalls[0].data;
        expect(response.timestamp).toBeDefined();
        expect(response.timestamp).toBeGreaterThanOrEqual(beforeCall);
      });

      it("should handle empty settings object", async () => {
        // Objective: Test that llama:config handles empty settings
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"]({ requestId: 5003, settings: {} });

        const calls = mockDb._getSetMetaCalls();
        expect(calls[0].value).toEqual({});
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should use default empty settings when not provided", async () => {
        // Objective: Test that llama:config uses empty settings when not provided
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"]({ requestId: 5004 });

        const calls = mockDb._getSetMetaCalls();
        expect(calls[0].value).toEqual({});
        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });

      it("should store complex nested settings", async () => {
        // Objective: Test that llama:config stores complex nested settings
        const complexSettings = {
          ui: { theme: "dark" },
          behavior: { autoRefresh: true },
        };

        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"]({ settings: complexSettings });

        const calls = mockDb._getSetMetaCalls();
        expect(calls[0].value).toEqual(complexSettings);
      });
    });

    describe("negative tests - error handling", () => {
      it("should return error on exception", async () => {
        // Objective: Test that llama:config handles exceptions gracefully
        // Create a fresh db with a throwing setMeta
        const throwingDb = {
          getConfig: () => ({ baseModelsPath: "/models" }),
          getMeta: () => ({}),
          setMeta: () => {
            throw new Error("Database error");
          },
        };

        registerLlamaHandlers(mockSocket, mockIo, throwingDb);

        mockSocket.handlers["llama:config"]({ requestId: 5002, settings: {} });

        // Verify error response
        expect(mockSocket.emitCalls[0].data.success).toBe(false);
        expect(mockSocket.emitCalls[0].data.error.message).toBe("Database error");
      });

      it("should handle null request gracefully", async () => {
        // Objective: Test that llama:config handles null request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"](null);

        expect(mockSocket.emitCalls[0].data.success).toBe(true);
        const calls = mockDb._getSetMetaCalls();
        expect(calls[0].value).toEqual({});
      });

      it("should handle undefined request gracefully", async () => {
        // Objective: Test that llama:config handles undefined request
        registerLlamaHandlers(mockSocket, mockIo, mockDb);

        mockSocket.handlers["llama:config"](undefined);

        expect(mockSocket.emitCalls[0].data.success).toBe(true);
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle config changes between operations", async () => {
      // Objective: Test that config changes are reflected in subsequent operations
      registerLlamaHandlers(mockSocket, mockIo, mockDb);

      // Change settings
      mockSocket.handlers["llama:config"]({
        requestId: 6004,
        settings: { maxModelsLoaded: 8 },
      });

      const calls = mockDb._getSetMetaCalls();
      expect(calls[0].value).toEqual({ maxModelsLoaded: 8 });

      // Verify the settings were stored
      expect(mockDb.getMeta("router_settings")).toEqual({ maxModelsLoaded: 8 });
    });

    it("should handle multiple consecutive operations", async () => {
      // Objective: Test that multiple operations can be handled in sequence
      registerLlamaHandlers(mockSocket, mockIo, mockDb);

      // Status check
      mockSocket.handlers["llama:status"]({ requestId: 7001 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockSocket.emitCalls.length).toBe(1);

      // Config update
      mockSocket.handlers["llama:config"]({ requestId: 7002, settings: { test: true } });
      expect(mockSocket.emitCalls.length).toBe(2);
      expect(mockSocket.emitCalls[1].data.success).toBe(true);
    });

    it("should handle multiple socket instances independently", async () => {
      // Objective: Test that multiple socket instances have independent handlers
      const socket1 = createMockSocket();
      const socket2 = createMockSocket();

      registerLlamaHandlers(socket1, mockIo, mockDb);
      registerLlamaHandlers(socket2, mockIo, mockDb);

      // Trigger on socket1
      socket1.handlers["llama:config"]({ requestId: 8001, settings: { from: "socket1" } });

      // Trigger on socket2
      socket2.handlers["llama:config"]({ requestId: 8002, settings: { from: "socket2" } });

      // Each socket should have its own emit calls
      expect(socket1.emitCalls.length).toBe(1);
      expect(socket2.emitCalls.length).toBe(1);
      expect(socket1.emitCalls[0].data.data.settings.from).toBe("socket1");
      expect(socket2.emitCalls[0].data.data.settings.from).toBe("socket2");
    });
  });

  describe("response format validation", () => {
    it("should include all required fields in success response", async () => {
      // Objective: Test that success responses have all required fields
      registerLlamaHandlers(mockSocket, mockIo, mockDb);

      mockSocket.handlers["llama:status"]({ requestId: 9001 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", true);
      expect(response).toHaveProperty("data");
      expect(response).toHaveProperty("requestId", 9001);
      expect(response).toHaveProperty("timestamp");
      expect(typeof response.timestamp).toBe("number");
    });

    it("should include all required fields in error response", async () => {
      // Objective: Test that error responses have all required fields
      mockGetLlamaStatus.mockRejectedValue(new Error("Test error"));
      registerLlamaHandlers(mockSocket, mockIo, mockDb);

      mockSocket.handlers["llama:status"]({ requestId: 9002 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockSocket.emitCalls[0].data;
      expect(response).toHaveProperty("success", false);
      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("message");
      expect(response).toHaveProperty("requestId", 9002);
      expect(response).toHaveProperty("timestamp");
    });

    it("should use correct event names for responses", async () => {
      // Objective: Test that responses use the correct event names
      registerLlamaHandlers(mockSocket, mockIo, mockDb);

      // Test status response event
      mockSocket.handlers["llama:status"]({ requestId: 9010 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockSocket.emitCalls[0].event).toBe("llama:status:result");

      // Clear and test start response event
      mockSocket.emitCalls.length = 0;
      mockStartLlamaServerRouter.mockResolvedValue({ success: true });
      mockSocket.handlers["llama:start"]({ requestId: 9011 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockSocket.emitCalls[0].event).toBe("llama:start:result");
    });
  });
});
