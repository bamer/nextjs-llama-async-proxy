/**
 * @jest-environment node
 */

/**
 * Router-Ops Coverage Tests
 * Tests for achieving 100% coverage on router-ops.js by mocking ESM dependencies
 */

import { jest, describe, it, expect, beforeAll, afterAll } from "@jest/globals";

// Mock the llama-router module BEFORE any imports
const mockLoadModel = jest.fn();
const mockUnloadModel = jest.fn();

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/index.js",
  () => ({
    loadModel: mockLoadModel,
    unloadModel: mockUnloadModel,
    // Export other functions as identity to avoid breaking the module
    startLlamaServerRouter: jest.fn(),
    stopLlamaServerRouter: jest.fn(),
    getLlamaStatus: jest.fn(),
    llamaApiRequest: jest.fn(),
    isPortInUse: jest.fn(),
    findLlamaServer: jest.fn(),
    findAvailablePort: jest.fn(),
    killLlamaServer: jest.fn(),
    killLlamaOnPort: jest.fn(),
    getRouterState: jest.fn(),
    getServerUrl: jest.fn(),
    getServerProcess: jest.fn(),
  })
);

describe("router-ops.js 100% coverage", () => {
  let mockSocket;
  let mockIo;
  let registerModelsRouterHandlers;

  /**
   * Creates a mock socket with event handler tracking and emit call recording
   */
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

  /**
   * Creates a mock io object for broadcasting
   */
  function createMockIo() {
    const emitCalls = [];
    return {
      emit: function (event, data) {
        emitCalls.push({ event, data });
      },
      emitCalls,
    };
  }

  beforeAll(async () => {
    // Import the module after mocking
    const mod =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/models/router-ops.js");
    registerModelsRouterHandlers = mod.registerModelsRouterHandlers;

    // Mock console to reduce noise in tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockSocket = createMockSocket();
    mockIo = createMockIo();
    // Clear mock call history
    mockLoadModel.mockClear();
    mockUnloadModel.mockClear();
  });

  /**
   * POSITIVE TESTS - Success paths (lines 23-24 and 45-46)
   */

  describe("models:load success path - lines 23-24", () => {
    it("should emit models:status 'loaded' and send ok response when loadModel succeeds", async () => {
      // This test achieves coverage on lines 23-24: if (result.success) {...}
      // Arrange: Mock loadModel to return success
      mockLoadModel.mockResolvedValue({
        success: true,
        result: { status: "loaded" },
      });

      // Act: Register handlers and trigger load
      registerModelsRouterHandlers(mockSocket, mockIo);
      await mockSocket.handlers["models:load"]({
        requestId: 999,
        modelName: "test-model.gguf",
      });

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: Verify success path was exercised
      expect(mockLoadModel).toHaveBeenCalledWith("test-model.gguf");

      // The success path should call io.emit with models:status
      const statusEmit = mockIo.emitCalls.find((call) => call.event === "models:status");
      expect(statusEmit).toBeDefined();
      expect(statusEmit.data.status).toBe("loaded");

      // The success path should call socket.emit with ok response
      const okEmit = mockSocket.emitCalls.find((call) => call.event === "models:load:result");
      expect(okEmit).toBeDefined();
      expect(okEmit.data.success).toBe(true);
    });
  });

  describe("models:unload success path - lines 45-46", () => {
    it("should emit models:status 'unloaded' and send ok response when unloadModel succeeds", async () => {
      // This test achieves coverage on lines 45-46: if (result.success) {...}
      // Arrange: Mock unloadModel to return success
      mockUnloadModel.mockResolvedValue({
        success: true,
        result: { status: "unloaded" },
      });

      // Act: Register handlers and trigger unload
      registerModelsRouterHandlers(mockSocket, mockIo);
      await mockSocket.handlers["models:unload"]({
        requestId: 888,
        modelName: "loaded-model.gguf",
      });

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: Verify success path was exercised
      expect(mockUnloadModel).toHaveBeenCalledWith("loaded-model.gguf");

      // The success path should call io.emit with models:status
      const statusEmit = mockIo.emitCalls.find((call) => call.event === "models:status");
      expect(statusEmit).toBeDefined();
      expect(statusEmit.data.status).toBe("unloaded");

      // The success path should call socket.emit with ok response
      const okEmit = mockSocket.emitCalls.find((call) => call.event === "models:unload:result");
      expect(okEmit).toBeDefined();
      expect(okEmit.data.success).toBe(true);
    });
  });

  /**
   * NEGATIVE TESTS - Failure paths (lines 26-27 and 48)
   */

  describe("models:load failure path - lines 26-27", () => {
    it("should emit models:status 'error' and send err response when loadModel fails", async () => {
      // This test achieves coverage on lines 26-27: result.success === false branch
      // Arrange: Mock loadModel to return failure
      mockLoadModel.mockResolvedValue({
        success: false,
        error: "Model not found",
      });

      // Act: Register handlers and trigger load
      registerModelsRouterHandlers(mockSocket, mockIo);
      await mockSocket.handlers["models:load"]({
        requestId: 777,
        modelName: "missing-model.gguf",
      });

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: Verify failure path was exercised
      expect(mockLoadModel).toHaveBeenCalledWith("missing-model.gguf");

      // The failure path should call io.emit with models:status containing error
      const statusEmit = mockIo.emitCalls.find((call) => call.event === "models:status");
      expect(statusEmit).toBeDefined();
      expect(statusEmit.data.status).toBe("error");
      expect(statusEmit.data.error).toBe("Model not found");

      // The failure path should call socket.emit with err response
      const errEmit = mockSocket.emitCalls.find((call) => call.event === "models:load:result");
      expect(errEmit).toBeDefined();
      expect(errEmit.data.success).toBe(false);
      expect(errEmit.data.error.message).toBe("Model not found");
    });
  });

  describe("models:unload failure path - line 48", () => {
    it("should send err response when unloadModel returns failure", async () => {
      // This test achieves coverage on line 48: result.success === false branch for unloadModel
      // Arrange: Mock unloadModel to return failure
      mockUnloadModel.mockResolvedValue({
        success: false,
        error: "Model not loaded",
      });

      // Act: Register handlers and trigger unload
      registerModelsRouterHandlers(mockSocket, mockIo);
      await mockSocket.handlers["models:unload"]({
        requestId: 666,
        modelName: "never-loaded-model.gguf",
      });

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: Verify failure path was exercised
      expect(mockUnloadModel).toHaveBeenCalledWith("never-loaded-model.gguf");

      // The failure path should call socket.emit with err response
      const errEmit = mockSocket.emitCalls.find((call) => call.event === "models:unload:result");
      expect(errEmit).toBeDefined();
      expect(errEmit.data.success).toBe(false);
      expect(errEmit.data.error.message).toBe("Model not loaded");
    });
  });

  /**
   * NEGATIVE TESTS - Exception paths (lines 31 and 52)
   */

  describe("models:load exception path - line 31", () => {
    it("should send err response when loadModel throws an exception", async () => {
      // This test achieves coverage on line 31: .catch() handler for loadModel
      // Arrange: Mock loadModel to throw
      mockLoadModel.mockRejectedValue(new Error("Connection refused"));

      // Act: Register handlers and trigger load (this will cause an exception)
      registerModelsRouterHandlers(mockSocket, mockIo);
      await mockSocket.handlers["models:load"]({
        requestId: 555,
        modelName: "error-model.gguf",
      });

      // Wait for the async operation to complete (including the catch handler)
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: Verify exception path was exercised
      expect(mockLoadModel).toHaveBeenCalledWith("error-model.gguf");

      // The exception path should call err() with the error message
      const errEmit = mockSocket.emitCalls.find((call) => call.event === "models:load:result");
      expect(errEmit).toBeDefined();
      expect(errEmit.data.success).toBe(false);
      expect(errEmit.data.error.message).toBe("Connection refused");
    });
  });

  describe("models:unload exception path - line 52", () => {
    it("should send err response when unloadModel throws an exception", async () => {
      // This test achieves coverage on line 52: .catch() handler for unloadModel
      // Arrange: Mock unloadModel to throw
      mockUnloadModel.mockRejectedValue(new Error("Server disconnected"));

      // Act: Register handlers and trigger unload (this will cause an exception)
      registerModelsRouterHandlers(mockSocket, mockIo);
      await mockSocket.handlers["models:unload"]({
        requestId: 444,
        modelName: "crash-model.gguf",
      });

      // Wait for the async operation to complete (including the catch handler)
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert: Verify exception path was exercised
      expect(mockUnloadModel).toHaveBeenCalledWith("crash-model.gguf");

      // The exception path should call err() with the error message
      const errEmit = mockSocket.emitCalls.find((call) => call.event === "models:unload:result");
      expect(errEmit).toBeDefined();
      expect(errEmit.data.success).toBe(false);
      expect(errEmit.data.error.message).toBe("Server disconnected");
    });
  });
});
