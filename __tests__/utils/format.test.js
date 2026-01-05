/**
 * Format Utilities Tests
 * Tests for FormatUtils - pure JavaScript, no DOM required
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Inline FormatUtils for testing (copied from public/js/utils/format.js)
const FormatUtils = {
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatPercent(value, decimals = 1) {
    return (value * 100).toFixed(decimals) + '%';
  },

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  },

  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatCurrency(amount, currency = '$') {
    return currency + FormatUtils.formatNumber(amount.toFixed(2));
  }
};

describe('FormatUtils', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(FormatUtils.formatBytes(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      expect(FormatUtils.formatBytes(512)).toBe('512 B');
    });

    it('should format kilobytes correctly', () => {
      expect(FormatUtils.formatBytes(1024)).toBe('1 KB');
      // toFixed(2) removes trailing zeros, so 1.50 becomes 1.5
      expect(FormatUtils.formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(FormatUtils.formatBytes(1024 * 1024)).toBe('1 MB');
      // toFixed(2) removes trailing zeros, so 1.50 becomes 1.5
      expect(FormatUtils.formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(FormatUtils.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format terabytes correctly', () => {
      expect(FormatUtils.formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });
  });

  describe('formatPercent', () => {
    it('should format 0 as percentage', () => {
      expect(FormatUtils.formatPercent(0)).toBe('0.0%');
    });

    it('should format 0.5 as percentage', () => {
      expect(FormatUtils.formatPercent(0.5)).toBe('50.0%');
    });

    it('should format 1 as percentage', () => {
      expect(FormatUtils.formatPercent(1)).toBe('100.0%');
    });

    it('should format with custom decimals', () => {
      expect(FormatUtils.formatPercent(0.1234, 2)).toBe('12.34%');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to time string', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = FormatUtils.formatTimestamp(date.getTime());
      // toLocaleTimeString() format is locale-dependent, just check it's a string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatRelativeTime', () => {
    it('should return Just now for recent times', () => {
      expect(FormatUtils.formatRelativeTime(Date.now() - 1000)).toBe('Just now');
    });

    it('should return minutes ago', () => {
      expect(FormatUtils.formatRelativeTime(Date.now() - 5 * 60 * 1000)).toContain('m ago');
    });

    it('should return hours ago', () => {
      expect(FormatUtils.formatRelativeTime(Date.now() - 2 * 60 * 60 * 1000)).toContain('h ago');
    });

    it('should return days ago', () => {
      expect(FormatUtils.formatRelativeTime(Date.now() - 2 * 24 * 60 * 60 * 1000)).toContain('d ago');
    });
  });

  describe('formatUptime', () => {
    it('should format seconds', () => {
      expect(FormatUtils.formatUptime(30)).toBe('30s');
    });

    it('should format minutes and seconds', () => {
      expect(FormatUtils.formatUptime(90)).toBe('1m 30s');
    });

    it('should format hours and minutes', () => {
      expect(FormatUtils.formatUptime(3660)).toBe('1h 1m');
    });

    it('should format hours only', () => {
      expect(FormatUtils.formatUptime(7200)).toBe('2h 0m');
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(FormatUtils.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(FormatUtils.formatFileSize(512)).toBe('512 Bytes');
    });

    it('should format kilobytes correctly', () => {
      // toFixed(2) removes trailing zeros
      expect(FormatUtils.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('formatNumber', () => {
    it('should format number with commas', () => {
      expect(FormatUtils.formatNumber(1000)).toBe('1,000');
      expect(FormatUtils.formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(FormatUtils.formatNumber(100)).toBe('100');
    });
  });

  describe('formatCurrency', () => {
    it('should format with default $ symbol', () => {
      expect(FormatUtils.formatCurrency(100.50)).toBe('$100.50');
    });

    it('should format with custom symbol', () => {
      expect(FormatUtils.formatCurrency(100.50, '€')).toBe('€100.50');
    });
  });
});
