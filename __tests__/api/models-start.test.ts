import { POST as StartModel } from "../../app/api/models/[name]/start/route";
import { NextRequest } from "next/server";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

describe.skip("POST /api/models/[name]/start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Positive test: Successfully start a model
  it("should start a model successfully when llama-server is ready", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

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

  // Negative test: Return 400 when model name is missing
  it("should return 400 error when model name is missing", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
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

    const mockParams = Promise.resolve({ name: "" });

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toEqual({
      error: "Model name is required",
    });
  });

  // Negative test: Return 503 when llamaService is not initialized
  it("should return 503 error when llamaService is not initialized", async () => {
    const mockRegistry = {
      get: jest.fn().mockReturnValue(null),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Llama service not initialized",
      status: "error",
    });
  });

  // Negative test: Return 503 when llama-server is not ready
  it("should return 503 error when llama-server is not ready", async () => {
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

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Llama server is not ready (status: loading)",
      status: "error",
    });
  });

  // Negative test: Return 404 when model is not found
  it("should return 404 error when model is not found", async () => {
    const mockModels = [
      {
        id: "mistral-7b",
        name: "mistral-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "nonexistent-model" });

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(404);
    expect(_json).toMatchObject({
      error: "Model not found",
      status: "not_found",
    });
  });

  // Negative test: Return 503 when llama-server connection fails
  it("should return 503 error when llama-server connection fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error("Connection refused")
    );

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(503);
    expect(_json).toMatchObject({
      error: "Failed to connect to llama-server. Make sure it's running on the configured host and port.",
      status: "error",
    });
  });

  // Negative test: Return error when llama-server returns non-OK status
  it("should return error when llama-server returns non-OK status", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: "Model load failed",
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(400);
    expect(_json).toMatchObject({
      error: "Model load failed",
      status: "error",
    });
  });

  // Positive test: Handle model name without id field
  it("should handle model name without id field", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.model).toBe("llama-2-7b");
  });

  // Positive test: Use custom host and port from environment
  it("should use custom host and port from environment variables", async () => {
    process.env.LLAMA_SERVER_HOST = "custom-host";
    process.env.LLAMA_SERVER_PORT = "9999";

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("custom-host:9999"),
      expect.any(Object)
    );

    delete process.env.LLAMA_SERVER_HOST;
    delete process.env.LLAMA_SERVER_PORT;
  });

  // Edge case: Handle very long model names
  it("should handle very long model names", async () => {
    const longModelName = "a".repeat(10000);
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: longModelName,
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: longModelName });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle model names with special characters
  it("should handle model names with special characters", async () => {
    const specialModelName = "llama-2-7b-special!@#$%^&*()";
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: specialModelName,
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: specialModelName });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle model names with unicode characters
  it("should handle model names with unicode characters", async () => {
    const unicodeModelName = "llama-2-7b-日本語-中文-العربية";
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: unicodeModelName,
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: unicodeModelName });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle concurrent requests to start same model
  it("should handle concurrent requests to start same model", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const responses = await Promise.all([
      StartModel(mockRequest, { params: mockParams }),
      StartModel(mockRequest, { params: mockParams }),
      StartModel(mockRequest, { params: mockParams }),
    ]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle request body with large payload
  it("should handle request body with large payload", async () => {
    const largePayload = {
      ...Array.from({ length: 100 }, (_, i) => ({
        [`key_${i}`]: "x".repeat(100),
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    };

    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue(largePayload),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle llama-server returning empty response
  it("should handle llama-server returning empty response", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle invalid llama-server port in environment
  it("should handle invalid port in environment variables", async () => {
    process.env.LLAMA_SERVER_PORT = "invalid";

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    // Should handle connection error gracefully
    expect([500, 503]).toContain(response.status);

    delete process.env.LLAMA_SERVER_PORT;
  });

  // Edge case: Handle llama-server returning 500 error
  it("should handle llama-server returning 500 error", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({
        error: "Internal server error",
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(500);
  });

  // Edge case: Handle request body that fails to parse
  it("should handle request body that fails to parse", async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as NextRequest;

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    // Mock fetch for llama-server call
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    // Should handle gracefully with empty body
    expect(response.status).toBe(200);
  });

  // Edge case: Handle model name with path traversal characters
  it("should handle model name with path-like characters", async () => {
    const pathLikeModel = "../../etc/passwd";
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: "Hi" } }],
      }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        name: pathLikeModel,
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: pathLikeModel });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle llama-server response parsing failure
  it("should handle llama-server response parsing failure", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockRejectedValue(new Error("Parse error")),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(200);
  });

  // Edge case: Handle llama-server timeout
  it("should handle llama-server timeout", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 10)
        )
    );

    const mockModels = [
      {
        id: "llama-2-7b",
        name: "llama-2-7b",
        available: true,
      },
    ];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const mockRequest = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;

    const mockParams = Promise.resolve({ name: "llama-2-7b" });

    const response = await StartModel(mockRequest, { params: mockParams });

    expect(response.status).toBe(503);
  });
});
