import { GET } from "../../app/api/models/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

describe("GET /api/models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Positive test: Successfully retrieve models list
  it("should return models list when llamaService is initialized", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "llama-2-7b",
        type: "llama",
        size: 4096000000,
        modified_at: 1703568000,
      },
      {
        id: "model-2",
        name: "mistral-7b",
        type: "mistral",
        size: 4100000000,
        modified_at: 1703568100,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty("models");
    expect(json.models).toHaveLength(2);
    expect(json.models[0]).toMatchObject({
      id: "model-1",
      name: "llama-2-7b",
      type: "llama",
      available: true,
      size: 4096000000,
    });
    expect(json.models[0].createdAt).toBeDefined();
    expect(json.models[0].updatedAt).toBeDefined();
    expect(mockRegistry.get).toHaveBeenCalledWith("llamaService");
  });

  // Negative test: Return error when llamaService is not initialized
  it("should return 503 error when llamaService is not initialized", async () => {
    const mockRegistry = {
      get: jest.fn().mockReturnValue(null),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "Llama service not initialized",
      models: [],
    });
    expect(mockRegistry.get).toHaveBeenCalledWith("llamaService");
  });

  // Negative test: Return error when registry is not available
  it("should return 503 error when registry is not available", async () => {
    (global as unknown as { registry: unknown }).registry = undefined;

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "Llama service not initialized",
      models: [],
    });
  });

  // Positive test: Handle models without id field (use name as id)
  it("should handle models without id field", async () => {
    const mockModels = [
      {
        name: "llama-2-7b",
        type: "unknown",
        size: 4096000000,
        modified_at: 1703568000,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].id).toBe("llama-2-7b");
    expect(json.models[0].type).toBe("unknown");
  });

  // Positive test: Handle models without modified_at field
  it("should handle models without modified_at field", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "llama-2-7b",
        type: "llama",
        size: 4096000000,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].createdAt).toBeDefined();
    expect(json.models[0].updatedAt).toBeDefined();
  });

  // Negative test: Handle unexpected error in llamaService.getState
  it("should return 500 error when llamaService.getState throws", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockImplementation(() => {
        throw new Error("Service error");
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({
      error: "Failed to fetch models",
      models: [],
    });
  });

  // Positive test: Handle empty models list
  it("should return empty array when no models are available", async () => {
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models).toEqual([]);
  });

  // Edge case: Handle models with extremely large size values
  it("should handle models with extremely large size values", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "huge-model",
        type: "llama",
        size: Number.MAX_SAFE_INTEGER,
        modified_at: 1703568000,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].size).toBe(Number.MAX_SAFE_INTEGER);
  });

  // Edge case: Handle models with negative timestamp
  it("should handle models with negative timestamp", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "old-model",
        type: "llama",
        size: 4096000000,
        modified_at: -1000000000,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].createdAt).toBeDefined();
  });

  // Edge case: Handle models with unicode characters in name
  it("should handle models with unicode characters in name", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "llama-2-7b-日本語-中文-العربية",
        type: "llama",
        size: 4096000000,
        modified_at: 1703568000,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].name).toBe("llama-2-7b-日本語-中文-العربية");
  });

  // Edge case: Handle models with null/undefined fields
  it("should handle models with null/undefined fields", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "test-model",
        type: null,
        size: null,
        modified_at: null,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].type).toBe("unknown");
  });

  // Edge case: Handle models with extremely long names
  it("should handle models with extremely long names", async () => {
    const longName = "a".repeat(10000);
    const mockModels = [
      {
        id: "model-1",
        name: longName,
        type: "llama",
        size: 4096000000,
        modified_at: 1703568000,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].name).toBe(longName);
  });

  // Edge case: Handle very large number of models
  it("should handle very large number of models", async () => {
    const mockModels = Array.from({ length: 1000 }, (_, i) => ({
      id: `model-${i}`,
      name: `model-${i}`,
      type: "llama",
      size: 4096000000,
      modified_at: 1703568000 + i,
    }));

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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models).toHaveLength(1000);
  });

  // Edge case: Handle malformed model data
  it("should handle malformed model data gracefully", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: null as unknown as string,
        type: "llama",
        size: "invalid" as unknown as number,
        modified_at: "invalid" as unknown as number,
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

    const response = await GET();

    // Should return 500 due to error in processing
    expect(response.status).toBe(500);
  });

  // Edge case: Handle concurrent requests
  it("should handle concurrent GET requests", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "llama-2-7b",
        type: "llama",
        size: 4096000000,
        modified_at: 1703568000,
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

    const responses = await Promise.all([GET(), GET(), GET()]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle models with future timestamps
  it("should handle models with future timestamps", async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 100000;
    const mockModels = [
      {
        id: "model-1",
        name: "future-model",
        type: "llama",
        size: 4096000000,
        modified_at: futureTimestamp,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].createdAt).toBeDefined();
  });

  // Edge case: Handle models with zero size
  it("should handle models with zero size", async () => {
    const mockModels = [
      {
        id: "model-1",
        name: "empty-model",
        type: "llama",
        size: 0,
        modified_at: 1703568000,
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

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].size).toBe(0);
  });

  // Edge case: Handle registry returning undefined service
  it("should handle registry returning undefined service", async () => {
    const mockRegistry = {
      get: jest.fn().mockReturnValue(undefined),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json).toEqual({
      error: "Llama service not initialized",
      models: [],
    });
  });

  // Edge case: Handle models array with non-object items
  it("should handle models array with invalid items", async () => {
    const mockModels = ["not-an-object", null, undefined];

    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: mockModels as unknown as Array<{ name: string }>,
      }),
    };

    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const response = await GET();
    const json = await response.json();

    // Should return 500 due to error in processing invalid model data
    expect(response.status).toBe(500);
    expect(json).toMatchObject({
      error: "Failed to fetch models",
      models: [],
    });
  });
});
