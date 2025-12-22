"use client";

import { useWebSocket } from "@/hooks/use-websocket";
import { Chip, Tooltip, Box } from "@mui/material";
import { Wifi, WifiOff, CloudSync, ErrorOutline } from "@mui/icons-material";
import { m } from "framer-motion";

export function WebSocketStatus() {
  const { connectionState } = useWebSocket();

  const getStatusInfo = () => {
    switch (connectionState) {
      case "connected":
        return {
          color: "success" as const,
          label: "Connected",
          icon: <Wifi fontSize="small" />,
          tooltip: "WebSocket connected",
        };
      case "connecting":
        return {
          color: "warning" as const,
          label: "Connecting",
          icon: <CloudSync fontSize="small" />,
          tooltip: "WebSocket connecting...",
        };
      case "disconnected":
        return {
          color: "error" as const,
          label: "Disconnected",
          icon: <WifiOff fontSize="small" />,
          tooltip: "WebSocket disconnected",
        };
      default:
        return {
          color: "default" as const,
          label: "Unknown",
          icon: <ErrorOutline fontSize="small" />,
          tooltip: "WebSocket status unknown",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Tooltip title={statusInfo.tooltip} arrow>
      <Box>
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            variant="filled"
            sx={{ borderRadius: "8px" }}
          />
        </m.div>
      </Box>
    </Tooltip>
  );
}
