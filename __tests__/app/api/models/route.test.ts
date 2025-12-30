import { GET } from "../../../../app/api/models/route";
import { getLogger } from "@/lib/logger";

jest.mock("@/lib/logger");

const mockLogger = {
  error: jest.fn(),
};

(getLogger as jest.Mock).mockReturnValue(mockLogger);

describe("GET /api/models", () => {
  let mockLlamaService: {
    getState: jest.Mock;
  };

  let mockRegistry: {
    get: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLlamaService = {
      getState: jest.fn(),
    };

    mockRegistry = {
      get: jest.fn(),
    };

    (global as any).registry = mockRegistry;
  });

  afterEach(() => {
    delete (global as any).registry;
  });

  it("should return models list successfully", async () => {
    const mockState = {
      models: [
        {
          id: "llama-7b",
          name: "llama-7b.gguf",
          type: "gguf",
          size: 1024 * 1024 * 1024, // 1GB
          modified_at: 1704067200, // 2024-01-01
        },
        {
          name: "llama-13b.gguf",
          size: 2048 * 1024 * 1024, // 2GB
          modified_at: 1704153600, // 2024-01-02
        },
      ],
    };

    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockReturnValue(mockState);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models).toHaveLength(2);
    expect(json.models[0]).toEqual({
      id: "llama-7b",
      name: "llama-7b.gguf",
      type: "gguf",
      available: true,
      size: 1073741824,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(json.models[1]).toEqual({
      id: "llama-13b.gguf",
      name: "llama-13b.gguf",
      type: "unknown",
      available: true,
      size: 2147483648,
      createdAt: "2024-01-02T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    });
  });

  it("should return 503 when llama service is not initialized", async () => {
    mockRegistry.get.mockReturnValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toBe("Llama service not initialized");
    expect(json.models).toEqual([]);
  });

  it("should handle empty models list", async () => {
    const mockState = {
      models: [],
    };

    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockReturnValue(mockState);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models).toEqual([]);
  });

  it("should handle models without id property", async () => {
    const mockState = {
      models: [
        {
          name: "model-without-id.gguf",
          type: "gguf",
          size: 512 * 1024 * 1024,
        },
      ],
    };

    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockReturnValue(mockState);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.models[0].id).toBe("model-without-id.gguf");
  });

  it("should handle service errors gracefully", async () => {
    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockImplementation(() => {
      throw new Error("Service unavailable");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to fetch models");
    expect(json.models).toEqual([]);
    expect(mockLogger.error).toHaveBeenCalledWith("Error fetching models:", expect.any(Error));
  });
});