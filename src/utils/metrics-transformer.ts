/**
 * Metrics transformation utilities
 * Converts legacy flat metrics format to new nested format
 */

import { SystemMetrics } from '@/types/monitoring';
import { LegacySystemMetrics } from '@/types';

/**
 * Transform legacy flat metrics to new nested format
 * @param legacyMetrics - Legacy flat metrics from WebSocket/API
 * @returns New nested metrics format
 */
export function transformMetrics(legacyMetrics: LegacySystemMetrics): SystemMetrics {
  return {
    cpu: {
      usage: legacyMetrics.cpuUsage || 0,
    },
    memory: {
      used: legacyMetrics.memoryUsage || 0,
    },
    disk: {
      used: legacyMetrics.diskUsage || 0,
    },
    network: {
      rx: 0, // Legacy format doesn't have network metrics
      tx: 0,
    },
    uptime: legacyMetrics.uptime || 0,
  };
}

/**
 * Safely transform metrics, handling null/undefined
 * @param legacyMetrics - Legacy metrics (may be null/undefined)
 * @returns Transformed metrics or default values
 */
export function safeTransformMetrics(legacyMetrics: LegacySystemMetrics | null | undefined): SystemMetrics | null {
  if (!legacyMetrics) {
    return null;
  }

  return transformMetrics(legacyMetrics);
}
