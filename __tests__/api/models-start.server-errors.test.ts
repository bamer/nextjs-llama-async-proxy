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

describe("POST /api/models/[name]/start - Server Errors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 503 error when llamaService is not initialized", async () => {
    const mockRegistry = {
      get: jest.fn().mockReturnValue(null),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = await createMockRequest();
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
    const mockLlamaService = createMockLlamaService({ status: "loading" });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Llama server is not ready (status: loading)",
      status: "error",
    });
  });

  it("should return 503 error when llama-server connection fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error("Connection refused")
    );

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
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
    const mockResponse = createMockResponse({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: "Model load failed",
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

    expect(response.status).toBe(400);
    expect(_json).toMatchObject({
      error: "Model load failed",
      status: "error",
    });
  });

  it("should handle llama-server returning 500 error", async () => {
    const mockResponse = createMockResponse({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({
        error: "Internal server error",
      }),
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(500);
  });

  it("should handle llama-server timeout", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10)
        )
    );

    const mockModels = createMockModels("llama-2-7b");
    const mockLlamaService = createMockLlamaService({ models: mockModels });
    setupGlobalMocks(mockLlamaService);

    const mockRequest = await createMockRequest();
    const mockParams = createMockParams("llama-2-7b");

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(503);
  });
});
