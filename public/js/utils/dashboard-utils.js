/**
 * Dashboard Utility Functions
 * Shared utilities for dashboard components
 */

function _fmtUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function _calculateStats(history) {
  if (history.length === 0) {
    return { current: 0, avg: 0, max: 0 };
  }
  const values = history.map((h) => h.cpu?.usage || 0);
  const current = values[values.length - 1] || 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  return { current, avg, max };
}

function _calculateStatsForType(history, type) {
  if (history.length === 0) {
    return { current: 0, avg: 0, max: 0 };
  }
  const values = history.map((h) => (type === "gpu" ? h.gpu?.usage || 0 : h.cpu?.usage || 0));
  const current = values[values.length - 1] || 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  return { current, avg, max };
}

function _getHealthStatus(metrics) {
  const cpuOk = (metrics?.cpu?.usage || 0) <= 80;
  const memoryOk = (metrics?.memory?.used || 0) <= 85;
  const diskOk = (metrics?.disk?.used || 0) <= 90;
  const gpuOk = !metrics?.gpu || (metrics.gpu.usage || 0) <= 85;

  if (cpuOk && memoryOk && diskOk && gpuOk) {
    return {
      status: "good",
      message: "All systems operational",
      checks: { cpuOk, memoryOk, diskOk, gpuOk },
    };
  }
  return {
    status: "warning",
    message: "Some systems need attention",
    checks: { cpuOk, memoryOk, diskOk, gpuOk },
  };
}

window.DashboardUtils = {
  _fmtUptime,
  _calculateStats,
  _calculateStatsForType,
  _getHealthStatus,
};
