"use client";

import { ReactNode, useEffect, useState } from "react";
import { websocketService } from "@/services/websocket-service";
import { useStore } from "@/lib/store";
import { useSnackbar } from "notistack";

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { enqueueSnackbar } = useSnackbar();
  const status = useStore((state) => state.status);
  const [_connectionState, setConnectionState] = useState("disconnected");

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect();

    // Set up event listeners
    const handleConnect = () => {
      setConnectionState("connected");
      enqueueSnackbar("Connected to WebSocket server", { variant: "success" });
    };

    const handleDisconnect = (reason: any) => {
      setConnectionState("disconnected");
      if (reason !== "io client disconnect") {
        enqueueSnackbar("Disconnected from WebSocket server", { variant: "warning" });
      }
    };

    const handleConnectError = (error: any) => {
      setConnectionState("error");
      enqueueSnackbar(`WebSocket connection error: ${error.message}`, { variant: "error" });
    };

    const handleReconnectFailed = () => {
      setConnectionState("error");
      enqueueSnackbar("Failed to reconnect to WebSocket server", { variant: "error" });
    };

    websocketService.on("connect", handleConnect);
    websocketService.on("disconnect", handleDisconnect);
    websocketService.on("connect_error", handleConnectError);
    websocketService.on("reconnect_failed", handleReconnectFailed);

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
      websocketService.off("connect", handleConnect);
      websocketService.off("disconnect", handleDisconnect);
      websocketService.off("connect_error", handleConnectError);
      websocketService.off("reconnect_failed", handleReconnectFailed);
      websocketService.disconnect();
    };
  }, [status.error, enqueueSnackbar]);

  return <>{children}</>;
}
