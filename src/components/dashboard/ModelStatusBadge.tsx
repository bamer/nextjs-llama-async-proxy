"use client";

import React from "react";
import { Chip, Tooltip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface ModelStatusBadgeProps {
  status: "idle" | "loading" | "running" | "error";
  progress?: number;
  size?: "small" | "medium";
}

const getNormalizedStatus = (status: string): "running" | "idle" | "loading" | "error" | "stopped" => {
  switch (status) {
    case "running":
      return "running";
    case "loading":
      return "loading";
    case "error":
      return "error";
    default:
      return "stopped";
  }
};

const getStatusLabel = (status: string, progress?: number): string => {
  if (status === "loading" && progress !== undefined) {
    return `${progress}%`;
  }
  return "";
};

export const ModelStatusBadge: React.FC<ModelStatusBadgeProps> = ({ status, progress, size = "small" }) => {
  const normalizedStatus = getNormalizedStatus(status);
  const customLabel = getStatusLabel(status, progress);

  if (status === "loading" && progress !== undefined) {
    return (
      <Tooltip title={`Loading: ${progress}%`}>
        <Chip
          label={customLabel}
          color="info"
          size={size}
          avatar={<CircularProgress size={14} sx={{ ml: -0.5 }} />}
          sx={{ height: 24, fontSize: "0.7rem" }}
        />
      </Tooltip>
    );
  }

  return <StatusBadge status={normalizedStatus} size={size} label={customLabel} />;
};
