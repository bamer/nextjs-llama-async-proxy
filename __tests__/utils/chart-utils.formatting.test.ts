import { toChartDataPoint, updateChartHistory, formatUptime } from "@/utils/chart-utils";
import {
  createMockChartDataPoint,
  createMockChartHistory,
  createMockMetrics,
} from "./chart-utils.test-utils";

describe("chart-utils - Formatting", () => {
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
    it("creates correct data points with current timestamp", () => {
      const baseHistory = createMockChartHistory();
      const newMetrics = createMockMetrics(50, 60, 100, 30, 120);

      const beforeTime = Date.now();
      const result = updateChartHistory(baseHistory, newMetrics);
      const afterTime = Date.now();

      expect(result.cpu[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.cpu[0].timestamp).toBeLessThanOrEqual(afterTime);
      expect(result.cpu[0].value).toBe(50);
    });

    it("appends to existing history", () => {
      const existingHistory = {
        cpu: [{ timestamp: Date.now() - 1000, value: 40 }],
        memory: [{ timestamp: Date.now() - 1000, value: 50 }],
        requests: [{ timestamp: Date.now() - 1000, value: 90 }],
        gpuUtil: [{ timestamp: Date.now() - 1000, value: 25 }],
        power: [{ timestamp: Date.now() - 1000, value: 110 }],
      };

      const newMetrics = createMockMetrics(50, 60, 100, 30, 120);

      const result = updateChartHistory(existingHistory, newMetrics);

      expect(result.cpu).toHaveLength(2);
      expect(result.cpu[0].value).toBe(40);
      expect(result.cpu[1].value).toBe(50);
    });

    it("maintains max 60 data points per metric", () => {
      const largeHistory = {
        cpu: Array(65).fill({ timestamp: Date.now(), value: 50 }),
        memory: Array(65).fill({ timestamp: Date.now(), value: 60 }),
        requests: Array(65).fill({ timestamp: Date.now(), value: 100 }),
        gpuUtil: Array(65).fill({ timestamp: Date.now(), value: 30 }),
        power: Array(65).fill({ timestamp: Date.now(), value: 120 }),
      };

      const newMetrics = createMockMetrics(55, 65, 110, 35, 125);

      const result = updateChartHistory(largeHistory, newMetrics);

      expect(result.cpu).toHaveLength(60);
      expect(result.memory).toHaveLength(60);
      expect(result.requests).toHaveLength(60);
      expect(result.gpuUtil).toHaveLength(60);
      expect(result.power).toHaveLength(60);
    });

    it("handles mixed null and number values", () => {
      const baseHistory = createMockChartHistory();
      const newMetrics = { cpu: 50, memory: null, requests: 100, gpuUtil: null, power: 120 };

      const result = updateChartHistory(baseHistory, newMetrics);

      expect(result.cpu[0].value).toBe(50);
      expect(result.memory[0].value).toBeNull();
      expect(result.requests[0].value).toBe(100);
      expect(result.gpuUtil[0].value).toBeNull();
      expect(result.power[0].value).toBe(120);
    });

    it("handles empty history", () => {
      const emptyHistory = createMockChartHistory();
      const newMetrics = createMockMetrics(50, 60, 100, 30, 120);

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
      const result = formatUptime(3600);
      expect(result).toBe("0d 1h 0m");
    });

    it("formats uptime with minutes only", () => {
      const result = formatUptime(300);
      expect(result).toBe("0d 0h 5m");
    });

    it("formats uptime in hours", () => {
      const result = formatUptime(7200);
      expect(result).toBe("0d 2h 0m");
    });

    it("formats uptime with hours and minutes", () => {
      const result = formatUptime(7500);
      expect(result).toBe("0d 2h 5m");
    });

    it("formats uptime in days", () => {
      const result = formatUptime(86400);
      expect(result).toBe("1d 0h 0m");
    });

    it("formats uptime with days and hours", () => {
      const result = formatUptime(90000);
      expect(result).toBe("1d 1h 0m");
    });

    it("formats uptime with days, hours, and minutes", () => {
      const result = formatUptime(93000);
      expect(result).toBe("1d 1h 50m");
    });

    it("formats multiple days", () => {
      const result = formatUptime(172800);
      expect(result).toBe("2d 0h 0m");
    });

    it("handles large uptime values", () => {
      const result = formatUptime(345600);
      expect(result).toBe("4d 0h 0m");
    });

    it("handles mixed values", () => {
      const result = formatUptime(375050);
      expect(result).toBe("4d 8h 4m");
    });

    it("truncates seconds", () => {
      const result = formatUptime(90);
      expect(result).toBe("0d 0h 1m");
    });
  });
});
