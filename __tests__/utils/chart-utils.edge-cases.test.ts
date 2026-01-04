import { updateChartHistory, formatUptime } from "@/utils/chart-utils";
import {
  createMockChartHistory,
  createMockMetrics,
} from "./chart-utils.test-utils";

describe("chart-utils - Edge Cases", () => {
  describe("updateChartHistory", () => {
    it("keeps only last 60 points when history exceeds limit", () => {
      const largeHistory = {
        cpu: Array(70)
          .fill(null)
          .map((_, i) => ({
            timestamp: Date.now() - (70 - i) * 1000,
            value: i,
          })),
        memory: [],
        requests: [],
        gpuUtil: [],
        power: [],
      };

      const newMetrics = createMockMetrics(100, 0, 0, 0, 0);

      const result = updateChartHistory(largeHistory, newMetrics);

      expect(result.cpu).toHaveLength(60);
      expect(result.cpu[0].value).toBe(10);
      expect(result.cpu[59].value).toBe(100);
    });

    it("handles null values in metrics", () => {
      const baseHistory = createMockChartHistory();
      const newMetrics = { cpu: null, memory: null, requests: null, gpuUtil: null, power: null };

      const result = updateChartHistory(baseHistory, newMetrics);

      expect(result.cpu[0].value).toBeNull();
      expect(result.memory[0].value).toBeNull();
      expect(result.requests[0].value).toBeNull();
      expect(result.gpuUtil[0].value).toBeNull();
      expect(result.power[0].value).toBeNull();
    });
  });

  describe("formatUptime", () => {
    it("handles negative values gracefully", () => {
      const result = formatUptime(-100);
      expect(result).toBe("0d 0h 0m");
    });

    it("handles very large values", () => {
      const result = formatUptime(31536000);
      expect(result).toBe("365d 0h 0m");
    });

    it("handles fractional seconds", () => {
      const result = formatUptime(90.5);
      expect(result).toBe("0d 0h 1m");
    });
  });
});
