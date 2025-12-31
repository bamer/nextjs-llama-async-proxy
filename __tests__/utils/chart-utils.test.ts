import {
  toChartDataPoint,
  updateChartHistory,
  formatUptime,
  countActiveModels,
  type ChartDataPoint,
  type ChartHistory,
} from "@/utils/chart-utils";
import type { ModelConfig } from "@/types";

describe("chart-utils", () => {
  describe("toChartDataPoint", () => {
    it("creates data point with value and timestamp", () => {
      const value = 50;
      const timestamp = Date.now();

      const result = toChartDataPoint(value, timestamp);

      expect(result).toEqual({
        timestamp,
        value,
      });
    });

    it("handles null value", () => {
      const timestamp = Date.now();

      const result = toChartDataPoint(null, timestamp);

      expect(result).toEqual({
        timestamp,
        value: null,
      });
    });

    it("handles zero value", () => {
      const timestamp = Date.now();

      const result = toChartDataPoint(0, timestamp);

      expect(result).toEqual({
        timestamp,
        value: 0,
      });
    });

    it("handles negative value", () => {
      const timestamp = Date.now();

      const result = toChartDataPoint(-10, timestamp);

      expect(result).toEqual({
        timestamp,
        value: -10,
      });
    });

    it("handles decimal value", () => {
      const timestamp = Date.now();

      const result = toChartDataPoint(50.5, timestamp);

      expect(result).toEqual({
        timestamp,
        value: 50.5,
      });
    });
  });

  describe("updateChartHistory", () => {
    const baseHistory: ChartHistory = {
      cpu: [],
      memory: [],
      requests: [],
      gpuUtil: [],
      power: [],
    };

    it("adds new data points to all metrics", () => {
      const newMetrics = {
        cpu: 50,
        memory: 60,
        requests: 100,
        gpuUtil: 30,
        power: 120,
      };

      const result = updateChartHistory(baseHistory, newMetrics);

      expect(result.cpu).toHaveLength(1);
      expect(result.memory).toHaveLength(1);
      expect(result.requests).toHaveLength(1);
      expect(result.gpuUtil).toHaveLength(1);
      expect(result.power).toHaveLength(1);
    });

    it("creates correct data points with current timestamp", () => {
      const beforeTime = Date.now();
      const newMetrics = {
        cpu: 50,
        memory: 60,
        requests: 100,
        gpuUtil: 30,
        power: 120,
      };

      const result = updateChartHistory(baseHistory, newMetrics);
      const afterTime = Date.now();

      expect(result.cpu[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.cpu[0].timestamp).toBeLessThanOrEqual(afterTime);
      expect(result.cpu[0].value).toBe(50);
    });

    it("appends to existing history", () => {
      const existingHistory: ChartHistory = {
        cpu: [{ timestamp: Date.now() - 1000, value: 40 }],
        memory: [{ timestamp: Date.now() - 1000, value: 50 }],
        requests: [{ timestamp: Date.now() - 1000, value: 90 }],
        gpuUtil: [{ timestamp: Date.now() - 1000, value: 25 }],
        power: [{ timestamp: Date.now() - 1000, value: 110 }],
      };

      const newMetrics = {
        cpu: 50,
        memory: 60,
        requests: 100,
        gpuUtil: 30,
        power: 120,
      };

      const result = updateChartHistory(existingHistory, newMetrics);

      expect(result.cpu).toHaveLength(2);
      expect(result.cpu[0].value).toBe(40);
      expect(result.cpu[1].value).toBe(50);
    });

    it("maintains max 60 data points per metric", () => {
      const largeHistory: ChartHistory = {
        cpu: Array(65).fill({ timestamp: Date.now(), value: 50 }),
        memory: Array(65).fill({ timestamp: Date.now(), value: 60 }),
        requests: Array(65).fill({ timestamp: Date.now(), value: 100 }),
        gpuUtil: Array(65).fill({ timestamp: Date.now(), value: 30 }),
        power: Array(65).fill({ timestamp: Date.now(), value: 120 }),
      };

      const newMetrics = {
        cpu: 55,
        memory: 65,
        requests: 110,
        gpuUtil: 35,
        power: 125,
      };

      const result = updateChartHistory(largeHistory, newMetrics);

      expect(result.cpu).toHaveLength(60);
      expect(result.memory).toHaveLength(60);
      expect(result.requests).toHaveLength(60);
      expect(result.gpuUtil).toHaveLength(60);
      expect(result.power).toHaveLength(60);
    });

    it("keeps only last 60 points when history exceeds limit", () => {
      const largeHistory: ChartHistory = {
        cpu: Array(70).fill(null).map((_, i) => ({
          timestamp: Date.now() - (70 - i) * 1000,
          value: i,
        })),
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      };

      const newMetrics = {
        cpu: 100,
        memory: 0,
        requests: 0,
        gpuUtil: 0,
        power: 0,
      };

      const result = updateChartHistory(largeHistory, newMetrics);

      expect(result.cpu).toHaveLength(60);
      // Should have values 10-69 (last 60 values)
      expect(result.cpu[0].value).toBe(10);
      expect(result.cpu[59].value).toBe(100);
    });

    it("handles null values in metrics", () => {
      const newMetrics = {
        cpu: null,
        memory: null,
        requests: null,
        gpuUtil: null,
        power: null,
      };

      const result = updateChartHistory(baseHistory, newMetrics);

      expect(result.cpu[0].value).toBeNull();
      expect(result.memory[0].value).toBeNull();
      expect(result.requests[0].value).toBeNull();
      expect(result.gpuUtil[0].value).toBeNull();
      expect(result.power[0].value).toBeNull();
    });

    it("handles mixed null and number values", () => {
      const newMetrics = {
        cpu: 50,
        memory: null,
        requests: 100,
        gpuUtil: null,
        power: 120,
      };

      const result = updateChartHistory(baseHistory, newMetrics);

      expect(result.cpu[0].value).toBe(50);
      expect(result.memory[0].value).toBeNull();
      expect(result.requests[0].value).toBe(100);
      expect(result.gpuUtil[0].value).toBeNull();
      expect(result.power[0].value).toBe(120);
    });

    it("handles empty history", () => {
      const emptyHistory: ChartHistory = {
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      };

      const newMetrics = {
        cpu: 50,
        memory: 60,
        requests: 100,
        gpuUtil: 30,
        power: 120,
      };

      const result = updateChartHistory(emptyHistory, newMetrics);

      expect(result.cpu).toHaveLength(1);
      expect(result.memory).toHaveLength(1);
      expect(result.requests).toHaveLength(1);
      expect(result.gpuUtil).toHaveLength(1);
      expect(result.power).toHaveLength(1);
    });
  });

  describe("formatUptime", () => {
    it("formats uptime in seconds correctly", () => {
      const result = formatUptime(0);
      expect(result).toBe("0d 0h 0m");
    });

    it("formats uptime less than a minute", () => {
      const result = formatUptime(45);
      expect(result).toBe("0d 0h 0m");
    });

    it("formats uptime in minutes", () => {
      const result = formatUptime(3600); // 1 hour = 60 minutes
      expect(result).toBe("0d 1h 0m");
    });

    it("formats uptime with minutes only", () => {
      const result = formatUptime(300); // 5 minutes
      expect(result).toBe("0d 0h 5m");
    });

    it("formats uptime in hours", () => {
      const result = formatUptime(7200); // 2 hours
      expect(result).toBe("0d 2h 0m");
    });

    it("formats uptime with hours and minutes", () => {
      const result = formatUptime(7500); // 2 hours 5 minutes
      expect(result).toBe("0d 2h 5m");
    });

    it("formats uptime in days", () => {
      const result = formatUptime(86400); // 1 day
      expect(result).toBe("1d 0h 0m");
    });

    it("formats uptime with days and hours", () => {
      const result = formatUptime(90000); // 1 day 1 hour
      expect(result).toBe("1d 1h 0m");
    });

    it("formats uptime with days, hours, and minutes", () => {
      const result = formatUptime(93000); // 1 day 1 hour 50 minutes
      expect(result).toBe("1d 1h 50m");
    });

    it("formats multiple days", () => {
      const result = formatUptime(172800); // 2 days
      expect(result).toBe("2d 0h 0m");
    });

    it("handles large uptime values", () => {
      const result = formatUptime(345600); // 4 days
      expect(result).toBe("4d 0h 0m");
    });

    it("handles mixed values", () => {
      const result = formatUptime(375050); // 4 days 8 hours 4 minutes 10 seconds
      expect(result).toBe("4d 8h 4m");
    });

    it("truncates seconds", () => {
      const result = formatUptime(90); // 1 minute 30 seconds
      expect(result).toBe("0d 0h 1m");
    });

    it("handles negative values gracefully", () => {
      const result = formatUptime(-100);
      expect(result).toBe("0d 0h 0m");
    });
  });

  describe("countActiveModels", () => {
    const models: ModelConfig[] = [
      {
        id: "1",
        name: "Model 1",
        type: "llama",
        parameters: {},
        status: "running",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Model 2",
        type: "llama",
        parameters: {},
        status: "idle",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Model 3",
        type: "llama",
        parameters: {},
        status: "running",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "4",
        name: "Model 4",
        type: "llama",
        parameters: {},
        status: "error",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "5",
        name: "Model 5",
        type: "llama",
        parameters: {},
        status: "running",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it("counts models with running status", () => {
      const result = countActiveModels(models);
      expect(result).toBe(3);
    });

    it("returns 0 for empty array", () => {
      const result = countActiveModels([]);
      expect(result).toBe(0);
    });

    it("returns 0 when no models are running", () => {
      const idleModels: ModelConfig[] = [
        {
          id: "1",
          name: "Model 1",
          type: "llama",
          parameters: {},
          status: "idle",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Model 2",
          type: "llama",
          parameters: {},
          status: "error",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = countActiveModels(idleModels);
      expect(result).toBe(0);
    });

    it("counts all models when all are running", () => {
      const allRunning: ModelConfig[] = models.map((m) => ({
        ...m,
        status: "running" as const,
      }));

      const result = countActiveModels(allRunning);
      expect(result).toBe(5);
    });

    it("handles single running model", () => {
      const singleRunning: ModelConfig[] = [
        {
          id: "1",
          name: "Model 1",
          type: "llama",
          parameters: {},
          status: "running",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = countActiveModels(singleRunning);
      expect(result).toBe(1);
    });

    it("handles different status values", () => {
      const mixedStatus: ModelConfig[] = [
        {
          id: "1",
          name: "Model 1",
          type: "llama",
          parameters: {},
          status: "running",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Model 2",
          type: "mistral",
          parameters: {},
          status: "loading",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Model 3",
          type: "other",
          parameters: {},
          status: "error",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const result = countActiveModels(mixedStatus);
      expect(result).toBe(1);
    });

    it("handles large number of models", () => {
      const manyModels: ModelConfig[] = Array(100)
        .fill(null)
        .map((_, i) => ({
          id: `${i}`,
          name: `Model ${i}`,
          type: "llama" as const,
          parameters: {},
          status: i % 2 === 0 ? ("running" as const) : ("idle" as const),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

      const result = countActiveModels(manyModels);
      expect(result).toBe(50);
    });
  });

  describe("Type Safety", () => {
    it("ChartDataPoint has correct structure", () => {
      const point: ChartDataPoint = {
        timestamp: Date.now(),
        value: 50,
      };

      expect(typeof point.timestamp).toBe("number");
      expect(point.value === null || typeof point.value === "number").toBe(
        true
      );
    });

    it("ChartHistory has correct structure", () => {
      const history: ChartHistory = {
        cpu: [],
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      };

      expect(Array.isArray(history.cpu)).toBe(true);
      expect(Array.isArray(history.memory)).toBe(true);
      expect(Array.isArray(history.requests)).toBe(true);
      expect(Array.isArray(history.gpuUtil)).toBe(true);
      expect(Array.isArray(history.power)).toBe(true);
    });
  });
});
