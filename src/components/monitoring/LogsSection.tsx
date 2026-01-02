"use client";

import { Typography, Paper, Box } from "@mui/material";

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
}

interface LogsSectionProps {
  logs: LogEntry[];
}

const LogsSection = ({ logs }: LogsSectionProps) => {
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-500";
      case "warn":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      case "debug":
        return "text-gray-500";
      default:
        return "text-foreground";
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
      <Typography variant="h6" gutterBottom>
        Live Logs
      </Typography>
      <Box sx={{ maxHeight: 300, overflowY: "auto", p: 2, borderRadius: 2, backgroundColor: "background.paper" }}>
        {logs.length === 0 ? (
          <Typography>No logs available...</Typography>
        ) : (
          logs.map((log: LogEntry, index: number) => (
            <Box key={index} sx={{ mb: 1, display: "flex", gap: 1 }}>
              <Typography component="span" color={getLogLevelColor(log.level)}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </Typography>
              <Typography>{log.message}</Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default LogsSection;
