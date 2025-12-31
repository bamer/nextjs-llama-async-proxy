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

  // Positive test: Should return valid metrics response
  it("should return valid metrics response", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
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
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json).toHaveProperty("metrics");
    expect(_json).toHaveProperty("timestamp");
    expect(_json.metrics).toHaveProperty("cpuUsage");
    expect(_json.metrics).toHaveProperty("memoryUsage");
    expect(_json.metrics).toHaveProperty("diskUsage");
    expect(_json.metrics).toHaveProperty("activeModels");
    expect(_json.metrics).toHaveProperty("totalRequests");
    expect(_json.metrics).toHaveProperty("avgResponseTime");
    expect(_json.metrics).toHaveProperty("uptime");
  });

  // Positive test: Include GPU metrics when available
  it("should include GPU metrics when available", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
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
    const _json = await response.json();

    expect(_json.metrics).toHaveProperty("gpuUsage");
    expect(_json.metrics).toHaveProperty("gpuMemoryUsage");
    expect(_json.metrics).toHaveProperty("gpuMemoryTotal");
    expect(_json.metrics).toHaveProperty("gpuMemoryUsed");
    expect(_json.metrics).toHaveProperty("gpuPowerUsage");
    expect(_json.metrics).toHaveProperty("gpuPowerLimit");
    expect(_json.metrics).toHaveProperty("gpuTemperature");
    expect(_json.metrics).toHaveProperty("gpuName");
  });

  // Negative test: Return 500 when metrics validation fails
  it("should return 500 when metrics validation fails", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
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
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.error).toBe("Failed to validate metrics data");
    expect(_json.details).toBeDefined();
  });

  // Negative test: Handle unexpected errors
  it("should handle unexpected errors", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockImplementation(() => {
      throw new Error("Unexpected validation error");
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(500);
    expect(_json.error).toBe("Failed to fetch metrics");
    expect(_json.details).toBe("Unexpected validation error");
  });

  // Edge case: Metrics within expected ranges
  it("should have metrics within expected ranges", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
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
    const _json = await response.json();

    const metrics = _json.metrics;

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

  // Edge case: Handle concurrent requests
  it("should handle concurrent GET requests", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 50,
          memoryUsage: 55,
          diskUsage: 60,
          activeModels: 1,
          totalRequests: 5000,
          avgResponseTime: 100,
          uptime: 36000,
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const responses = await Promise.all([GET(), GET(), GET()]);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  // Edge case: Handle GPU metrics without data
  it("should handle metrics without GPU data", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 50,
          memoryUsage: 55,
          diskUsage: 60,
          activeModels: 1,
          totalRequests: 5000,
          avgResponseTime: 100,
          uptime: 36000,
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const _json = await response.json();

    expect(_json.metrics).not.toHaveProperty("gpuUsage");
    expect(_json.metrics).not.toHaveProperty("gpuMemoryUsage");
  });

  // Edge case: Handle edge values for metrics
  it("should handle edge values for all metrics", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 20, // Minimum
          memoryUsage: 40, // Minimum
          diskUsage: 50, // Minimum
          activeModels: 1, // Minimum
          totalRequests: 5000, // Minimum
          avgResponseTime: 50, // Minimum
          uptime: 3600, // Minimum
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.metrics.cpuUsage).toBe(20);
    expect(_json.metrics.memoryUsage).toBe(40);
    expect(_json.metrics.diskUsage).toBe(50);
    expect(_json.metrics.activeModels).toBe(1);
  });

  // Edge case: Handle max values for metrics
  it("should handle maximum values for all metrics", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 60, // Maximum
          memoryUsage: 70, // Maximum
          diskUsage: 70, // Maximum
          activeModels: 4, // Maximum (mock can generate 1-3)
          totalRequests: 6000, // Maximum
          avgResponseTime: 150, // Maximum
          uptime: 90000, // Maximum
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle zero values where applicable
  it("should handle zero values for certain metrics", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 50,
          memoryUsage: 55,
          diskUsage: 60,
          activeModels: 0, // Edge case
          totalRequests: 0, // Edge case
          avgResponseTime: 0, // Edge case
          uptime: 0, // Edge case
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle large timestamp values
  it("should handle large uptime timestamp values", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 50,
          memoryUsage: 55,
          diskUsage: 60,
          activeModels: 1,
          totalRequests: 5000,
          avgResponseTime: 100,
          uptime: Number.MAX_SAFE_INTEGER, // Very large value
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
  });

  // Edge case: Handle GPU metrics with all fields
  it("should handle GPU metrics with all optional fields", async () => {
    const { metricsResponseSchema } = jest.mocked(require("@/lib/validators"));
    metricsResponseSchema.safeParse.mockReturnValue({
      success: true,
      data: {
        metrics: {
          cpuUsage: 40,
          memoryUsage: 55,
          diskUsage: 60,
          activeModels: 1,
          totalRequests: 5000,
          avgResponseTime: 100,
          uptime: 36000,
          timestamp: "2024-01-01T12:00:00.000Z",
          gpuUsage: 80, // Max
          gpuMemoryUsage: 80, // Max
          gpuMemoryTotal: 32212254720, // 30GB
          gpuMemoryUsed: 25769803776, // 24GB
          gpuPowerUsage: 250, // Max
          gpuPowerLimit: 300,
          gpuTemperature: 80, // Max
          gpuName: "NVIDIA RTX 4090",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    });

    const response = await GET();
    const _json = await response.json();

    expect(response.status).toBe(200);
    expect(_json.metrics.gpuUsage).toBe(80);
    expect(_json.metrics.gpuTemperature).toBe(80);
    expect(_json.metrics.gpuPowerUsage).toBe(250);
  });
});
