import { POST } from "../../app/api/models/[name]/start/route";
import { NextRequest } from "next/server";
import { loadAppConfig } from "@/lib/server-config";
import { validateRequestBody } from "@/lib/validation-utils";
import { startModelRequestSchema } from "@/lib/validators";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/server-config");
jest.mock("@/lib/validation-utils");

describe("POST /api/models/:name/start", () => {
  let mockLlamaService: jest.Mocked<{
    getState: () => {
      status: string;
      models?: Array<{ id?: string; name?: string; path?: string; available?: boolean; status?: string }>;
    };
    config?: { basePath?: string };
  }>;

  let mockRegistry: {
    get: (name: string) => typeof mockLlamaService | null;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          {
            id: "llama-2-7b",
            name: "llama-2-7b",
            available: true,
          },
        ],
      }),
      config: { basePath: "/models" },
    };
    mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };
    (global as unknown as { registry: unknown }).registry = mockRegistry;
    (loadAppConfig as jest.Mock).mockReturnValue({ maxConcurrentModels: 1 });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete (global as unknown as { registry?: unknown }).registry;
  });

  // Positive test: Successfully start model
  it("should start model successfully", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ template: "chatml" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b", template: "chatml" },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.status).toBe("loaded");
    expect(_json.message).toContain("llama-2-7b");
    expect(global.fetch).toHaveBeenCalled();
  });

  // Positive test: Start model without template
  it("should start model without template", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b" },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.status).toBe("loaded");
  });

  // Negative test: Return 400 when model name is missing
  it("should return 400 error when model name is missing", async () => {
    const mockRequest = {} as unknown as NextRequest;
    const mockParams = Promise.resolve({ name: "" });

    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Model name is required");
  });

  // Negative test: Return 400 when validation fails
  it("should return 400 error when validation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: false,
      errors: [{ path: ["model"], message: "Invalid model" }],
    });

    const mockParams = Promise.resolve({ name: "test-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json.error).toBe("Invalid request body");
    expect(_json.details).toBeDefined();
  });

  // Negative test: Return 503 when llamaService is not initialized
  it("should return 503 error when llamaService is not initialized", async () => {
    mockRegistry.get = jest.fn().mockReturnValue(null);
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b" },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json.error).toBe("Llama service not initialized");
  });

  // Negative test: Return 503 when server is not ready
  it("should return 503 error when server is not ready", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "loading",
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b" },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json.error).toContain("Llama server is not ready");
    expect(_json.status).toBe("error");
  });

  // Negative test: Return 409 when max concurrent models reached
  it("should return 409 error when max concurrent models reached", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "running-model", name: "running-model", status: "running" },
      ],
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "new-model" },
    });

    const mockParams = Promise.resolve({ name: "new-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(409);
    expect(_json.error).toContain("Maximum concurrent models");
    expect(_json.runningModels).toBe("running-model");
    expect(_json.maxConcurrent).toBe(1);
  });

  // Negative test: Return 404 when model not found
  it("should return 404 error when model not found", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "other-model", name: "other-model", available: true },
      ],
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "nonexistent-model" },
    });

    const mockParams = Promise.resolve({ name: "nonexistent-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(404);
    expect(_json.error).toBe("Model not found");
    expect(_json.status).toBe("not_found");
  });

  // Negative test: Return 503 when fetch fails to connect
  it("should return 503 error when fetch fails to connect", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Connection refused"));

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b" },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json.error).toContain("Failed to connect to llama-server");
  });

  // Negative test: Return error when llama-server returns error
  it("should return error when llama-server returns error", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: "Failed to load model" }),
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b" },
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.error).toBeDefined();
  });

  // Edge case: Handle model found by id
  it("should handle model found by id", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "model-123", name: "llama-2-7b", available: true },
      ],
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "model-123" },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const mockParams = Promise.resolve({ name: "model-123" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle model name with special characters
  it("should handle model name with special characters", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        {
          id: "llama-2-7b-日本語",
          name: "llama-2-7b-日本語",
          available: true,
        },
      ],
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b-日本語" },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b-日本語" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle maxConcurrentModels > 1
  it("should handle maxConcurrentModels > 1", async () => {
    (loadAppConfig as jest.Mock).mockReturnValue({
      maxConcurrentModels: 3,
    });

    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "model1", name: "model1", status: "running" },
        { id: "model2", name: "model2", status: "loaded" },
        { id: "model3", name: "model3", available: true },
      ],
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "model3" },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    const mockParams = Promise.resolve({ name: "model3" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle concurrent start requests
  it("should handle concurrent start requests", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "llama-2-7b" },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const responses = await Promise.all([
      POST(mockRequest, { params: mockParams }),
      POST(mockRequest, { params: mockParams }),
      POST(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle models array without models
  it("should handle empty models array", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [],
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "nonexistent-model" },
    });

    const mockParams = Promise.resolve({ name: "nonexistent-model" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(404);
    expect(_json.error).toBe("Model not found");
  });

  // Edge case: Handle models with 'loaded' status
  it("should treat 'loaded' status as running", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "model1", name: "model1", status: "loaded" },
      ],
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    (validateRequestBody as jest.Mock).mockReturnValue({
      success: true,
      data: { model: "model2" },
    });

    const mockParams = Promise.resolve({ name: "model2" });
    const response = await POST(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(409);
    expect(_json.error).toContain("Maximum concurrent models");
  });
});
