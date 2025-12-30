import { GET } from "../../app/api/metrics/route";

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
  })),
}));

jest.mock("@/lib/validators", () => ({
  metricsResponseSchema: {
    safeParse: jest.fn(),
  },
}));

describe("GET /api/metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return valid metrics response", async () => {
    const { metricsResponseSchema } = require("@/lib/validators");
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 55,
          activeModels: 2,
          totalRequests: 5500,
          avgResponseTime: 75,
          uptime: 43200,
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty("metrics");
    expect(json).toHaveProperty("timestamp");
    expect(json.metrics).toHaveProperty("cpuUsage");
    expect(json.metrics).toHaveProperty("memoryUsage");
    expect(json.metrics).toHaveProperty("diskUsage");
    expect(json.metrics).toHaveProperty("activeModels");
    expect(json.metrics).toHaveProperty("totalRequests");
    expect(json.metrics).toHaveProperty("avgResponseTime");
    expect(json.metrics).toHaveProperty("uptime");
  });

  it("should include GPU metrics when available", async () => {
    // Mock Math.random to ensure GPU data is generated
    const originalRandom = Math.random;
    Math.random = jest.fn()
      .mockReturnValueOnce(0.5) // cpuUsage
      .mockReturnValueOnce(0.5) // memoryUsage
      .mockReturnValueOnce(0.5) // diskUsage
      .mockReturnValueOnce(0.5) // activeModels
      .mockReturnValueOnce(0.5) // totalRequests
      .mockReturnValueOnce(0.5) // avgResponseTime
      .mockReturnValueOnce(0.5) // uptime
      .mockReturnValueOnce(0.8); // hasGPU (should be > 0.3)

    const { metricsResponseSchema } = require("@/lib/validators");
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 40,
          memoryUsage: 55,
          diskUsage: 60,
          activeModels: 2,
          totalRequests: 5500,
          avgResponseTime: 100,
          uptime: 43200,
          timestamp: "2024-01-01T12:00:00.000Z",
          gpuUsage: 55,
          gpuMemoryUsage: 60,
          gpuMemoryTotal: 25769803776,
          gpuMemoryUsed: 15461882265,
          gpuPowerUsage: 175,
          gpuPowerLimit: 300,
          gpuTemperature: 70,
          gpuName: "NVIDIA RTX 4090",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const json = await response.json();

    expect(json.metrics).toHaveProperty("gpuUsage");
    expect(json.metrics).toHaveProperty("gpuMemoryUsage");
    expect(json.metrics).toHaveProperty("gpuMemoryTotal");
    expect(json.metrics).toHaveProperty("gpuMemoryUsed");
    expect(json.metrics).toHaveProperty("gpuPowerUsage");
    expect(json.metrics).toHaveProperty("gpuPowerLimit");
    expect(json.metrics).toHaveProperty("gpuTemperature");
    expect(json.metrics).toHaveProperty("gpuName");

    Math.random = originalRandom;
  });

  it("should not include GPU metrics when not available", async () => {
    // Mock Math.random to ensure no GPU data
    const originalRandom = Math.random;
    Math.random = jest.fn()
      .mockReturnValueOnce(0.5) // cpuUsage
      .mockReturnValueOnce(0.5) // memoryUsage
      .mockReturnValueOnce(0.5) // diskUsage
      .mockReturnValueOnce(0.5) // activeModels
      .mockReturnValueOnce(0.5) // totalRequests
      .mockReturnValueOnce(0.5) // avgResponseTime
      .mockReturnValueOnce(0.5) // uptime
      .mockReturnValueOnce(0.1); // hasGPU (should be <= 0.3)

    const { metricsResponseSchema } = require("@/lib/validators");
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 40,
          memoryUsage: 55,
          diskUsage: 60,
          activeModels: 2,
          totalRequests: 5500,
          avgResponseTime: 100,
          uptime: 43200,
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const json = await response.json();

    expect(json.metrics).not.toHaveProperty("gpuUsage");
    expect(json.metrics).not.toHaveProperty("gpuMemoryUsage");
    expect(json.metrics).not.toHaveProperty("gpuMemoryTotal");

    Math.random = originalRandom;
  });

  it("should return 500 when metrics validation fails", async () => {
    const { metricsResponseSchema } = require("@/lib/validators");
    metricsResponseSchema.safeParse.mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            code: "invalid_type",
            expected: "number",
            received: "string",
            path: ["metrics", "cpuUsage"],
          },
        ],
      },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to validate metrics data");
    expect(json.details).toBeDefined();
  });

  it("should handle unexpected errors", async () => {
    const { metricsResponseSchema } = require("@/lib/validators");
    metricsResponseSchema.safeParse.mockImplementation(() => {
      throw new Error("Unexpected validation error");
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to fetch metrics");
    expect(json.details).toBe("Unexpected validation error");
  });

  it("should have metrics within expected ranges", async () => {
    const { metricsResponseSchema } = require("@/lib/validators");
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 55,
          activeModels: 2,
          totalRequests: 5500,
          avgResponseTime: 75,
          uptime: 43200,
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const json = await response.json();

    const metrics = json.metrics;

    expect(metrics.cpuUsage).toBeGreaterThanOrEqual(20);
    expect(metrics.cpuUsage).toBeLessThanOrEqual(60);
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(40);
    expect(metrics.memoryUsage).toBeLessThanOrEqual(70);
    expect(metrics.diskUsage).toBeGreaterThanOrEqual(50);
    expect(metrics.diskUsage).toBeLessThanOrEqual(70);
    expect(metrics.activeModels).toBeGreaterThanOrEqual(1);
    expect(metrics.activeModels).toBeLessThanOrEqual(4);
    expect(metrics.totalRequests).toBeGreaterThanOrEqual(5000);
    expect(metrics.totalRequests).toBeLessThanOrEqual(6000);
    expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(50);
    expect(metrics.avgResponseTime).toBeLessThanOrEqual(150);
    expect(metrics.uptime).toBeGreaterThanOrEqual(3600);
    expect(metrics.uptime).toBeLessThanOrEqual(90000);
  });
});