import { GET } from "../../../../app/api/monitoring/latest/route";
import { getLogger } from "@/lib/logger";

jest.mock("@/lib/logger");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

(getLogger as jest.Mock).mockReturnValue(mockLogger);

describe("GET /api/monitoring/latest", () => {
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

  it("should return latest monitoring data successfully with models", async () => {
    const mockState = {
      models: [
        { status: "running", size: 1024 * 1024 * 1024 }, // 1GB
        { status: "idle", size: 2048 * 1024 * 1024 }, // 2GB
      ],
    };

    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockReturnValue(mockState);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.system).toBeDefined();
    expect(json.data.models).toHaveLength(2);
    expect(json.data.models[0]).toEqual({
      status: "running",
      memory: 1024, // 1GB in MB
      requests: expect.any(Number),
    });
    expect(json.data.models[1]).toEqual({
      status: "idle",
      memory: 2048, // 2GB in MB
      requests: expect.any(Number),
    });
    expect(json.timestamp).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalledWith("[API] Fetching latest monitoring data");
    expect(mockLogger.info).toHaveBeenCalledWith("[API] Monitoring data fetched successfully");
  });

  it("should return monitoring data without llama service", async () => {
    mockRegistry.get.mockReturnValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.system).toBeDefined();
    expect(json.data.models).toEqual([]);
  });

  it("should handle llama service errors gracefully", async () => {
    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockImplementation(() => {
      throw new Error("Service unavailable");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.models).toEqual([]);
    expect(mockLogger.warn).toHaveBeenCalledWith("[API] Failed to get models from llama service:", expect.any(Error));
  });

  it("should handle models with missing size property", async () => {
    const mockState = {
      models: [
        { status: "running" }, // no size property
        { status: "idle", size: 1024 * 1024 * 1024 }, // 1GB
      ],
    };

    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockReturnValue(mockState);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.models[0].memory).toBe(0);
    expect(json.data.models[1].memory).toBe(1024);
  });

  it("should handle models with zero size", async () => {
    const mockState = {
      models: [
        { status: "running", size: 0 },
      ],
    };

    mockRegistry.get.mockReturnValue(mockLlamaService);
    mockLlamaService.getState.mockReturnValue(mockState);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.models[0].memory).toBe(0);
  });

  it("should generate valid system metrics ranges", async () => {
    mockRegistry.get.mockReturnValue(null);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.system.cpu.usage).toBeGreaterThanOrEqual(20);
    expect(json.data.system.cpu.usage).toBeLessThanOrEqual(60);
    expect(json.data.system.memory.used).toBeGreaterThanOrEqual(40);
    expect(json.data.system.memory.used).toBeLessThanOrEqual(70);
    expect(json.data.system.disk.used).toBeGreaterThanOrEqual(50);
    expect(json.data.system.disk.used).toBeLessThanOrEqual(70);
    expect(json.data.system.uptime).toBeGreaterThanOrEqual(3600);
    expect(json.data.system.uptime).toBeLessThanOrEqual(90000);
    expect(json.data.system.network.rx).toBeGreaterThanOrEqual(1000);
    expect(json.data.system.network.tx).toBeGreaterThanOrEqual(500);
  });

  it("should include timestamp in response", async () => {
    mockRegistry.get.mockReturnValue(null);

    const response = await GET();
    const json = await response.json();

    expect(json.timestamp).toBeDefined();
    expect(typeof json.timestamp).toBe("string");
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("should handle unexpected errors", async () => {
    // Simulate an error in the monitoring data generation
    const originalRandom = Math.random;
    Math.random = jest.fn(() => {
      throw new Error("Random generation failed");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("MONITORING_FETCH_ERROR");
    expect(json.error.message).toBe("Failed to fetch monitoring data");
    expect(json.error.details).toBe("Random generation failed");
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Error fetching monitoring data:", expect.any(Error));

    Math.random = originalRandom;
  });

  it("should handle non-Error exceptions", async () => {
    const originalRandom = Math.random;
    Math.random = jest.fn(() => {
      throw "String error";
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error.details).toBe("String error");

    Math.random = originalRandom;
  });
});