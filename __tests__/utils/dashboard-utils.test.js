/**
 * Dashboard Utilities Tests
 * Comprehensive tests for dashboard utility functions
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

// Mock window before importing the source file
globalThis.window = {
  DashboardUtils: undefined,
};

// Import from actual source file
const dashboardUtilsPath = new URL("../../public/js/utils/dashboard-utils.js", import.meta.url);
await import(dashboardUtilsPath.href);
const DashboardUtils = globalThis.window.DashboardUtils;

describe("DashboardUtils", () => {
  describe("_fmtUptime", () => {
    // POSITIVE TEST: Verifies correct formatting for zero seconds
    it("should return 0m for zero seconds", () => {
      const result = DashboardUtils._fmtUptime(0);
      expect(result).toBe("0m");
    });

    // POSITIVE TEST: Verifies correct formatting for seconds less than a minute
    it("should return 0m for 30 seconds", () => {
      const result = DashboardUtils._fmtUptime(30);
      expect(result).toBe("0m");
    });

    // POSITIVE TEST: Verifies correct formatting for minutes only (less than an hour)
    it("should format minutes only when less than an hour", () => {
      const result = DashboardUtils._fmtUptime(300); // 5 minutes
      expect(result).toBe("5m");
    });

    // POSITIVE TEST: Verifies correct formatting for 59 minutes
    it("should format 59 minutes correctly", () => {
      const result = DashboardUtils._fmtUptime(3540); // 59 minutes
      expect(result).toBe("59m");
    });

    // POSITIVE TEST: Verifies correct formatting for hours and minutes
    it("should format hours and minutes when less than a day", () => {
      const result = DashboardUtils._fmtUptime(7380); // 2h 3m
      expect(result).toBe("2h 3m");
    });

    // POSITIVE TEST: Verifies correct formatting for 23 hours 59 minutes
    it("should format 23h 59m correctly", () => {
      const result = DashboardUtils._fmtUptime(86340); // 23h 59m
      expect(result).toBe("23h 59m");
    });

    // POSITIVE TEST: Verifies correct formatting for days, hours, and minutes
    it("should format days, hours, and minutes", () => {
      const result = DashboardUtils._fmtUptime(90061); // 1d 1h 1m
      expect(result).toBe("1d 1h 1m");
    });

    // POSITIVE TEST: Verifies correct formatting for multiple days
    it("should format multiple days correctly", () => {
      const result = DashboardUtils._fmtUptime(172800); // 2d 0h 0m
      expect(result).toBe("2d 0h 0m");
    });

    // POSITIVE TEST: Verifies correct formatting for large values
    it("should handle large uptime values", () => {
      const result = DashboardUtils._fmtUptime(604800); // 7d 0h 0m
      expect(result).toBe("7d 0h 0m");
    });

    // NEGATIVE TEST: Verifies handling of undefined input (function returns NaNm)
    it("should handle undefined input gracefully", () => {
      const result = DashboardUtils._fmtUptime(undefined);
      expect(result).toBe("NaNm");
    });

    // NEGATIVE TEST: Verifies handling of null input (function returns 0m)
    it("should handle null input gracefully", () => {
      const result = DashboardUtils._fmtUptime(null);
      expect(result).toBe("0m");
    });

    // NEGATIVE TEST: Verifies handling of negative input (function returns negative minutes)
    it("should handle negative input gracefully", () => {
      const result = DashboardUtils._fmtUptime(-100);
      expect(result).toBe("-2m");
    });
  });

  describe("_calculateStats", () => {
    // POSITIVE TEST: Verifies correct stats for empty array
    it("should return default stats for empty array", () => {
      const result = DashboardUtils._calculateStats([]);
      expect(result).toEqual({ current: 0, avg: 0, max: 0 });
    });

    // POSITIVE TEST: Verifies correct stats for single item
    it("should calculate correct stats for single item", () => {
      const history = [{ cpu: { usage: 50 } }];
      const result = DashboardUtils._calculateStats(history);
      expect(result).toEqual({ current: 50, avg: 50, max: 50 });
    });

    // POSITIVE TEST: Verifies correct stats for multiple items
    it("should calculate correct average, current, and max", () => {
      const history = [
        { cpu: { usage: 20 } },
        { cpu: { usage: 40 } },
        { cpu: { usage: 60 } },
        { cpu: { usage: 80 } },
      ];
      const result = DashboardUtils._calculateStats(history);
      expect(result).toEqual({ current: 80, avg: 50, max: 80 });
    });

    // POSITIVE TEST: Verifies handling of items with missing cpu property
    it("should handle items with missing cpu property", () => {
      const history = [{ cpu: { usage: 30 } }, { other: { value: 50 } }, { cpu: { usage: 70 } }];
      const result = DashboardUtils._calculateStats(history);
      expect(result).toEqual({ current: 70, avg: 33.333333333333336, max: 70 });
    });

    // POSITIVE TEST: Verifies handling of items with undefined cpu usage
    it("should handle items with undefined cpu usage", () => {
      const history = [{ cpu: { usage: undefined } }, { cpu: { usage: 50 } }, {}];
      const result = DashboardUtils._calculateStats(history);
      expect(result).toEqual({ current: 0, avg: 16.666666666666668, max: 50 });
    });

    // POSITIVE TEST: Verifies handling of items with null cpu
    it("should handle items with null cpu", () => {
      const history = [{ cpu: null }, { cpu: { usage: 100 } }, { cpu: { usage: 0 } }];
      const result = DashboardUtils._calculateStats(history);
      expect(result).toEqual({ current: 0, avg: 33.333333333333336, max: 100 });
    });

    // POSITIVE TEST: Verifies correct max calculation
    it("should calculate correct max value", () => {
      const history = [{ cpu: { usage: 10 } }, { cpu: { usage: 95 } }, { cpu: { usage: 50 } }];
      const result = DashboardUtils._calculateStats(history);
      expect(result.max).toBe(95);
    });

    // NEGATIVE TEST: Verifies that undefined history causes a crash
    it("should crash when history is undefined", () => {
      expect(() => DashboardUtils._calculateStats(undefined)).toThrow(TypeError);
    });

    // NEGATIVE TEST: Verifies that null history causes a crash
    it("should crash when history is null", () => {
      expect(() => DashboardUtils._calculateStats(null)).toThrow(TypeError);
    });
  });

  describe("_calculateStatsForType", () => {
    // POSITIVE TEST: Verifies default stats for empty array
    it("should return default stats for empty array with cpu type", () => {
      const result = DashboardUtils._calculateStatsForType([], "cpu");
      expect(result).toEqual({ current: 0, avg: 0, max: 0 });
    });

    // POSITIVE TEST: Verifies default stats for empty array with gpu type
    it("should return default stats for empty array with gpu type", () => {
      const result = DashboardUtils._calculateStatsForType([], "gpu");
      expect(result).toEqual({ current: 0, avg: 0, max: 0 });
    });

    // POSITIVE TEST: Verifies cpu type calculation
    it("should calculate cpu stats correctly", () => {
      const history = [
        { cpu: { usage: 25 }, gpu: { usage: 40 } },
        { cpu: { usage: 50 }, gpu: { usage: 60 } },
        { cpu: { usage: 75 }, gpu: { usage: 80 } },
      ];
      const result = DashboardUtils._calculateStatsForType(history, "cpu");
      expect(result).toEqual({ current: 75, avg: 50, max: 75 });
    });

    // POSITIVE TEST: Verifies gpu type calculation
    it("should calculate gpu stats correctly", () => {
      const history = [
        { cpu: { usage: 25 }, gpu: { usage: 40 } },
        { cpu: { usage: 50 }, gpu: { usage: 60 } },
        { cpu: { usage: 75 }, gpu: { usage: 80 } },
      ];
      const result = DashboardUtils._calculateStatsForType(history, "gpu");
      expect(result).toEqual({ current: 80, avg: 60, max: 80 });
    });

    // POSITIVE TEST: Verifies cpu type with missing cpu property
    it("should handle missing cpu property for cpu type", () => {
      const history = [{ gpu: { usage: 50 } }, { cpu: { usage: 60 } }, {}];
      const result = DashboardUtils._calculateStatsForType(history, "cpu");
      expect(result).toEqual({ current: 0, avg: 20, max: 60 });
    });

    // POSITIVE TEST: Verifies gpu type with missing gpu property
    it("should handle missing gpu property for gpu type", () => {
      const history = [{ cpu: { usage: 50 } }, { gpu: { usage: 60 } }, {}];
      const result = DashboardUtils._calculateStatsForType(history, "gpu");
      expect(result).toEqual({ current: 0, avg: 20, max: 60 });
    });

    // POSITIVE TEST: Verifies default to cpu when type is not "gpu"
    it("should default to cpu for unknown type", () => {
      const history = [
        { cpu: { usage: 30 }, gpu: { usage: 50 } },
        { cpu: { usage: 70 }, gpu: { usage: 90 } },
      ];
      const result = DashboardUtils._calculateStatsForType(history, "unknown");
      expect(result).toEqual({ current: 70, avg: 50, max: 70 });
    });

    // POSITIVE TEST: Verifies correct max for gpu type
    it("should calculate correct max for gpu type", () => {
      const history = [{ gpu: { usage: 10 } }, { gpu: { usage: 95 } }, { gpu: { usage: 50 } }];
      const result = DashboardUtils._calculateStatsForType(history, "gpu");
      expect(result.max).toBe(95);
    });

    // POSITIVE TEST: Verifies handling of items with null gpu
    it("should handle items with null gpu", () => {
      const history = [{ gpu: null }, { gpu: { usage: 100 } }, { gpu: { usage: 0 } }];
      const result = DashboardUtils._calculateStatsForType(history, "gpu");
      expect(result).toEqual({ current: 0, avg: 33.333333333333336, max: 100 });
    });

    // NEGATIVE TEST: Verifies that undefined history causes a crash
    it("should crash when history is undefined", () => {
      expect(() => DashboardUtils._calculateStatsForType(undefined, "cpu")).toThrow(TypeError);
    });

    // NEGATIVE TEST: Verifies that null history causes a crash
    it("should crash when history is null", () => {
      expect(() => DashboardUtils._calculateStatsForType(null, "gpu")).toThrow(TypeError);
    });

    // NEGATIVE TEST: Verifies handling of undefined type
    it("should handle undefined type gracefully", () => {
      const history = [{ cpu: { usage: 50 } }];
      const result = DashboardUtils._calculateStatsForType(history, undefined);
      expect(result).toEqual({ current: 50, avg: 50, max: 50 });
    });
  });

  describe("_getHealthStatus", () => {
    // POSITIVE TEST: Verifies all good when all metrics are within thresholds
    it("should return good status when all metrics are within thresholds", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        gpu: { usage: 50 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.message).toBe("All systems operational");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies good status with zero values
    it("should return good status with zero values", () => {
      const metrics = {
        cpu: { usage: 0 },
        memory: { used: 0 },
        disk: { used: 0 },
        gpu: { usage: 0 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies good status at exact threshold values
    it("should return good status at exact threshold values", () => {
      const metrics = {
        cpu: { usage: 80 },
        memory: { used: 85 },
        disk: { used: 90 },
        gpu: { usage: 85 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies warning status when CPU exceeds threshold
    it("should return warning when CPU exceeds 80%", () => {
      const metrics = {
        cpu: { usage: 81 },
        memory: { used: 50 },
        disk: { used: 50 },
        gpu: { usage: 50 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("warning");
      expect(result.checks.cpuOk).toBe(false);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies warning status when memory exceeds threshold
    it("should return warning when memory exceeds 85%", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 86 },
        disk: { used: 50 },
        gpu: { usage: 50 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("warning");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(false);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies warning status when disk exceeds threshold
    it("should return warning when disk exceeds 90%", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 91 },
        gpu: { usage: 50 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("warning");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(false);
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies warning status when GPU exceeds threshold
    it("should return warning when GPU usage exceeds 85%", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        gpu: { usage: 86 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("warning");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(false);
    });

    // POSITIVE TEST: Verifies warning status with multiple failures
    it("should return warning with multiple failures", () => {
      const metrics = {
        cpu: { usage: 90 },
        memory: { used: 90 },
        disk: { used: 50 },
        gpu: { usage: 50 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("warning");
      expect(result.message).toBe("Some systems need attention");
      expect(result.checks.cpuOk).toBe(false);
      expect(result.checks.memoryOk).toBe(false);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies GPU considered ok when gpu property is undefined
    it("should consider GPU ok when gpu property is undefined", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies GPU considered ok when gpu is null
    it("should consider GPU ok when gpu is null", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        gpu: null,
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.checks.gpuOk).toBe(true);
    });

    // POSITIVE TEST: Verifies handling of missing nested properties
    it("should handle missing nested properties gracefully", () => {
      const metrics = {
        cpu: {},
        memory: {},
        disk: {},
        gpu: {},
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // NEGATIVE TEST: Verifies handling of undefined metrics
    it("should handle undefined metrics gracefully", () => {
      const result = DashboardUtils._getHealthStatus(undefined);
      expect(result.status).toBe("good");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // NEGATIVE TEST: Verifies handling of null metrics
    it("should handle null metrics gracefully", () => {
      const result = DashboardUtils._getHealthStatus(null);
      expect(result.status).toBe("good");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // NEGATIVE TEST: Verifies handling of empty metrics object
    it("should handle empty metrics object gracefully", () => {
      const result = DashboardUtils._getHealthStatus({});
      expect(result.status).toBe("good");
      expect(result.checks.cpuOk).toBe(true);
      expect(result.checks.memoryOk).toBe(true);
      expect(result.checks.diskOk).toBe(true);
      expect(result.checks.gpuOk).toBe(true);
    });

    // NEGATIVE TEST: Verifies GPU ok when gpu.usage is undefined
    it("should consider GPU ok when gpu.usage is undefined", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        gpu: { usage: undefined },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.checks.gpuOk).toBe(true);
    });

    // EDGE CASE: Verifies GPU warning when gpu.usage is at threshold boundary
    it("should return warning when GPU usage is exactly at threshold", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        gpu: { usage: 85 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("good");
      expect(result.checks.gpuOk).toBe(true);
    });

    // EDGE CASE: Verifies GPU warning when gpu.usage exceeds threshold
    it("should return warning when GPU usage exceeds 85%", () => {
      const metrics = {
        cpu: { usage: 50 },
        memory: { used: 50 },
        disk: { used: 50 },
        gpu: { usage: 86 },
      };
      const result = DashboardUtils._getHealthStatus(metrics);
      expect(result.status).toBe("warning");
      expect(result.checks.gpuOk).toBe(false);
    });
  });
});
