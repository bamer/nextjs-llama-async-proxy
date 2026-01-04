/**
 * Error handling scenarios for POST /api/models/[name]/start
 * Tests various error conditions and their proper responses
 */

import {
  setupTestEnvironment,
  createMockModels,
  createMockRequest,
  createMockParams,
  setupBeforeEach,
  teardownAfterEach,
  StartModel,
} from "./test-utils";

describe("POST /api/models/[name]/start - Error Handling", () => {
  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    teardownAfterEach();
  });

  it("should return 400 error when model name is missing", async () => {
    setupTestEnvironment("ready", []);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toEqual({
      error: "Model name is required",
    });
  });

  it("should return 503 error when llamaService is not initialized", async () => {
    const mockRegistry = {
      get: jest.fn().mockReturnValue(null),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Llama service not initialized",
      status: "error",
    });
  });

  it("should return 503 error when llama-server is not ready", async () => {
    setupTestEnvironment("loading", []);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Llama server is not ready (status: loading)",
      status: "error",
    });
  });

  it("should return 404 error when model is not found", async () => {
    const mockModels = createMockModels({
      id: "mistral-7b",
      name: "mistral-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("nonexistent-model");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(404);
    expect(_json).toMatchObject({
      error: "Model not found",
      status: "not_found",
    });
  });

  it("should return 503 error when llama-server connection fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error("Connection refused")
    );

    const mockModels = createMockModels({
      id: "llama-2-7b",
      name: "llama-2-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Failed to connect to llama-server. Make sure it's running on the configured host and port.",
      status: "error",
    });
  });

  it("should return error when llama-server returns non-OK status", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: "Model load failed",
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      id: "llama-2-7b",
      name: "llama-2-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toMatchObject({
      error: "Model load failed",
      status: "error",
    });
  });

  it("should handle llama-server returning 500 error", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({
        error: "Internal server error",
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      id: "llama-2-7b",
      name: "llama-2-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(500);
  });
});
