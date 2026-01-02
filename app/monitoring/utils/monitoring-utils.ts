/**
 * Monitoring utility functions for formatting and status determination
 */

export function getStatusColor(value: number, threshold: number = 80): "error" | "warning" | "success" {
  if (value > threshold) return "error";
  if (value > threshold * 0.7) return "warning";
  return "success";
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}
