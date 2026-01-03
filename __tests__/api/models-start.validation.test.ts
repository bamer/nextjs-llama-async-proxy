jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

import { POST as StartModel } from "../../app/api/models/[name]/start/route";
import {
  createMockLlamaService,
  createMockModels,
  createMockParams,
  createMockRequest,
  createMockResponse,
  setupGlobalMocks,
} from "./models-start.helpers";

describe("POST /api/models/[name]/start - Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 400 error when model name is missing", async () => {
    const mockLlamaService = createMockLlamaService();
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toEqual({
      error: "Model name is required",
    });
  });

  it("should return 404 error when model is not found", async () => {
    const mockModels = createMockModels("mistral-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("nonexistent-model");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(404);
    expect(_json).toMatchObject({
      error: "Model not found",
      status: "not_found",
    });
  });

  it("should handle very long model names", async () => {
    const longModelName = "a".repeat(10000);
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: longModelName,
        available: true,
      },
    ];

    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams(longModelName);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle model names with special characters", async () => {
    const specialModelName = "llama-2-7b-special!@#$%^&*()";
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: specialModelName,
        available: true,
      },
    ];

    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams(specialModelName);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle model names with unicode characters", async () => {
    const unicodeModelName = "llama-2-7b-日本語-中文-العربية";
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: unicodeModelName,
        available: true,
      },
    ];

    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams(unicodeModelName);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle model name with path-like characters", async () => {
    const pathLikeModel = "../../etc/passwd";
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: pathLikeModel,
        available: true,
      },
    ];

    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams(pathLikeModel);

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });
});
