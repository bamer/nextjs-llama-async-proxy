/**
 * Format Utilities - Simplified
 */

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

  formatTimestamp(ts) {
    return new Date(ts).toLocaleTimeString();
  },

  formatRelativeTime(ts) {
    const diff = Date.now() - ts;
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

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
};

window.FormatUtils = FormatUtils;
