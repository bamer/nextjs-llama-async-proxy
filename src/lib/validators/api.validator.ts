// Refactored api.validator.ts - now a thin wrapper re-exporting from sub-modules

// Re-export all sub-modules
export * from "./api";

// Re-export utility functions
import {
  startModelRequestSchema,
  stopModelRequestSchema,
  systemMetricsSchema,
  logEntrySchema,
} from "./api";
import type { StartModelRequest, StopModelRequest, SystemMetrics, LogEntry } from "./api";

export function parseStartModelRequest(data: unknown): StartModelRequest {
  return startModelRequestSchema.parse(data);
}

export function parseStopModelRequest(data: unknown): StopModelRequest {
  return stopModelRequestSchema.parse(data);
}

export function parseSystemMetrics(data: unknown): SystemMetrics {
  return systemMetricsSchema.parse(data);
}

export function parseLogEntry(data: unknown): LogEntry {
  return logEntrySchema.parse(data);
}

export function safeParseSystemMetrics(data: unknown) {
  return systemMetricsSchema.safeParse(data);
}
