/**
 * Centralized type definitions for logging
 * Extracted from src/hooks/useLoggerConfig.ts, src/lib/logger.ts, and src/types/global.d.ts
 */

export interface LoggerConfig {
  level: "debug" | "info" | "warn" | "error";
  format: "json" | "text";
  maxFiles: number;
  maxSize: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
}

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string | Record<string, unknown>;
  timestamp: string;
  source?: string;
  context?: Record<string, unknown>;
}

export interface LogFilter {
  level?: LogEntry["level"];
  source?: string;
  search?: string;
  startTime?: string;
  endTime?: string;
}

export interface LogPagination {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface LogQuery extends LogFilter {
  pagination?: LogPagination;
  sortBy?: keyof LogEntry;
  sortOrder?: "asc" | "desc";
}

export interface LogLevelCounts {
  debug: number;
  info: number;
  warn: number;
  error: number;
}

export interface LogStats {
  total: number;
  byLevel: LogLevelCounts;
  timeRange: {
    earliest: string;
    latest: string;
  };
}
