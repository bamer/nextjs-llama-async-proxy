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
});
