"use client";

import { useState, useEffect, useMemo, useEffectEvent as ReactUseEffectEvent } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useStore } from "@/lib/store";
import type { AppStore } from "@/lib/store/types";
import { TextField, MenuItem, Button, Box, Typography } from "@mui/material";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";

const LogsPage = () => {
  const { requestLogs, isConnected } = useWebSocket();
  const logs = useStore((state: AppStore) => state.logs);
  const [filterText, setFilterText] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [maxLines, setMaxLines] = useState(50);

  const requestLogsIfConnected = ReactUseEffectEvent(() => {
    if (isConnected) requestLogs();
  });

  useEffect(() => {
    requestLogsIfConnected();
  }, [isConnected, requestLogsIfConnected]);

  const filteredLogs = useMemo(
    () =>
      logs
        .filter((log: any) => {
          const source = log.source || (typeof log.context?.source === "string" ? log.context.source : "application");
          const messageText = typeof log.message === "string" ? log.message : JSON.stringify(log.message);
          const trimmedFilterText = filterText.trim();
          const matchesText = trimmedFilterText === "" || messageText.toLowerCase().includes(trimmedFilterText.toLowerCase()) || source.toLowerCase().includes(trimmedFilterText.toLowerCase());
          const matchesLevel = selectedLevel === "all" || log.level === selectedLevel;
          return matchesText && matchesLevel;
        })
        .slice(0, maxLines),
    [logs, filterText, selectedLevel, maxLines]
  );

  const clearLogs = () => useStore.getState().clearLogs();

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error": return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
      case "warn": return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
      case "info": return "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
      default: return "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700";
    }
  };

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-700 dark:text-red-300";
      case "warn": return "text-yellow-700 dark:text-yellow-300";
      case "info": return "text-blue-700 dark:text-blue-300";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const isEmpty = logs.length === 0;

  const LOGS_TIPS = [
    "Logs are automatically generated when you interact with models",
    "Use the Filter field to search for specific log messages",
    "Level filter helps you focus on errors, warnings, or info messages",
    "Logs are cleared when you refresh the page or clear manually",
    "Configure log verbosity in Settings for more detailed output",
  ];

  const LOGS_DOCS_URL = "/docs/logs";

  return (
    <div className="logs-page">
      <h1 className="text-3xl font-bold mb-6">Logs</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <div className="flex gap-2 w-full sm:w-auto">
          <TextField
            label="Filter"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter logs..."
            size="small"
            sx={{ width: 200 }}
          />
          <TextField
            label="Level"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            select
            size="small"
            sx={{ width: 150 }}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
          </TextField>
          <Button onClick={clearLogs} variant="outlined">Clear Logs</Button>
        </div>
        <div className="flex gap-2">
          {[50, 100, 200].map((num) => (
            <Button key={num} onClick={() => setMaxLines(num)} variant={maxLines === num ? "contained" : "outlined"}>{num}</Button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          illustration="logs"
          title="No Logs Available"
          description="Logs will appear here when you interact with models or the server."
          tips={LOGS_TIPS}
          documentationUrl={LOGS_DOCS_URL}
        />
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs match the selected filters
              </div>
            ) : (
              filteredLogs.map((log: any, index: number) => {
                const source = log.source || (typeof log.context?.source === "string" ? log.context.source : "application");
                const messageText = typeof log.message === "string" ? log.message : JSON.stringify(log.message);
                const level = log.level || "unknown";
                return (
                  <div key={index} className={`p-3 border rounded-md ${getLevelColor(level)} transition-all hover:shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <span className={`font-mono ${getLevelTextColor(level)} font-medium`}>
                        {level.toUpperCase()} - {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs opacity-60 ml-2 flex-shrink-0">{source}</span>
                    </div>
                    <p className="mt-2 font-mono text-sm leading-relaxed">{messageText}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
