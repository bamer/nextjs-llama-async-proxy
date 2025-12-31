"use client";

import React from "react";
import { Chip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

export interface StatusBadgeProps {
  status: "running" | "idle" | "loading" | "error" | "stopped";
  size?: "small" | "medium";
  label?: string;
}

interface StatusConfig {
  color: "success" | "default" | "info" | "error" | "warning";
  label: string;
}

const statusConfigMap: Record<StatusBadgeProps["status"], StatusConfig> = {
  running: { color: "success", label: "Running" },
  idle: { color: "default", label: "Idle" },
  loading: { color: "info", label: "Loading" },
  error: { color: "error", label: "Error" },
  stopped: { color: "warning", label: "Stopped" },
};

const LoadingSpinner: React.FC<{ size: number }> = ({ size }) => (
  <CircularProgress size={size} sx={{ color: "inherit", ml: 0.5 }} />
);

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "small",
  label,
}) => {
  const config = statusConfigMap[status];
  const displayLabel = label || config.label;

  const getSizeValue = (badgeSize: StatusBadgeProps["size"]): number => {
    switch (badgeSize) {
      case "medium":
        return 20;
      case "small":
      default:
        return 16;
    }
  };

  const avatar =
    status === "loading" ? <LoadingSpinner size={getSizeValue(size)} /> : undefined;

  return (
    <Chip
      label={displayLabel}
      color={config.color}
      size={size}
      {...(avatar !== undefined ? { avatar } : {})}
      sx={{
        fontWeight: 500,
        "& .MuiChip-label": {
          fontWeight: 500,
        },
      }}
    />
  );
}
