"use client";

import { Chip, ChipProps, Tooltip } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import GrainOutlinedIcon from "@mui/icons-material/GrainOutlined";

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

const levelConfig: Record<LogLevel, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  error: { label: "Error", bg: "#fee2e2", color: "#b91c1c", icon: <ErrorOutlineIcon fontSize="small" /> },
  warn: { label: "Warn", bg: "#fef3c7", color: "#b45309", icon: <WarningAmberIcon fontSize="small" /> },
  info: { label: "Info", bg: "#dbeafe", color: "#1d4ed8", icon: <InfoOutlinedIcon fontSize="small" /> },
  debug: { label: "Debug", bg: "#f3f4f6", color: "#4b5563", icon: <BugReportOutlinedIcon fontSize="small" /> },
  trace: { label: "Trace", bg: "#f3f4f6", color: "#4b5563", icon: <GrainOutlinedIcon fontSize="small" /> },
};

interface LogLevelBadgeProps {
  level: LogLevel;
  size?: ChipProps["size"];
  showLabel?: boolean;
}

export function LogLevelBadge({ level, size = "small", showLabel = true }: LogLevelBadgeProps) {
  const config = levelConfig[level];

  return (
    <Tooltip title={config.label}>
      <Chip
        size={size}
        icon={config.icon as React.ReactElement}
        label={showLabel ? config.label : undefined}
        sx={{
          backgroundColor: config.bg,
          color: config.color,
          fontWeight: 500,
          borderRadius: "6px",
          "& .MuiChip-icon": { color: config.color },
        }}
      />
    </Tooltip>
  );
}
