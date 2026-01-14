/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock the dependencies before importing the module under test
// This uses Jest's ESM mocking capabilities
jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/api.js",
  () => ({
    llamaApiRequest: jest.fn(),
  })
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js",
  () => ({
    getRouterState: jest.fn(),
    getServerProcess: jest.fn(),
    getServerUrl: jest.fn(),
  })
);

jest.unstable_mockModule(
  "/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/process.js",
  () => ({
    isPortInUse: jest.fn(),
  })
);

describe("Llama Router Status Functions", () => {
  let getLlamaStatus, loadModel, unloadModel;
  let mockLlamaApiRequest;
  let mockGetRouterState, mockGetServerProcess, mockGetServerUrl;
  let mockIsPortInUse;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Suppress console logs during tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Import after mocking
    const { llamaApiRequest } =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/api.js");
    const { getRouterState, getServerProcess, getServerUrl } =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/start.js");
    const { isPortInUse } =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/process.js");
    const statusModule =
      await import("/home/bamer/nextjs-llama-async-proxy/server/handlers/llama-router/status.js");

    getLlamaStatus = statusModule.getLlamaStatus;
    loadModel = statusModule.loadModel;
    unloadModel = statusModule.unloadModel;

    // Store mock functions for test setup
    mockLlamaApiRequest = llamaApiRequest;
    mockGetRouterState = getRouterState;
    mockGetServerProcess = getServerProcess;
    mockGetServerUrl = getServerUrl;
    mockIsPortInUse = isPortInUse;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getLlamaStatus", () => {
    // Positive test: router is running and port is in use
    it("should return running status when router process is running", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: null, pid: 12345 });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue({
        models: [{ name: "model1.gguf", status: "loaded" }],
      });

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result).toEqual({
        status: "running",
        port: 8080,
        url: "http://127.0.0.1:8080",
        processRunning: true,
        mode: "router",
        models: [{ name: "model1.gguf", status: "loaded" }],
      });
    });

    // Positive test: port is in use but process is null (crashed)
    it("should return running status when port is in use but process is null", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: false, port: 8080 });
      mockGetServerProcess.mockReturnValue(null);
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue({
        models: [{ name: "model1.gguf" }],
      });

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.status).toBe("running");
      expect(result.port).toBe(8080);
      expect(result.url).toBe("http://127.0.0.1:8080");
      expect(result.processRunning).toBe(false);
      expect(result.mode).toBe("router");
    });

    // Positive test: empty models array
    it("should return empty models array when no models loaded", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: null });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue({ models: [] });

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.models).toEqual([]);
      expect(Array.isArray(result.models)).toBe(true);
    });

    // Negative test: router not running and port not in use
    it("should return idle status when router is not running and port is free", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: false, port: 8080 });
      mockGetServerProcess.mockReturnValue(null);
      mockGetServerUrl.mockReturnValue(null);
      mockIsPortInUse.mockReturnValue(false);

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.status).toBe("idle");
      expect(result.port).toBeNull();
      expect(result.url).toBeNull();
      expect(result.processRunning).toBe(false);
      expect(result.models).toEqual([]);
    });

    // Negative test: API request fails but still returns running status
    it("should return running status even when models API request fails", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: null });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockRejectedValue(new Error("Connection refused"));

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.status).toBe("running");
      expect(result.port).toBe(8080);
      expect(result.url).toBe("http://127.0.0.1:8080");
      expect(result.processRunning).toBe(true);
      expect(result.models).toEqual([]);
    });

    // Edge case: different port numbers
    it("should handle different port numbers correctly", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 9090 });
      mockGetServerProcess.mockReturnValue({ exitCode: null });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:9090");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue({ models: [] });

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.port).toBe(9090);
      expect(result.url).toBe("http://127.0.0.1:9090");
    });

    // Edge case: process has exit code (crashed)
    it("should handle crashed process with port in use", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: false, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: 1, pid: 12345 });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue({ models: [] });

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.status).toBe("running");
      expect(result.processRunning).toBe(false);
    });
  });

  describe("loadModel", () => {
    // Positive test: successful model loading
    it("should return success when model loads successfully", async () => {
      // Arrange
      const mockResult = { success: true, message: "Model loaded" };
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest.mockResolvedValue(mockResult);

      // Act
      const result = await loadModel("test-model.gguf");

      // Assert
      expect(result).toEqual({ success: true, result: mockResult });
    });

    // Negative test: server not running
    it("should return error when llama-server is not running", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue(null);
      mockIsPortInUse.mockReturnValue(false);
      mockGetRouterState.mockReturnValue({ port: null, isRunning: false });

      // Act
      const result = await loadModel("test-model.gguf");

      // Assert
      expect(result).toEqual({ success: false, error: "llama-server not running" });
    });

    // Negative test: API request fails
    it("should return error when API request fails", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest.mockRejectedValue(new Error("Model not found"));

      // Act
      const result = await loadModel("test-model.gguf");

      // Assert
      expect(result).toEqual({ success: false, error: "Model not found" });
    });

    // Positive test: different model names
    it("should correctly pass different model names to API", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest.mockResolvedValue({ success: true });

      // Act
      const result = await loadModel("llama-2-7b.Q4_0.gguf");

      // Assert
      expect(result.success).toBe(true);
      expect(mockLlamaApiRequest).toHaveBeenCalledWith(
        "/models/load",
        "POST",
        { model: "llama-2-7b.Q4_0.gguf" },
        "http://127.0.0.1:8080"
      );
    });
  });

  describe("unloadModel", () => {
    // Positive test: successful model unloading
    it("should return success when model unloads successfully", async () => {
      // Arrange
      const mockResult = { success: true, message: "Model unloaded" };
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest.mockResolvedValue(mockResult);

      // Act
      const result = await unloadModel("test-model.gguf");

      // Assert
      expect(result).toEqual({ success: true, result: mockResult });
    });

    // Negative test: server not running
    it("should return error when llama-server is not running", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue(null);
      mockIsPortInUse.mockReturnValue(false);
      mockGetRouterState.mockReturnValue({ port: null, isRunning: false });

      // Act
      const result = await unloadModel("test-model.gguf");

      // Assert
      expect(result).toEqual({ success: false, error: "llama-server not running" });
    });

    // Negative test: API request fails
    it("should return error when API request fails", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest.mockRejectedValue(new Error("Model not loaded"));

      // Act
      const result = await unloadModel("test-model.gguf");

      // Assert
      expect(result).toEqual({ success: false, error: "Model not loaded" });
    });

    // Positive test: different model names
    it("should correctly pass different model names to unload API", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest.mockResolvedValue({ success: true });

      // Act
      const result = await unloadModel("mistral-7b.Q4_0.gguf");

      // Assert
      expect(result.success).toBe(true);
      expect(mockLlamaApiRequest).toHaveBeenCalledWith(
        "/models/unload",
        "POST",
        { model: "mistral-7b.Q4_0.gguf" },
        "http://127.0.0.1:8080"
      );
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete router running scenario with multiple models", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: null, pid: 12345 });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue({
        models: [
          { name: "model1.gguf", status: "loaded" },
          { name: "model2.gguf", status: "loaded" },
          { name: "model3.gguf", status: "unloaded" },
        ],
      });

      // Act
      const status = await getLlamaStatus();

      // Assert
      expect(status.status).toBe("running");
      expect(status.models.length).toBe(3);
      expect(status.processRunning).toBe(true);
    });

    it("should handle complete router stopped scenario", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: false, port: 8080 });
      mockGetServerProcess.mockReturnValue(null);
      mockGetServerUrl.mockReturnValue(null);
      mockIsPortInUse.mockReturnValue(false);

      // Act
      const status = await getLlamaStatus();

      // Assert
      expect(status.status).toBe("idle");
      expect(status.port).toBeNull();
      expect(status.url).toBeNull();
      expect(status.processRunning).toBe(false);
      expect(status.models).toEqual([]);
    });

    it("should handle crashed process scenario", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: false, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: 137, pid: 12345 });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(false);

      // Act
      const status = await getLlamaStatus();

      // Assert
      expect(status.status).toBe("idle");
      expect(status.port).toBeNull();
      expect(status.url).toBeNull();
      expect(status.processRunning).toBe(false);
    });

    it("should load and unload models in sequence", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest
        .mockResolvedValueOnce({ success: true, message: "Model loaded" })
        .mockResolvedValueOnce({ success: true, message: "Model unloaded" });

      // Act
      const loadResult = await loadModel("shared-model.gguf");
      const unloadResult = await unloadModel("shared-model.gguf");

      // Assert
      expect(loadResult.success).toBe(true);
      expect(unloadResult.success).toBe(true);
      expect(mockLlamaApiRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error handling edge cases", () => {
    it("should handle API error with empty error message", async () => {
      // Arrange
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockLlamaApiRequest.mockRejectedValue(new Error(""));

      // Act
      const loadResult = await loadModel("test-model");
      const unloadResult = await unloadModel("test-model");

      // Assert
      expect(loadResult.success).toBe(false);
      expect(loadResult.error).toBe("");
      expect(unloadResult.success).toBe(false);
      expect(unloadResult.error).toBe("");
    });

    it("should handle models API returning null models property", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: null });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue(null);

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.models).toEqual([]);
    });

    it("should handle models API returning undefined", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: null });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue(undefined);

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.models).toEqual([]);
    });

    it("should handle models API returning object without models property", async () => {
      // Arrange
      mockGetRouterState.mockReturnValue({ isRunning: true, port: 8080 });
      mockGetServerProcess.mockReturnValue({ exitCode: null });
      mockGetServerUrl.mockReturnValue("http://127.0.0.1:8080");
      mockIsPortInUse.mockReturnValue(true);
      mockLlamaApiRequest.mockResolvedValue({ error: "some error" });

      // Act
      const result = await getLlamaStatus();

      // Assert
      expect(result.models).toEqual([]);
    });
  });
});
