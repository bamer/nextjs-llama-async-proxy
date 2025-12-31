import { GET } from "../../app/api/monitoring/latest/route";
import { MonitoringEntry } from "@/types/monitoring";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    }),
  },
}));

describe("GET /api/monitoring/latest", () => {
  let mockLlamaService: jest.Mocked<{
    getState: () => {
      status: string;
      models?: Array<{
        id?: string;
        status?: string;
        size?: number;
      }>;
    };
  }>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLlamaService = {
      getState: jest.fn().mockReturnValue({
        status: "ready",
        models: [],
      }),
    };
    const mockRegistry = {
      get: jest.fn().mockReturnValue(mockLlamaService),
    };
    (global as unknown as { registry: unknown }).registry = mockRegistry;
  });

  afterEach(() => {
    delete (global as unknown as { registry?: unknown }).registry;
  });

  // Positive test: Successfully return monitoring data
  it("should return monitoring data successfully", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.success).toBe(true);
    expect(_json.data).toBeDefined();
    expect(_json.data.system).toBeDefined();
    expect(_json.data.models).toBeDefined();
    expect(_json.timestamp).toBeDefined();
  });

  // Positive test: Include system metrics
  it("should include all system metrics", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.system).toHaveProperty("cpu");
    expect(_json.data.system).toHaveProperty("memory");
    expect(_json.data.system).toHaveProperty("disk");
    expect(_json.data.system).toHaveProperty("network");
    expect(_json.data.system).toHaveProperty("uptime");
    expect(_json.data.system.cpu).toHaveProperty("usage");
    expect(_json.data.system.memory).toHaveProperty("used");
    expect(_json.data.system.disk).toHaveProperty("used");
    expect(_json.data.system.network).toHaveProperty("rx");
    expect(_json.data.system.network).toHaveProperty("tx");
  });

  // Positive test: Return valid CPU usage
  it("should return CPU usage in valid range", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(_json.data.system.cpu.usage).toBeGreaterThanOrEqual(20);
    expect(_json.data.system.cpu.usage).toBeLessThanOrEqual(60);
  });

  // Positive test: Return valid memory usage
  it("should return memory usage in valid range", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(_json.data.system.memory.used).toBeGreaterThanOrEqual(40);
    expect(_json.data.system.memory.used).toBeLessThanOrEqual(70);
  });

  // Positive test: Return valid disk usage
  it("should return disk usage in valid range", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(_json.data.system.disk.used).toBeGreaterThanOrEqual(50);
    expect(_json.data.system.disk.used).toBeLessThanOrEqual(70);
  });

  // Positive test: Include models from llama service
  it("should include models from llama service", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "model-1", status: "running", size: 4000000000 },
        { id: "model-2", status: "idle", size: 5000000000 },
      ],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models).toHaveLength(2);
    expect(_json.data.models[0]).toHaveProperty("status");
    expect(_json.data.models[0]).toHaveProperty("memory");
    expect(_json.data.models[0]).toHaveProperty("requests");
  });

  // Positive test: Handle models without size
  it("should handle models without size", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [{ id: "model-1", status: "running" }],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models[0].memory).toBe(0);
  });

  // Positive test: Handle models with large size
  it("should handle models with large size", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "model-1", status: "running", size: 10000000000 },
      ],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models[0].memory).toBeGreaterThan(0);
  });

  // Negative test: Return error when llamaService fails
  it("should handle llamaService.getState throwing error", async () => {
    mockLlamaService.getState.mockImplementation(() => {
      throw new Error("Service error");
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200); // Still returns 200 with empty models
    expect(_json.data.models).toEqual([]);
  });

  // Positive test: Return valid timestamp
  it("should return valid timestamp", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.timestamp).toBeDefined();
    expect(() => new Date(_json.timestamp)).not.toThrow();
  });

  // Edge case: Handle llamaService not available
  it("should handle llamaService not available", async () => {
    const mockRegistry = {
      get: jest.fn().mockReturnValue(null),
    };
    (global as unknown as { registry: unknown }).registry = mockRegistry;

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models).toEqual([]);
  });

  // Edge case: Handle concurrent requests
  it("should handle concurrent GET requests", async () => {
    const responses = await Promise.all([GET(), GET(), GET()]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle model with different status values
  it("should handle models with various status values", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [
        { id: "model-1", status: "running" },
        { id: "model-2", status: "loading" },
        { id: "model-3", status: "idle" },
        { id: "model-4", status: "stopped" },
        { id: "model-5", status: "error" },
      ],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models).toHaveLength(5);
  });

  // Edge case: Handle very large model count
  it("should handle very large model count", async () => {
    const models = Array.from({ length: 100 }, (_, i) => ({
      id: `model-${i}`,
      status: "idle",
      size: 4000000000,
    }));

    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models,
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models).toHaveLength(100);
  });

  // Edge case: Handle zero models
  it("should handle zero models", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models).toEqual([]);
  });

  // Edge case: Return valid network metrics
  it("should return valid network metrics", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(_json.data.system.network.rx).toBeGreaterThan(0);
    expect(_json.data.system.network.tx).toBeGreaterThan(0);
  });

  // Edge case: Return valid uptime
  it("should return valid uptime value", async () => {
    const response = await GET();
    const _json = await response.json();

    expect(_json.data.system.uptime).toBeGreaterThanOrEqual(3600); // At least 1 hour
    expect(_json.data.system.uptime).toBeLessThanOrEqual(90000); // At most 25 hours
  });

  // Edge case: Handle memory calculation edge case
  it("should handle memory calculation for very small models", async () => {
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [{ id: "model-1", status: "running", size: 1024 }],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models[0].memory).toBe(0); // Rounding down
  });

  // Edge case: Handle memory calculation for very large models
  it("should handle memory calculation for very large models", async () => {
    const hugeSize = Number.MAX_SAFE_INTEGER;
    mockLlamaService.getState.mockReturnValue({
      status: "ready",
      models: [{ id: "model-1", status: "running", size: hugeSize }],
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.data.models[0].memory).toBeGreaterThan(0);
  });
});
