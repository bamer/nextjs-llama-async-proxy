"use client";

import React, { ReactNode, useEffect } from "react";
import { websocketService } from "@services/websocket-service";
import { useStore } from "@lib/store";
import { useSnackbar } from "notistack";

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { enqueueSnackbar } = useSnackbar();
  const status = useStore((state) => state.status);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Set up periodic data requests
    const interval = setInterval(() => {
      if (websocketService.isConnected()) {
        websocketService.requestMetrics();
        websocketService.requestModels();
      }
    }, 10000); // Every 10 seconds

    // Error handling
    if (status.error) {
      enqueueSnackbar(status.error, { variant: "error" });
      useStore.getState().clearError();
    }

    // Cleanup
    return () => {
      clearInterval(interval);
      websocketService.disconnect();
    };
  }, [status.error, enqueueSnackbar]);

  return <>{children}</>;
}