/**
 * Format Utilities
 * Formatting functions for bytes, percentages, timestamps, etc.
 */

const FormatUtils = {
  /**
   * Format bytes to human readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string (e.g., "1.00 MB")
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format percentage value
   * @param {number} value - Value between 0 and 1
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage string
   */
  formatPercent(value, decimals = 1) {
    return (value * 100).toFixed(decimals) + '%';
  },

  /**
   * Format timestamp to time string
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted time string (e.g., "14:30:25")
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  },

  /**
   * Format relative time (e.g., "2h ago")
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Relative time string
   */
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

  /**
   * Format uptime in seconds to human readable
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime (e.g., "2h 30m")
   */
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

  /**
   * Format file size with appropriate unit
   * @param {number} bytes - Number of bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Format number with thousand separators
   * @param {number} num - Number to format
   * @returns {string} Formatted number with commas
   */
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Format currency (simple implementation)
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency symbol
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = '$') {
    return currency + FormatUtils.formatNumber(amount.toFixed(2));
  }
};

// Export for use in other modules
window.FormatUtils = FormatUtils;
