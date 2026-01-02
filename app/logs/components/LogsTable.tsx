"use client";

import { Box, Grid, Card, CardContent, Typography, Chip, Pagination } from "@mui/material";
import { SkeletonLogEntry } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";
import { LogEntry } from "@/types";

interface LogsTableProps {
  filteredLogs: LogEntry[];
  paginatedLogs: LogEntry[];
  page: number;
  setPage: (page: number) => void;
  logsPerPage: number;
  isInitialLoad: boolean;
  hasLoadedLogs: boolean;
  isConnected: boolean;
  getStatusMessage: () => string;
}

export function LogsTable({
  filteredLogs,
  paginatedLogs,
  page,
  setPage,
  logsPerPage,
  isInitialLoad,
  hasLoadedLogs,
  isConnected,
  getStatusMessage,
}: LogsTableProps) {
  const { isDark } = useTheme();

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "error";
      case "warn":
        return "warning";
      case "info":
        return "info";
      case "debug":
        return "default";
      default:
        return "default";
    }
  };

  const getLogTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatMessage = (message: string | Record<string, unknown> | null | undefined): string => {
    if (typeof message === "string") {
      return message;
    }
    if (typeof message === "object" && message !== null) {
      const msg = message as Record<string, unknown>;
      if (msg.message && typeof msg.message === "string") {
        return msg.message;
      }
      if (msg.error && typeof msg.error === "string") {
        return msg.error;
      }
      if (msg.text && typeof msg.text === "string") {
        return msg.text;
      }
      return String(message || "");
    }
    return String(message || "");
  };

  return (
    <>
      {/* Show skeleton during initial load */}
      {isInitialLoad && !hasLoadedLogs && filteredLogs.length === 0 ? (
        <Box
          sx={{
            mt: 4,
            background:
              isDark ?
                "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
              : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            borderRadius: 2,
            boxShadow: isDark ?
              "0 8px 30px rgba(0,0,0,0.3)"
            : "0 8px 30px rgba(0,0,0,0.1)",
            p: 4,
          }}
        >
          <SkeletonLogEntry count={10} />
        </Box>
      ) : filteredLogs.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {getStatusMessage()}
          </Typography>
          {!isConnected && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Waiting for WebSocket connection...
            </Typography>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            mt: 4,
            background:
              isDark ?
                "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
              : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
            borderRadius: 2,
            boxShadow: isDark ?
              "0 8px 30px rgba(0,0,0,0.3)"
            : "0 8px 30px rgba(0,0,0,0.1)",
            p: 4,
          }}
        >
          <Grid container spacing={2}>
            {paginatedLogs.map((log, index) => {
              const levelColor = getLevelColor(log.level);
              const uniqueKey = log.id ? `${log.id}-${index}` : `log-${index}`;
              return (
                <Grid size={{ xs: 12 }} key={uniqueKey} sx={{ fontSize: "0.75rem" }}>
                  <Card
                    sx={{
                      mb: 2,
                      background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(248, 250, 252, 0.8)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}`,
                      borderRadius: 1,
                      overflow: "hidden",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: isDark ?
                          "0 12px 40px rgba(0,0,0,0.4)"
                        : "0 4px 12px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "flex", gap: 1, mb: 1.5 }}>
                        <Chip
                          label={log.level.toUpperCase()}
                          color={levelColor}
                          size="small"
                          sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 1, fontSize: "0.7rem" }}
                        >
                          {getLogTime(log.timestamp)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          mb: 1.5,
                        }}
                      >
                        {formatMessage(log.message)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination
          count={Math.ceil(filteredLogs.length / logsPerPage)}
          page={page}
          onChange={(_e, value) => setPage(value)}
          sx={{ "& .MuiPagination-ul": { justifyContent: "center" } }}
          color="primary"
          size="small"
        />
      </Box>
    </>
  );
}
