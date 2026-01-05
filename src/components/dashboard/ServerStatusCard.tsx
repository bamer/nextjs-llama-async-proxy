"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, Typography, LinearProgress, Box, Button } from "@mui/material";
import { useTheme } from "@/contexts/ThemeContext";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import EditIcon from "@mui/icons-material/Edit";

export type ServerStatus = "connected" | "disconnected" | "connecting";

interface ServerStatusCardProps {
  serverStatus: ServerStatus;
  uptime: number;
  lastStarted?: string;
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
  onRestart: () => void;
  onStart: () => void;
  onStop: () => void;
  onEdit: () => void;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getStatusColor(status: ServerStatus): "success" | "error" | "warning" {
  switch (status) {
    case "connected":
      return "success";
    case "disconnected":
      return "error";
    case "connecting":
      return "warning";
  }
}

function getProgressColor(value: number): "primary" | "warning" | "error" {
  if (value > 80) return "error";
  if (value > 60) return "warning";
  return "primary";
}

interface MetricRowProps {
  label: string;
  value: number;
}

const MetricRow = memo(function MetricRow({ label, value }: MetricRowProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight="medium">{value.toFixed(1)}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        color={getProgressColor(value)}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
});

export function ServerStatusCard({
  serverStatus,
  uptime,
  lastStarted,
  cpuUsage,
  memoryUsage,
  gpuUsage,
  onRestart,
  onStart,
  onStop,
  onEdit,
}: ServerStatusCardProps) {
  const { isDark } = useTheme();
  const statusColor = getStatusColor(serverStatus);
  const isRunning = serverStatus === "connected";

  const statusLabel = useMemo(() => {
    switch (serverStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
    }
  }, [serverStatus]);

  return (
    <Card sx={{
      height: "100%",
      background: isDark
        ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
        : "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
      boxShadow: isDark
        ? "0 4px 20px rgba(0, 0, 0, 0.3)"
        : "0 4px 20px rgba(0, 0, 0, 0.05)",
    }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: `${statusColor}.main`,
                boxShadow: `0 0 8px ${statusColor}.main`,
                animation: serverStatus === "connecting" ? "pulse 1.5s infinite" : "none",
                "@keyframes pulse": {
                  "0%": { opacity: 1 },
                  "50%": { opacity: 0.5 },
                  "100%": { opacity: 1 },
                },
              }} />
              <Typography variant="h6" fontWeight="bold">Server Status</Typography>
            </Box>
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={onEdit}
              sx={{ minWidth: "auto", p: 0.5 }}
            >
              Edit
            </Button>
          </Box>
        }
        subheader={statusLabel}
        titleTypographyProps={{ fontSize: "1.25rem" }}
      />
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>Uptime</Typography>
          <Typography variant="h5" fontWeight="bold">{formatUptime(uptime)}</Typography>
          {lastStarted && (
            <Typography variant="caption" color="text.secondary">
              Last started: {lastStarted}
            </Typography>
          )}
        </Box>

        <MetricRow label="CPU Usage" value={cpuUsage} />
        <MetricRow label="Memory Usage" value={memoryUsage} />
        <MetricRow label="GPU Usage" value={gpuUsage} />

        <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRestart}
            disabled={!isRunning}
          >
            Restart
          </Button>
          <Button
            variant={isRunning ? "outlined" : "contained"}
            size="small"
            startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
            onClick={isRunning ? onStop : onStart}
            color={isRunning ? "error" : "primary"}
          >
            {isRunning ? "Stop" : "Start"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
