/**
 * Download logs as JSON file
 * @param logs - Logs to download
 */
export function downloadLogsAsJson(logs: unknown[]): void {
  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `logs-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get status message based on logs state
 * @param logs - All logs
 * @param hasLoadedLogs - Whether logs have been loaded
 * @param selectedLevels - Currently selected log levels
 * @returns Status message string
 */
export function getLogsStatusMessage(
  logs: unknown[],
  hasLoadedLogs: boolean,
  selectedLevels: Set<string>
): string {
  if (selectedLevels.size === 0) {
    return "No log levels selected";
  }
  if (logs.length === 0) {
    return hasLoadedLogs ? "No logs available" : "Loading logs...";
  }
  return "";
}
