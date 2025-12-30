import { GET } from "../../../../app/api/metrics/route";
import { metricsResponseSchema } from "@/lib/validators";
import { getLogger } from "@/lib/logger";

jest.mock("@/lib/validators");
jest.mock("@/lib/logger");

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

(getLogger as jest.Mock).mockReturnValue(mockLogger);

describe("GET /api/metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return system metrics successfully", async () => {
    const mockMetrics = {
      cpuUsage: 45,
      memoryUsage: 60,
      diskUsage: 55,
      activeModels: 2,
      totalRequests: 5500,
      avgResponseTime: 75,
      uptime: 7200,
      timestamp: "2024-01-01T12:00:00.000Z",
      gpuUsage: 40,
      gpuMemoryUsage: 50,
      gpuMemoryTotal: 25769803776,
      gpuMemoryUsed: 12884901888,
      gpuPowerUsage: 150,
      gpuPowerLimit: 300,
      gpuTemperature: 65,
      gpuName: "NVIDIA RTX 4090",
    };

    const mockValidationResult = {
      success: true,
      data: {
        metrics: mockMetrics,
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    };

    (metricsResponseSchema.safeParse as jest.Mock).mockReturnValue(mockValidationResult);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(mockValidationResult.data);
    expect(metricsResponseSchema.safeParse).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith("[API] Fetching system metrics");
    expect(mockLogger.info).toHaveBeenCalledWith("[API] Metrics fetched successfully");
  });

  it("should return metrics without GPU data", async () => {
    const mockMetrics = {
      cpuUsage: 35,
      memoryUsage: 50,
      diskUsage: 45,
      activeModels: 1,
      totalRequests: 5200,
      avgResponseTime: 85,
      uptime: 3600,
      timestamp: "2024-01-01T12:00:00.000Z",
    };

    const mockValidationResult = {
      success: true,
      data: {
        metrics: mockMetrics,
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    };

    (metricsResponseSchema.safeParse as jest.Mock).mockReturnValue(mockValidationResult);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.metrics).toEqual(mockMetrics);
    expect(json.metrics.gpuUsage).toBeUndefined();
  });

  it("should return 500 when metrics validation fails", async () => {
    const validationErrors = [
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: ["metrics", "cpuUsage"],
        message: "Expected number, received string",
      },
    ];

    const mockValidationResult = {
      success: false,
      error: {
        issues: validationErrors,
      },
    };

    (metricsResponseSchema.safeParse as jest.Mock).mockReturnValue(mockValidationResult);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to validate metrics data");
    expect(json.details).toEqual(validationErrors);
    expect(json.timestamp).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Metrics validation failed:", mockValidationResult.error);
  });

  it("should return 500 when an unexpected error occurs", async () => {
    const errorMessage = "Database connection failed";
    (metricsResponseSchema.safeParse as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to fetch metrics");
    expect(json.details).toBe(errorMessage);
    expect(json.timestamp).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalledWith("[API] Error fetching metrics:", expect.any(Error));
  });

  it("should handle non-Error exceptions", async () => {
    (metricsResponseSchema.safeParse as jest.Mock).mockImplementation(() => {
      throw "String error";
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Failed to fetch metrics");
    expect(json.details).toBe("String error");
  });

  it("should generate metrics with valid ranges", async () => {
    const mockValidationResult = {
      success: true,
      data: {
        metrics: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 55,
          activeModels: 2,
          totalRequests: 5500,
          avgResponseTime: 75,
          uptime: 7200,
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    };

    (metricsResponseSchema.safeParse as jest.Mock).mockReturnValue(mockValidationResult);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.metrics.cpuUsage).toBeGreaterThanOrEqual(0);
    expect(json.metrics.cpuUsage).toBeLessThanOrEqual(100);
    expect(json.metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(json.metrics.memoryUsage).toBeLessThanOrEqual(100);
    expect(json.metrics.diskUsage).toBeGreaterThanOrEqual(0);
    expect(json.metrics.diskUsage).toBeLessThanOrEqual(100);
    expect(json.metrics.activeModels).toBeGreaterThanOrEqual(0);
    expect(json.metrics.totalRequests).toBeGreaterThanOrEqual(0);
    expect(json.metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
    expect(json.metrics.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should include timestamp in response", async () => {
    const mockValidationResult = {
      success: true,
      data: {
        metrics: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 55,
          activeModels: 2,
          totalRequests: 5500,
          avgResponseTime: 75,
          uptime: 7200,
          timestamp: "2024-01-01T12:00:00.000Z",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    };

    (metricsResponseSchema.safeParse as jest.Mock).mockReturnValue(mockValidationResult);

    const response = await GET();
    const json = await response.json();

    expect(json.timestamp).toBeDefined();
    expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("should handle GPU metrics when available", async () => {
    const mockValidationResult = {
      success: true,
      data: {
        metrics: {
          cpuUsage: 45,
          memoryUsage: 60,
          diskUsage: 55,
          activeModels: 2,
          totalRequests: 5500,
          avgResponseTime: 75,
          uptime: 7200,
          timestamp: "2024-01-01T12:00:00.000Z",
          gpuUsage: 40,
          gpuMemoryUsage: 50,
          gpuMemoryTotal: 25769803776,
          gpuMemoryUsed: 12884901888,
          gpuPowerUsage: 150,
          gpuPowerLimit: 300,
          gpuTemperature: 65,
          gpuName: "NVIDIA RTX 4090",
        },
        timestamp: "2024-01-01T12:00:00.000Z",
      },
    };

    (metricsResponseSchema.safeParse as jest.Mock).mockReturnValue(mockValidationResult);

    const response = await GET();
    const json = await response.json();

    expect(json.metrics.gpuUsage).toBe(40);
    expect(json.metrics.gpuMemoryUsage).toBe(50);
    expect(json.metrics.gpuMemoryTotal).toBe(25769803776);
    expect(json.metrics.gpuMemoryUsed).toBe(12884901888);
    expect(json.metrics.gpuPowerUsage).toBe(150);
    expect(json.metrics.gpuPowerLimit).toBe(300);
    expect(json.metrics.gpuTemperature).toBe(65);
    expect(json.metrics.gpuName).toBe("NVIDIA RTX 4090");
  });
});