/**
 * Success scenarios for POST /api/models/[name]/start
 * Tests successful model loading and configuration
 */

import {
  setupTestEnvironment,
  createMockSuccessResponse,
  createMockModels,
  createMockRequest,
  createMockParams,
  setupBeforeEach,
  teardownAfterEach,
  StartModel,
} from "./test-utils";

describe("POST /api/models/[name]/start - Success Scenarios", () => {
  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    teardownAfterEach();
  });

  it("should start a model successfully when llama-server is ready", async () => {
    const mockResponse = createMockSuccessResponse();
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

    expect(response.status).toBe(200);
    expect(_json).toMatchObject({
      model: "llama-2-7b",
      status: "loaded",
      message: "Model llama-2-7b loaded successfully",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/chat/completions"),
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("should handle model name without id field", async () => {
    const mockResponse = createMockSuccessResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      name: "llama-2-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe("llama-2-7b");
  });

  it("should use custom host and port from environment variables", async () => {
    process.env.LLAMA_SERVER_HOST = "custom-host";
    process.env.LLAMA_SERVER_PORT = "9999";

    const mockResponse = createMockSuccessResponse();
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

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("custom-host:9999"),
      expect.any(Object)
    );

    delete process.env.LLAMA_SERVER_HOST;
    delete process.env.LLAMA_SERVER_PORT;
  });
});
