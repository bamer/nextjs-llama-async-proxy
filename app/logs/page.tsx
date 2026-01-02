"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { useStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/use-websocket";
import { useEffect, useState, useRef } from "react";
import { Typography, Box } from "@mui/material";
import { MultiSelectOption } from "@/components/ui";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LogsFallback } from "@/components/ui/error-fallbacks";
import { LogsFilters } from "./components/LogsFilters";
import { LogsControls } from "./components/LogsControls";
import { LogsTable } from "./components/LogsTable";
import {
  useLogsFilters,
  filterLogs,
  getPaginatedLogs,
} from "./hooks/use-logs-filter";
import {
  downloadLogsAsJson,
  getLogsStatusMessage,
} from "./utils/logs-utils";


const LOGS_PER_PAGE = 20;

const logLevelOptions: MultiSelectOption[] = [
  { value: "error", label: "Error", color: "#f44336" },
  { value: "warn", label: "Warning", color: "#ff9800" },
  { value: "info", label: "Info", color: "#2196f3" },
  { value: "debug", label: "Debug", color: "#4caf50" },
];

export default function LogsPage() {
  const logs = useStore((state) => state.logs);
  const { requestLogs, isConnected } = useWebSocket();
  const [page, setPage] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoadedLogs, setHasLoadedLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { filterState, filterActions } = useLogsFilters();

  // Derive page key from filters to auto-reset when they change
  const pageKey = `${filterState.searchTerm}-${Array.from(filterState.selectedLevels).join(",")}`;

  // Reset page when filters change using the key pattern
  // Note: This is a valid use case for calling setState in effect
  // to reset page when filters change, as there's no better alternative
  // without modifying the filter handlers in useLogsFilters hook
  const prevPageKeyRef = useRef(pageKey);
  useEffect(() => {
    if (prevPageKeyRef.current !== pageKey) {
      prevPageKeyRef.current = pageKey;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(1);
    }
  }, [pageKey]);

  // Request logs on mount and periodically to ensure fresh data
  useEffect(() => {
    const loadLogs = () => {
      if (isConnected) {
        requestLogs();
        setIsInitialLoad(false);
        setHasLoadedLogs(true);
        return undefined;
      }
      // Try again after a delay if not connected yet
      if (isInitialLoad) {
        const retryTimer = setTimeout(() => {
          setIsInitialLoad(false); // Always mark initial load as complete after retry attempt
          if (isConnected) {
            requestLogs();
            setHasLoadedLogs(true);
          } else if (!isConnected && logs.length === 0) {
            // Connection failed, mark as attempted
            setHasLoadedLogs(true);
          }
        }, 1000);
        return () => clearTimeout(retryTimer);
      }
      return undefined;
    };

    const cleanup = loadLogs();
    return cleanup;
  }, [isConnected, requestLogs, isInitialLoad, logs.length]);

  // Refresh logs every 15 seconds to keep data current
  useEffect(() => {
    if (!isConnected) {
      return undefined;
    }

    const refreshInterval = setInterval(() => {
      requestLogs();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, [isConnected, requestLogs]);

  // Filter logs
  const filteredLogs = filterLogs(
    logs,
    filterState.searchTerm,
    filterState.selectedLevels
  );

  // Paginate logs
  const paginatedLogs = getPaginatedLogs(filteredLogs, page, LOGS_PER_PAGE);

  const handleClearLogs = () => {
    useStore.getState().clearLogs();
    setHasLoadedLogs(false);
  };

  const handleRefresh = () => {
    if (isConnected) {
      setRefreshing(true);
      requestLogs();
      setHasLoadedLogs(true);
      setTimeout(() => setRefreshing(false), 800);
    } else {
      console.warn("Cannot refresh logs: WebSocket not connected");
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    downloadLogsAsJson(filteredLogs);
    setTimeout(() => setDownloading(false), 800);
  };

  const getStatusMessage = () => {
    return getLogsStatusMessage(logs, hasLoadedLogs, filterState.selectedLevels);
  };

  return (
    <MainLayout>
      <ErrorBoundary fallback={<LogsFallback />}>
        <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold">
              Logs
            </Typography>
          </Box>

          <LogsFilters
            searchTerm={filterState.searchTerm}
            setSearchTerm={filterActions.setSearchTerm}
            selectedLevels={filterState.selectedLevels}
            setSelectedLevels={filterActions.setSelectedLevels}
            logLevelOptions={logLevelOptions}
          />

          <LogsControls
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onClear={handleClearLogs}
            downloading={downloading}
            onDownload={handleDownload}
          />

          <LogsTable
            filteredLogs={filteredLogs}
            paginatedLogs={paginatedLogs}
            page={page}
            setPage={setPage}
            logsPerPage={LOGS_PER_PAGE}
            isInitialLoad={isInitialLoad}
            hasLoadedLogs={hasLoadedLogs}
            isConnected={isConnected}
            getStatusMessage={getStatusMessage}
          />
        </Box>
      </ErrorBoundary>
    </MainLayout>
  );
}
