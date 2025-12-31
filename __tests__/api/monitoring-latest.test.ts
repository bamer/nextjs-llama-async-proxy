import { GET } from "../../app/api/monitoring/latest/route";

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
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("GET /api/monitoring/latest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return monitoring data with system metrics", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data).toHaveProperty("system");
    expect(_json.data).toHaveProperty("models");
    expect(_json.data.system).toHaveProperty("cpu");
    expect(_json.data.system).toHaveProperty("memory");
    expect(_json.data.system).toHaveProperty("disk");
    expect(_json.data.system).toHaveProperty("network");
    expect(_json.data.system).toHaveProperty("uptime");
    expect(_json.timestamp).toBeDefined();
  });

  it("should include system metrics within expected ranges", async () => {
    const response = await GET();
    const _json = await response.json();

    const system = _json.data.system;

    expect(system.cpu.usage).toBeGreaterThanOrEqual(20);
    expect(system.cpu.usage).toBeLessThanOrEqual(60);
    expect(system.memory.used).toBeGreaterThanOrEqual(40);
    expect(system.memory.used).toBeLessThanOrEqual(70);
    expect(system.disk.used).toBeGreaterThanOrEqual(50);
    expect(system.disk.used).toBeLessThanOrEqual(70);
    expect(system.network.rx).toBeGreaterThanOrEqual(1000);
    expect(system.network.rx).toBeLessThanOrEqual(11000);
    expect(system.network.tx).toBeGreaterThanOrEqual(500);
    expect(system.network.tx).toBeLessThanOrEqual(5500);
    expect(system.uptime).toBeGreaterThanOrEqual(3600);
    expect(system.uptime).toBeLessThanOrEqual(90000);
  });

  it("should return empty models array when llama service is not available", async () => {
    // Mock registry without llamaService
    const globalAny = global as unknown as { registry: any };
    globalAny.registry = {
      get: jest.fn().mockReturnValue(null),
    };

    const response = await GET();
    const _json = await response.json();

    expect(_json.data.models).toEqual([]);
  });

  it("should return models data when llama service is available", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        models: [
          {
            status: "running",
            size: 4096000000, // 4GB
          },
          {
            status: "idle",
            size: 2048000000, // 2GB
          },
        ],
      }),
    };

    const globalAny = global as unknown as { registry: any };
    globalAny.registry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    const response = await GET();
    const _json = await response.json();

    expect(_json.data.models).toHaveLength(2);
    expect(_json.data.models[0]).toHaveProperty("status");
    expect(_json.data.models[0]).toHaveProperty("memory");
    expect(_json.data.models[0]).toHaveProperty("requests");
    expect(_json.data.models[0].memory).toBe(3906); // 4GB in MB, rounded
    expect(_json.data.models[1].memory).toBe(1953); // 2GB in MB, rounded
  });

  it("should handle llama service errors gracefully", async () => {
    const mockLlamaService = {
      getState: jest.fn().mockImplementation(() => {
        throw new Error("Service unavailable");
      }),
    };

    const globalAny = global as unknown as { registry: any };
    globalAny.registry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data.models).toEqual([]);
  });

  it("should handle registry errors", async () => {
    const globalAny = global as unknown as { registry: any };
    globalAny.registry = null;

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data.models).toEqual([]);
  });

  it("should handle unexpected errors", async () => {
    // Mock Math.random to throw an error
    const originalRandom = Math.random;
    Math.random = jest.fn().mockImplementation(() => {
      throw new Error("Random number generation failed");
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.success).toBe(false);
    expect(_json.error.code).toBe("MONITORING_FETCH_ERROR");

    // Restore Math.random
    Math.random = originalRandom;
  });
});