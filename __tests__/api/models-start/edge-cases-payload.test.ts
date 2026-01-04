/**
 * Edge cases for POST /api/models/[name]/start - Payload Handling
 * Tests request payload and environment scenarios
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

describe("POST /api/models/[name]/start - Edge Cases: Payload Handling", () => {
  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    teardownAfterEach();
  });

  it("should handle concurrent requests to start same model", async () => {
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

    const responses = await Promise.all([
      StartModel(mockRequest, { params: mockParams }),
      StartModel(mockRequest, { params: mockParams }),
      StartModel(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it("should handle request body with large payload", async () => {
    const largePayload = {
      ...Array.from({ length: 100 }, (_, i) => ({
        [`key_${i}`]: "x".repeat(100),
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    const mockResponse = createMockSuccessResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      id: "llama-2-7b",
      name: "llama-2-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest(largePayload);
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle invalid port in environment variables", async () => {
    process.env.LLAMA_SERVER_PORT = "invalid";

    const mockModels = createMockModels({
      id: "llama-2-7b",
      name: "llama-2-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    // Should handle connection error gracefully
    expect([500, 503]).toContain(response.status);

    delete process.env.LLAMA_SERVER_PORT;
  });

  it("should handle request body that fails to parse", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Parameters<typeof StartModel>[0];

    const mockModels = createMockModels({
      id: "llama-2-7b",
      name: "llama-2-7b",
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    // Mock fetch for llama-server call
    const mockResponse = createMockSuccessResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    // Should handle gracefully with empty body
    expect(response.status).toBe(200);
  });
});
