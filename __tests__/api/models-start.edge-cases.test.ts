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
  cleanupEnvVars,
} from "./models-start.helpers";

describe("POST /api/models/[name]/start - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle concurrent requests to start same model", async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
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

    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest(largePayload);
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle llama-server returning empty response", async () => {
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({}),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  it("should handle invalid port in environment variables", async () => {
    process.env.LLAMA_SERVER_PORT = "invalid";

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect([500, 503]).toContain(response.status);

    cleanupEnvVars("LLAMA_SERVER_PORT");
  });
});
