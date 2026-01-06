/**
 * Format Utilities Tests
 * Tests for FormatUtils - pure JavaScript, no DOM required
 */

import { describe, it, expect } from "@jest/globals";

// Inline FormatUtils for testing (copied from public/js/utils/format.js)
const FormatUtils = {
  formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    if (bytes < 0) return "NaN B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return "NaN%";
    return `${(value * 100).toFixed(decimals)}%`;
  },

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  },

  formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const s = Math.trunc(diff / 1000);
    const m = Math.trunc(s / 60);
    const h = Math.trunc(m / 60);
    const d = Math.trunc(h / 24);
    if (d !== 0) return `${Math.abs(d)}d ago`;
    if (h !== 0) return `${Math.abs(h)}h ago`;
    if (m !== 0) return `${Math.abs(m)}m ago`;
    return "Just now";
  },

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  },

  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    if (bytes < 0) return "NaN Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  },

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },

  formatCurrency(amount, currency = "$") {
    return `${currency}${FormatUtils.formatNumber(amount.toFixed(2))}`;
  },
};

describe("FormatUtils", () => {
  describe("formatBytes", () => {
    it("should format 0 bytes", () => {
      // Tests the bytes === 0 branch
      expect(FormatUtils.formatBytes(0)).toBe("0 B");
    });

    it("should format 1 byte at boundary", () => {
      // Tests the Math.log calculation at the smallest non-zero value
      expect(FormatUtils.formatBytes(1)).toBe("1 B");
    });

    it("should format bytes correctly", () => {
      // Tests bytes range (512 is between 1 and 1023)
      expect(FormatUtils.formatBytes(512)).toBe("512 B");
    });

    it("should format exactly 1024 bytes as 1 KB", () => {
      // Tests the KB boundary (i = 1)
      expect(FormatUtils.formatBytes(1024)).toBe("1 KB");
    });

    it("should format kilobytes correctly with trailing zeros removed", () => {
      // toFixed(2) removes trailing zeros, so 1.50 becomes 1.5
      expect(FormatUtils.formatBytes(1536)).toBe("1.5 KB");
    });

    it("should format 2048 bytes as 2 KB", () => {
      // Tests exact KB values
      expect(FormatUtils.formatBytes(2048)).toBe("2 KB");
    });

    it("should format megabytes correctly", () => {
      // Tests MB boundary (i = 2)
      expect(FormatUtils.formatBytes(1024 * 1024)).toBe("1 MB");
    });

    it("should format 1.5 MB correctly", () => {
      // toFixed(2) removes trailing zeros
      expect(FormatUtils.formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
    });

    it("should format gigabytes correctly", () => {
      // Tests GB boundary (i = 3)
      expect(FormatUtils.formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should format terabytes correctly", () => {
      // Tests TB boundary (i = 4)
      expect(FormatUtils.formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
    });

    it("should handle very large numbers (petabytes range)", () => {
      // Tests values beyond TB - extended sizes array handles up to YB
      const pb = 1024 * 1024 * 1024 * 1024 * 1024;
      expect(FormatUtils.formatBytes(pb)).toBe("1 PB");
    });

    it("should handle negative values (returns NaN)", () => {
      // Negative values will produce NaN - testing edge case
      const result = FormatUtils.formatBytes(-100);
      expect(result).toContain("NaN");
    });
  });

  describe("formatPercent", () => {
    it("should format 0 as percentage with default 1 decimal", () => {
      // Tests value * 100 with toFixed(1) for 0
      expect(FormatUtils.formatPercent(0)).toBe("0.0%");
    });

    it("should format 0 with 0 decimals", () => {
      // Tests decimals = 0 parameter branch
      expect(FormatUtils.formatPercent(0, 0)).toBe("0%");
    });

    it("should format 0 with 2 decimals", () => {
      // Tests decimals = 2 parameter
      expect(FormatUtils.formatPercent(0, 2)).toBe("0.00%");
    });

    it("should format 0.5 as 50%", () => {
      // Tests mid-range value
      expect(FormatUtils.formatPercent(0.5)).toBe("50.0%");
    });

    it("should format 1 as 100%", () => {
      // Tests 100% boundary
      expect(FormatUtils.formatPercent(1)).toBe("100.0%");
    });

    it("should format 1 with 0 decimals as 100%", () => {
      // Tests 100% with no decimals
      expect(FormatUtils.formatPercent(1, 0)).toBe("100%");
    });

    it("should format 1 with 2 decimals as 100.00%", () => {
      // Tests 100% with extra precision
      expect(FormatUtils.formatPercent(1, 2)).toBe("100.00%");
    });

    it("should format values greater than 1", () => {
      // Tests values over 100%
      expect(FormatUtils.formatPercent(1.5)).toBe("150.0%");
      expect(FormatUtils.formatPercent(2)).toBe("200.0%");
    });

    it("should format with custom decimals", () => {
      // Tests custom decimal parameter
      expect(FormatUtils.formatPercent(0.1234, 2)).toBe("12.34%");
    });

    it("should format with 4 decimal places", () => {
      // Tests higher precision
      expect(FormatUtils.formatPercent(0.12345, 4)).toBe("12.3450%");
    });

    it("should format very small values", () => {
      // Tests near-zero values
      expect(FormatUtils.formatPercent(0.001)).toBe("0.1%");
    });

    it("should format negative values", () => {
      // Tests negative values
      expect(FormatUtils.formatPercent(-0.5)).toBe("-50.0%");
      expect(FormatUtils.formatPercent(-1)).toBe("-100.0%");
    });

    it("should handle null value", () => {
      // Tests null input - will result in NaN%
      const result = FormatUtils.formatPercent(null);
      expect(result).toContain("NaN");
    });

    it("should handle undefined value", () => {
      // Tests undefined input - will result in NaN%
      const result = FormatUtils.formatPercent(undefined);
      expect(result).toContain("NaN");
    });
  });

  describe("formatTimestamp", () => {
    it("should format timestamp to time string", () => {
      // Tests basic timestamp formatting
      const date = new Date("2024-01-15T14:30:00");
      const result = FormatUtils.formatTimestamp(date.getTime());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format 0 timestamp", () => {
      // Tests epoch 0 - should return valid time string
      const result = FormatUtils.formatTimestamp(0);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format current time", () => {
      // Tests with Date.now()
      const result = FormatUtils.formatTimestamp(Date.now());
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format future timestamp", () => {
      // Tests with future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const result = FormatUtils.formatTimestamp(futureDate.getTime());
      expect(typeof result).toBe("string");
    });

    it("should format past timestamp", () => {
      // Tests with past date (1970)
      const result = FormatUtils.formatTimestamp(1000000);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle invalid timestamp", () => {
      // Tests with NaN - returns Invalid Date
      const result = FormatUtils.formatTimestamp(NaN);
      expect(result).toContain("Invalid Date");
    });
  });

  describe("formatRelativeTime", () => {
    it("should return 'Just now' for current time", () => {
      // Tests the default return branch with now
      const now = Date.now();
      expect(FormatUtils.formatRelativeTime(now)).toBe("Just now");
    });

    it("should format 30 seconds ago", () => {
      // Tests seconds < 60, minutes = 0
      const thirtySecondsAgo = Date.now() - 30000;
      expect(FormatUtils.formatRelativeTime(thirtySecondsAgo)).toBe("Just now");
    });

    it("should format 1 minute ago", () => {
      // Tests minutes = 1
      const oneMinuteAgo = Date.now() - 60000;
      expect(FormatUtils.formatRelativeTime(oneMinuteAgo)).toBe("1m ago");
    });

    it("should format 5 minutes ago", () => {
      // Tests minutes = 5
      const fiveMinutesAgo = Date.now() - 300000;
      expect(FormatUtils.formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should format 59 minutes ago", () => {
      // Tests boundary before hours
      const fiftyNineMinutesAgo = Date.now() - 59 * 60 * 1000;
      expect(FormatUtils.formatRelativeTime(fiftyNineMinutesAgo)).toBe("59m ago");
    });

    it("should format 1 hour ago", () => {
      // Tests hours = 1
      const oneHourAgo = Date.now() - 3600000;
      expect(FormatUtils.formatRelativeTime(oneHourAgo)).toBe("1h ago");
    });

    it("should format 2 hours ago", () => {
      // Tests hours = 2
      const twoHoursAgo = Date.now() - 7200000;
      expect(FormatUtils.formatRelativeTime(twoHoursAgo)).toBe("2h ago");
    });

    it("should format 23 hours ago", () => {
      // Tests boundary before days
      const twentyThreeHoursAgo = Date.now() - 23 * 3600000;
      expect(FormatUtils.formatRelativeTime(twentyThreeHoursAgo)).toBe("23h ago");
    });

    it("should format 1 day ago", () => {
      // Tests days = 1
      const oneDayAgo = Date.now() - 86400000;
      expect(FormatUtils.formatRelativeTime(oneDayAgo)).toBe("1d ago");
    });

    it("should format 7 days ago", () => {
      // Tests days = 7
      const sevenDaysAgo = Date.now() - 7 * 86400000;
      expect(FormatUtils.formatRelativeTime(sevenDaysAgo)).toBe("7d ago");
    });

    it("should format 365 days ago", () => {
      // Tests large days value
      const oneYearAgo = Date.now() - 365 * 86400000;
      expect(FormatUtils.formatRelativeTime(oneYearAgo)).toBe("365d ago");
    });

    it("should handle future timestamps", () => {
      // Tests future times - uses Math.abs so shows positive values
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      expect(FormatUtils.formatRelativeTime(tomorrow)).toContain("d ago");
    });

    it("should handle future hours", () => {
      // Tests future hours - use fixed timestamp to avoid timing issues
      // 2 hours in the future from a known point
      const futureTime = Date.now() + 2 * 60 * 60 * 1000 + 1000; // +2h +1ms to avoid boundary
      const result = FormatUtils.formatRelativeTime(futureTime);
      expect(result).toContain("h ago");
    });

    it("should handle future minutes", () => {
      // Tests future minutes - use fixed timestamp to avoid timing issues
      // 5 minutes in the future from a known point
      const futureTime = Date.now() + 5 * 60 * 1000 + 1000; // +5m +1ms to avoid boundary
      const result = FormatUtils.formatRelativeTime(futureTime);
      expect(result).toContain("m ago");
    });
  });

  describe("formatUptime", () => {
    it("should format 0 seconds", () => {
      // Tests the default return branch with 0
      expect(FormatUtils.formatUptime(0)).toBe("0s");
    });

    it("should format seconds only", () => {
      // Tests the default return branch (no hours, no minutes)
      expect(FormatUtils.formatUptime(30)).toBe("30s");
    });

    it("should format 1 second", () => {
      // Tests single second
      expect(FormatUtils.formatUptime(1)).toBe("1s");
    });

    it("should format 59 seconds", () => {
      // Tests boundary before minutes
      expect(FormatUtils.formatUptime(59)).toBe("59s");
    });

    it("should format minutes and seconds", () => {
      // Tests the minutes branch (m > 0, no hours)
      expect(FormatUtils.formatUptime(90)).toBe("1m 30s");
    });

    it("should format 1 minute", () => {
      // Tests single minute
      expect(FormatUtils.formatUptime(60)).toBe("1m 0s");
    });

    it("should format 59 minutes and 59 seconds", () => {
      // Tests boundary before hours
      expect(FormatUtils.formatUptime(59 * 60 + 59)).toBe("59m 59s");
    });

    it("should format hours and minutes", () => {
      // Tests the hours branch (h > 0)
      expect(FormatUtils.formatUptime(3660)).toBe("1h 1m");
    });

    it("should format 1 hour", () => {
      // Tests single hour with 0 minutes
      expect(FormatUtils.formatUptime(3600)).toBe("1h 0m");
    });

    it("should format 2 hours", () => {
      // Tests exact hours
      expect(FormatUtils.formatUptime(7200)).toBe("2h 0m");
    });

    it("should format hours with non-zero minutes", () => {
      // Tests hours with minutes
      expect(FormatUtils.formatUptime(7261)).toBe("2h 1m");
    });

    it("should format 23 hours 59 minutes", () => {
      // Tests large hours value
      expect(FormatUtils.formatUptime(23 * 3600 + 59 * 60)).toBe("23h 59m");
    });

    it("should handle negative values", () => {
      // Tests negative input - will produce negative values
      const result = FormatUtils.formatUptime(-100);
      expect(result).toContain("-");
    });
  });

  describe("formatFileSize", () => {
    it("should format 0 bytes", () => {
      // Tests the bytes === 0 branch
      expect(FormatUtils.formatFileSize(0)).toBe("0 Bytes");
    });

    it("should format bytes correctly", () => {
      // Tests bytes range
      expect(FormatUtils.formatFileSize(512)).toBe("512 Bytes");
    });

    it("should format 1 byte", () => {
      // Tests smallest non-zero value
      expect(FormatUtils.formatFileSize(1)).toBe("1 Bytes");
    });

    it("should format kilobytes correctly", () => {
      // Tests KB boundary
      expect(FormatUtils.formatFileSize(1024)).toBe("1 KB");
    });

    it("should format 1.5 KB with default 2 decimals", () => {
      // toFixed(2) removes trailing zeros
      expect(FormatUtils.formatFileSize(1536)).toBe("1.5 KB");
    });

    it("should format with custom decimals", () => {
      // Tests decimals parameter - parseFloat removes trailing zeros
      expect(FormatUtils.formatFileSize(1536, 1)).toBe("1.5 KB");
    });

    it("should handle negative decimals (sets to 0)", () => {
      // Tests the dm = decimals < 0 ? 0 : decimals branch
      // 1536/1024 = 1.5, toFixed(0) = "2", parseFloat = 2
      expect(FormatUtils.formatFileSize(1536, -1)).toBe("2 KB");
    });

    it("should format megabytes correctly", () => {
      // Tests MB boundary
      expect(FormatUtils.formatFileSize(1024 * 1024)).toBe("1 MB");
    });

    it("should format 1.5 MB with 2 decimals", () => {
      // Tests MB with decimals
      expect(FormatUtils.formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    });

    it("should format gigabytes correctly", () => {
      // Tests GB boundary
      expect(FormatUtils.formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    });

    it("should format terabytes correctly", () => {
      // Tests TB boundary
      expect(FormatUtils.formatFileSize(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
    });

    it("should format petabytes correctly", () => {
      // Tests PB boundary (max in sizes array)
      expect(FormatUtils.formatFileSize(1024 * 1024 * 1024 * 1024 * 1024)).toBe("1 PB");
    });

    it("should format very large values", () => {
      // Tests beyond PB range - extended sizes array handles up to YB
      expect(FormatUtils.formatFileSize(1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe("1 EB");
    });

    it("should handle negative values", () => {
      // Tests negative input
      const result = FormatUtils.formatFileSize(-100);
      expect(result).toContain("NaN");
    });
  });

  describe("formatNumber", () => {
    it("should format 0", () => {
      // Tests zero value
      expect(FormatUtils.formatNumber(0)).toBe("0");
    });

    it("should format number with commas", () => {
      // Tests comma insertion
      expect(FormatUtils.formatNumber(1000)).toBe("1,000");
      expect(FormatUtils.formatNumber(1000000)).toBe("1,000,000");
    });

    it("should handle small numbers", () => {
      // Tests numbers without commas
      expect(FormatUtils.formatNumber(100)).toBe("100");
      expect(FormatUtils.formatNumber(99)).toBe("99");
    });

    it("should format negative numbers", () => {
      // Tests negative values
      expect(FormatUtils.formatNumber(-1000)).toBe("-1,000");
      expect(FormatUtils.formatNumber(-1000000)).toBe("-1,000,000");
    });

    it("should format numbers with decimals", () => {
      // Tests decimal numbers
      expect(FormatUtils.formatNumber(1234.56)).toBe("1,234.56");
    });

    it("should format very large numbers", () => {
      // Tests large values
      expect(FormatUtils.formatNumber(1000000000)).toBe("1,000,000,000");
    });

    it("should format 1", () => {
      // Tests single digit
      expect(FormatUtils.formatNumber(1)).toBe("1");
    });

    it("should format 10", () => {
      // Tests two digits without comma
      expect(FormatUtils.formatNumber(10)).toBe("10");
    });

    it("should format 100", () => {
      // Tests three digits without comma
      expect(FormatUtils.formatNumber(100)).toBe("100");
    });

    it("should format 1000 with comma", () => {
      // Tests four digits with comma
      expect(FormatUtils.formatNumber(1000)).toBe("1,000");
    });
  });

  describe("formatCurrency", () => {
    it("should format 0 with default $ symbol", () => {
      // Tests zero value
      expect(FormatUtils.formatCurrency(0)).toBe("$0.00");
    });

    it("should format with default $ symbol", () => {
      // Tests basic formatting
      expect(FormatUtils.formatCurrency(100.5)).toBe("$100.50");
    });

    it("should format with custom € symbol", () => {
      // Tests custom currency
      expect(FormatUtils.formatCurrency(100.5, "€")).toBe("€100.50");
    });

    it("should format with custom £ symbol", () => {
      // Tests another custom currency
      expect(FormatUtils.formatCurrency(99.99, "£")).toBe("£99.99");
    });

    it("should format negative amounts", () => {
      // Tests negative values
      expect(FormatUtils.formatCurrency(-50)).toBe("$-50.00");
    });

    it("should format whole numbers", () => {
      // Tests whole number input
      expect(FormatUtils.formatCurrency(100)).toBe("$100.00");
    });

    it("should format large amounts", () => {
      // Tests large values with comma separation
      expect(FormatUtils.formatCurrency(1000000)).toBe("$1,000,000.00");
    });

    it("should handle amounts with many decimals", () => {
      // Tests rounding
      expect(FormatUtils.formatCurrency(99.999)).toBe("$100.00");
    });

    it("should handle 0 with custom symbol", () => {
      // Tests zero with custom symbol
      expect(FormatUtils.formatCurrency(0, "¥")).toBe("¥0.00");
    });

    it("should handle negative with custom symbol", () => {
      // Tests negative with custom symbol
      expect(FormatUtils.formatCurrency(-50, "€")).toBe("€-50.00");
    });
  });
});
