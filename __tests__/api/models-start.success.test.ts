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

describe("POST /api/models/[name]/start - Success Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should start a model successfully when llama-server is ready", async () => {
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
    const mockResponse = createMockResponse({
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe("llama-2-7b");
  });

  it("should use custom host and port from environment variables", async () => {
    process.env.LLAMA_SERVER_HOST = "custom-host";
    process.env.LLAMA_SERVER_PORT = "9999";

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

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("custom-host:9999"),
      expect.any(Object)
    );

    cleanupEnvVars("LLAMA_SERVER_HOST", "LLAMA_SERVER_PORT");
  });
});
