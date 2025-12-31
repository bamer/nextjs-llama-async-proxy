import { POST } from "../../app/api/models/[name]/start/route";
import { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

jest.mock("@/lib/logger", () => ({
  getLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

jest.mock("@/lib/server-config", () => ({
  loadAppConfig: jest.fn(() => ({ maxConcurrentModels: 1 })),
}));

jest.mock("@/lib/validation-utils", () => ({
  validateRequestBody: jest.fn(),
}));

describe("POST /api/models/:name/start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive test: Successfully start a model
  it("should start a model successfully", async () => {
    const mockLlamaService = {
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
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ model: "llama-2-7b" }),
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "llama-2-7b" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toMatchObject({
      model: "llama-2-7b",
      status: "loaded",
    });
  });

  // Positive test: Start model with template
  it("should start model with template", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          {
            id: "mistral-7b",
            name: "mistral-7b",
            available: true,
          },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ model: "mistral-7b" }),
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({ template: "chat-template" }),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({
      success: true,
      data: { model: "mistral-7b", template: "chat-template" },
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "mistral-7b" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe("mistral-7b");
  });

  // Negative test: Return 400 when model name is missing
  it("should return 400 when model name is missing", async () => {
    const response = await POST(
      {} as unknown as NextRequest,
      {
        params: Promise.resolve({ name: "" }),
      }
    );
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toMatchObject({
      error: "Model name is required",
    });
  });

  // Negative test: Return 400 when validation fails
  it("should return 400 when validation fails", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ invalid: "data" }),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({
      success: false,
      errors: ["Invalid request body"],
    });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toMatchObject({
      error: "Invalid request body",
      details: ["Invalid request body"],
    });
  });

  // Negative test: Return 503 when llamaService is not initialized
  it("should return 503 when llamaService is not initialized", async () => {
    const mockRegistry = {
      get: jest.fn().mockReturnValue(null),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Llama service not initialized",
    });
  });

  // Negative test: Return 503 when llama-server is not ready
  it("should return 503 when llama-server is not ready", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "loading",
        models: [],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Llama server is not ready (status: loading)",
    });
  });

  // Negative test: Return 409 when max concurrent models reached
  it("should return 409 when max concurrent models reached", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { name: "model1", status: "running" },
          { name: "model2", status: "loaded" },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const { loadAppConfig } = require("@/lib/server-config");
    loadAppConfig.mockReturnValue({ maxConcurrentModels: 1 });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(409);
    expect(_json).toMatchObject({
      error: expect.stringContaining("Maximum concurrent models"),
    });
  });

  // Negative test: Return 404 when model not found in discovered list
  it("should return 404 when model not found", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "model1", name: "model1" },
          { id: "model2", name: "model2" },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "unknown" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "unknown-model" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(404);
    expect(_json).toMatchObject({
      error: "Model not found",
      model: "unknown-model",
    });
  });

  // Negative test: Return 503 when llama-server connection fails
  it("should return 503 when llama-server connection fails", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "llama-2-7b", name: "llama-2-7b", available: true },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue(null);

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: expect.stringContaining("Failed to connect to llama-server"),
    });
  });

  // Negative test: Return error when llama-server returns non-OK
  it("should return error when llama-server returns non-OK status", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "llama-2-7b", name: "llama-2-7b", available: true },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: "Internal server error" }),
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json).toMatchObject({
      error: expect.stringContaining("Failed to load model"),
    });
  });

  // Edge case: Handle model found by id instead of name
  it("should find model by id when name doesn't match", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "llama-2-7b", name: "LLaMA-2-7B", available: true },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ model: "LLaMA-2-7B" }),
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "llama-2-7b" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "llama-2-7b" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle missing appConfig (use default maxConcurrentModels)
  it("should use default maxConcurrentModels when appConfig is missing", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "test-model", name: "test-model", available: true }
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const { loadAppConfig } = require("@/lib/server-config");
    loadAppConfig.mockReturnValue({});

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test-model" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle fetch throwing an error
  it("should handle fetch throwing an error", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [
          { id: "test-model", name: "test-model", available: true },
        ],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test-model" } });

    const response = await POST(mockRequest, {
      params: Promise.resolve({ name: "test-model" }),
    });
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json).toMatchObject({
      error: expect.stringContaining("Failed to load model"),
    });
  });

  // Edge case: Handle concurrent start requests
  it("should handle concurrent start requests", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [{ id: "test", name: "test", available: true }],
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const { validateRequestBody } = jest.mocked(require("@/lib/validation-utils"));
    validateRequestBody.mockReturnValue({ success: true, data: { model: "test" } });

    const [response1, response2] = await Promise.all([
      POST(mockRequest, { params: Promise.resolve({ name: "test" }) }),
      POST(mockRequest, { params: Promise.resolve({ name: "test" }) }),
    ]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });
});
