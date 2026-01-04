/**
 * Edge cases for POST /api/models/[name]/start - Response Handling
 * Tests response handling and server errors
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

describe("POST /api/models/[name]/start - Edge Cases: Response Handling", () => {
  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    teardownAfterEach();
  });

  it("should handle llama-server returning empty response", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
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

    expect(response.status).toBe(200);
  });

  it("should handle llama-server response parsing failure", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockRejectedValue(new Error("Parse error")),
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

    expect(response.status).toBe(200);
  });

  it("should handle llama-server timeout", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10)
        )
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

    expect(response.status).toBe(503);
  });
});
