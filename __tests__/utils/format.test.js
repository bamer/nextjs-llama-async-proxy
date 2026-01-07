/**
 * Format Utilities Tests
 * Tests for FormatUtils - imports from actual source file
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

// Import from actual source file
const formatPath = new URL("../../public/js/utils/format.js", import.meta.url);
const formatContent = await import(formatPath.href);
const FormatUtils = formatContent.FormatUtils || formatContent.default || formatContent;

describe("FormatUtils", () => {
  describe("formatBytes", () => {
    it("should format 0 bytes", () => {
      expect(FormatUtils.formatBytes(0)).toBe("0 B");
    });

    it("should format 1 byte at boundary", () => {
      expect(FormatUtils.formatBytes(1)).toBe("1 B");
    });

    it("should format bytes correctly", () => {
      expect(FormatUtils.formatBytes(512)).toBe("512 B");
    });

    it("should format exactly 1024 bytes as 1 KB", () => {
      expect(FormatUtils.formatBytes(1024)).toBe("1 KB");
    });

    it("should format kilobytes correctly with trailing zeros removed", () => {
      expect(FormatUtils.formatBytes(1536)).toBe("1.5 KB");
    });

    it("should format 2048 bytes as 2 KB", () => {
      expect(FormatUtils.formatBytes(2048)).toBe("2 KB");
    });

    it("should format megabytes correctly", () => {
      expect(FormatUtils.formatBytes(1024 * 1024)).toBe("1 MB");
    });

    it("should format 1.5 MB correctly", () => {
      expect(FormatUtils.formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
    });

    it("should format gigabytes correctly", () => {
      expect(FormatUtils.formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should format terabytes correctly", () => {
      expect(FormatUtils.formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
    });

    it("should handle very large numbers (petabytes range)", () => {
      const pb = 1024 * 1024 * 1024 * 1024 * 1024;
      expect(FormatUtils.formatBytes(pb)).toBe("1 PB");
    });

    it("should handle negative values (returns NaN)", () => {
      const result = FormatUtils.formatBytes(-100);
      expect(result).toContain("NaN");
    });
  });

  describe("formatPercent", () => {
    it("should format 0 as percentage with default 1 decimal", () => {
      expect(FormatUtils.formatPercent(0)).toBe("0.0%");
    });

    it("should format 0 with 0 decimals", () => {
      expect(FormatUtils.formatPercent(0, 0)).toBe("0%");
    });

    it("should format 0 with 2 decimals", () => {
      expect(FormatUtils.formatPercent(0, 2)).toBe("0.00%");
    });

    it("should format 0.5 as 50%", () => {
      expect(FormatUtils.formatPercent(0.5)).toBe("50.0%");
    });

    it("should format 1 as 100%", () => {
      expect(FormatUtils.formatPercent(1)).toBe("100.0%");
    });

    it("should format 1 with 0 decimals as 100%", () => {
      expect(FormatUtils.formatPercent(1, 0)).toBe("100%");
    });

    it("should format 1 with 2 decimals as 100.00%", () => {
      expect(FormatUtils.formatPercent(1, 2)).toBe("100.00%");
    });

    it("should format values greater than 1", () => {
      expect(FormatUtils.formatPercent(1.5)).toBe("150.0%");
      expect(FormatUtils.formatPercent(2)).toBe("200.0%");
    });

    it("should format with custom decimals", () => {
      expect(FormatUtils.formatPercent(0.1234, 2)).toBe("12.34%");
    });

    it("should format with 4 decimal places", () => {
      expect(FormatUtils.formatPercent(0.12345, 4)).toBe("12.3450%");
    });

    it("should format very small values", () => {
      expect(FormatUtils.formatPercent(0.001)).toBe("0.1%");
    });

    it("should format negative values", () => {
      expect(FormatUtils.formatPercent(-0.5)).toBe("-50.0%");
      expect(FormatUtils.formatPercent(-1)).toBe("-100.0%");
    });

    it("should handle null value", () => {
      const result = FormatUtils.formatPercent(null);
      expect(result).toContain("NaN");
    });

    it("should handle undefined value", () => {
      const result = FormatUtils.formatPercent(undefined);
      expect(result).toContain("NaN");
    });
  });

  describe("formatTimestamp", () => {
    it("should format timestamp to time string", () => {
      const date = new Date("2024-01-15T14:30:00");
      const result = FormatUtils.formatTimestamp(date.getTime());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format 0 timestamp", () => {
      const result = FormatUtils.formatTimestamp(0);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format current time", () => {
      const result = FormatUtils.formatTimestamp(Date.now());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format future timestamp", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = FormatUtils.formatTimestamp(futureDate.getTime());
      expect(typeof result).toBe("string");
    });

    it("should format past timestamp", () => {
      const result = FormatUtils.formatTimestamp(1000000);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatRelativeTime", () => {
    it("should return 'Just now' for current time", () => {
      const now = Date.now();
      expect(FormatUtils.formatRelativeTime(now)).toBe("Just now");
    });

    it("should format 30 seconds ago", () => {
      const thirtySecondsAgo = Date.now() - 30000;
      expect(FormatUtils.formatRelativeTime(thirtySecondsAgo)).toBe("Just now");
    });

    it("should format 1 minute ago", () => {
      const oneMinuteAgo = Date.now() - 60000;
      expect(FormatUtils.formatRelativeTime(oneMinuteAgo)).toBe("1m ago");
    });

    it("should format 5 minutes ago", () => {
      const fiveMinutesAgo = Date.now() - 300000;
      expect(FormatUtils.formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should format 59 minutes ago", () => {
      const fiftyNineMinutesAgo = Date.now() - 59 * 60 * 1000;
      expect(FormatUtils.formatRelativeTime(fiftyNineMinutesAgo)).toBe("59m ago");
    });

    it("should format 1 hour ago", () => {
      const oneHourAgo = Date.now() - 3600000;
      expect(FormatUtils.formatRelativeTime(oneHourAgo)).toBe("1h ago");
    });

    it("should format 2 hours ago", () => {
      const twoHoursAgo = Date.now() - 7200000;
      expect(FormatUtils.formatRelativeTime(twoHoursAgo)).toBe("2h ago");
    });

    it("should format 23 hours ago", () => {
      const twentyThreeHoursAgo = Date.now() - 23 * 3600000;
      expect(FormatUtils.formatRelativeTime(twentyThreeHoursAgo)).toBe("23h ago");
    });

    it("should format 1 day ago", () => {
      const oneDayAgo = Date.now() - 86400000;
      expect(FormatUtils.formatRelativeTime(oneDayAgo)).toBe("1d ago");
    });

    it("should format 7 days ago", () => {
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      expect(FormatUtils.formatRelativeTime(sevenDaysAgo)).toBe("7d ago");
    });

    it("should format 365 days ago", () => {
      const oneYearAgo = Date.now() - 365 * 86400000;
      expect(FormatUtils.formatRelativeTime(oneYearAgo)).toBe("365d ago");
    });
  });

  describe("formatUptime", () => {
    it("should format 0 seconds", () => {
      expect(FormatUtils.formatUptime(0)).toBe("0s");
    });

    it("should format seconds only", () => {
      expect(FormatUtils.formatUptime(30)).toBe("30s");
    });

    it("should format 1 second", () => {
      expect(FormatUtils.formatUptime(1)).toBe("1s");
    });

    it("should format 59 seconds", () => {
      expect(FormatUtils.formatUptime(59)).toBe("59s");
    });

    it("should format minutes and seconds", () => {
      expect(FormatUtils.formatUptime(90)).toBe("1m 30s");
    });

    it("should format 1 minute", () => {
      expect(FormatUtils.formatUptime(60)).toBe("1m 0s");
    });

    it("should format 59 minutes and 59 seconds", () => {
      expect(FormatUtils.formatUptime(59 * 60 + 59)).toBe("59m 59s");
    });

    it("should format hours and minutes", () => {
      expect(FormatUtils.formatUptime(3660)).toBe("1h 1m");
    });

    it("should format 1 hour", () => {
      expect(FormatUtils.formatUptime(3600)).toBe("1h 0m");
    });

    it("should format 2 hours", () => {
      expect(FormatUtils.formatUptime(7200)).toBe("2h 0m");
    });

    it("should format hours with non-zero minutes", () => {
      expect(FormatUtils.formatUptime(7261)).toBe("2h 1m");
    });

    it("should format 23 hours 59 minutes", () => {
      expect(FormatUtils.formatUptime(23 * 3600 + 59 * 60)).toBe("23h 59m");
    });

    it("should handle negative values", () => {
      const result = FormatUtils.formatUptime(-100);
      expect(result).toContain("-");
    });
  });

  describe("formatNumber", () => {
    it("should format 0", () => {
      expect(FormatUtils.formatNumber(0)).toBe("0");
    });

    it("should format number with commas", () => {
      expect(FormatUtils.formatNumber(1000)).toBe("1,000");
      expect(FormatUtils.formatNumber(1000000)).toBe("1,000,000");
    });

    it("should handle small numbers", () => {
      expect(FormatUtils.formatNumber(100)).toBe("100");
      expect(FormatUtils.formatNumber(99)).toBe("99");
    });

    it("should format negative numbers", () => {
      expect(FormatUtils.formatNumber(-1000)).toBe("-1,000");
      expect(FormatUtils.formatNumber(-1000000)).toBe("-1,000,000");
    });

    it("should format numbers with decimals", () => {
      expect(FormatUtils.formatNumber(1234.56)).toBe("1,234.56");
    });

    it("should format very large numbers", () => {
      expect(FormatUtils.formatNumber(1000000000)).toBe("1,000,000,000");
    });

    it("should format 1", () => {
      expect(FormatUtils.formatNumber(1)).toBe("1");
    });

    it("should format 10", () => {
      expect(FormatUtils.formatNumber(10)).toBe("10");
    });

    it("should format 100", () => {
      expect(FormatUtils.formatNumber(100)).toBe("100");
    });

    it("should format 1000 with comma", () => {
      expect(FormatUtils.formatNumber(1000)).toBe("1,000");
    });
  });
});
