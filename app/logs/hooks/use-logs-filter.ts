import { useState, useCallback } from "react";

export interface LogsFilterState {
  searchTerm: string;
  selectedLevels: Set<string>;
}

export interface LogsFilterActions {
  setSearchTerm: (term: string) => void;
  setSelectedLevels: (levels: Set<string>) => void;
}

/**
 * Extract message string from log entry (handles various formats)
 */
export function extractLogMessage(log: {
  message: string | Record<string, unknown>;
}): string {
  if (typeof log.message === "string") {
    return log.message;
  }
  if (typeof log.message === "object" && log.message !== null) {
    const msg = log.message as Record<string, unknown>;
    if (msg.message && typeof msg.message === "string") {
      return msg.message;
    }
    if (msg.error && typeof msg.error === "string") {
      return msg.error;
    }
    if (msg.text && typeof msg.text === "string") {
      return msg.text;
    }
  }
  return String(log.message || "");
}

/**
 * Extract source from log context
 */
export function extractLogSource(log: { context?: { source?: string } }): string {
  return typeof log.context?.source === "string" ? log.context.source : "";
}

/**
 * Filter logs based on search term and log levels
 */
export function filterLogs(
  logs: Array<{
    level?: string;
    message: string | Record<string, unknown>;
    context?: { source?: string };
  }>,
  searchTerm: string,
  selectedLevels: Set<string>
): Array<{
  level?: string;
  message: string | Record<string, unknown>;
  context?: { source?: string };
}> {
  return logs.filter((log) => {
    const messageStr = extractLogMessage(log);
    const source = extractLogSource(log);

    const matchesSearch =
      searchTerm === "" ||
      messageStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.toLowerCase().includes(searchTerm.toLowerCase());

    // Normalize log level to lowercase for comparison
    const logLevel = log.level?.toLowerCase() || "info";
    const matchesLevel = selectedLevels.has(logLevel);

    return matchesSearch && matchesLevel;
  });
}

/**
 * Get paginated logs from filtered logs
 */
export function getPaginatedLogs<T>(logs: T[], page: number, logsPerPage: number): T[] {
  return logs.slice((page - 1) * logsPerPage, page * logsPerPage);
}

/**
 * Hook for logs filtering logic
 */
export function useLogsFilters() {
  const [filterState, setFilterState] = useState<LogsFilterState>({
    searchTerm: "",
    selectedLevels: new Set(["error", "warn", "info", "debug"]),
  });

  const filterActions = {
    setSearchTerm: (term: string) => {
      setFilterState((prev) => ({ ...prev, searchTerm: term }));
    },
    setSelectedLevels: (levels: Set<string>) => {
      setFilterState((prev) => ({ ...prev, selectedLevels: levels }));
    },
  };

  return {
    filterState,
    filterActions,
  };
}
