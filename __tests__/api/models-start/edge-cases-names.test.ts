/**
 * Edge cases for POST /api/models/[name]/start - Model Names
 * Tests special model name scenarios
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

describe("POST /api/models/[name]/start - Edge Cases: Model Names", () => {
  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    teardownAfterEach();
  });

  it("should handle very long model names", async () => {
    const longModelName = "a".repeat(10000);
    const mockResponse = createMockSuccessResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      name: longModelName,
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams(longModelName);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle model names with special characters", async () => {
    const specialModelName = "llama-2-7b-special!@#$%^&*()";
    const mockResponse = createMockSuccessResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      name: specialModelName,
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams(specialModelName);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle model names with unicode characters", async () => {
    const unicodeModelName = "llama-2-7b-日本語-中文-العربية";
    const mockResponse = createMockSuccessResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      name: unicodeModelName,
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams(unicodeModelName);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle model name with path-like characters", async () => {
    const pathLikeModel = "../../etc/passwd";
    const mockResponse = createMockSuccessResponse();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels({
      name: pathLikeModel,
      available: true,
    });

    setupTestEnvironment("ready", mockModels);

    const mockRequest = createMockRequest({});
    const mockParams = createMockParams(pathLikeModel);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });
});
