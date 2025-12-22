import { useEffect, useState } from "react";
import { websocketService } from "@/services/websocket-service";
import { useStore } from "@/lib/store";
import { useSnackbar } from "notistack";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>("disconnected");
  const { enqueueSnackbar } = useSnackbar();
  const status = useStore((state) => state.status);

  useEffect(() => {
    // Connect on mount
    websocketService.connect();

    // Set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState("connected");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState("disconnected");
    };

    const handleConnectionState = () => {
      setConnectionState(websocketService.getConnectionState());
    };

    // Initial state
    setConnectionState(websocketService.getConnectionState());

    // Add event listeners
    websocketService.on("connect", handleConnect);
    websocketService.on("disconnect", handleDisconnect);
    websocketService.on("connect_error", handleConnectionState);
    websocketService.on("reconnect", handleConnect);
    websocketService.on("reconnect_failed", handleConnectionState);

    // Error handling
    if (status.error) {
      enqueueSnackbar(status.error, { variant: "error" });
      useStore.getState().clearError();
    }

    // Cleanup
    return () => {
      websocketService.off("connect", handleConnect);
      websocketService.off("disconnect", handleDisconnect);
      websocketService.off("connect_error", handleConnectionState);
      websocketService.off("reconnect", handleConnect);
      websocketService.off("reconnect_failed", handleConnectionState);
      websocketService.disconnect();
    };
  }, [status.error, enqueueSnackbar]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        websocketService.requestMetrics();
        websocketService.requestModels();
      }
    }, 5000); // Request data every 5 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  const sendMessage = (event: string, data?: any) => {
    if (!isConnected) {
      enqueueSnackbar("WebSocket not connected", { variant: "warning" });
      return;
    }
    websocketService.sendMessage(event, data);
  };

  const requestMetrics = () => {
    websocketService.requestMetrics();
  };

  const requestLogs = () => {
    websocketService.requestLogs();
  };

  const requestModels = () => {
    websocketService.requestModels();
  };

  const startModel = (modelId: string) => {
    websocketService.startModel(modelId);
  };

  const stopModel = (modelId: string) => {
    websocketService.stopModel(modelId);
  };

  return {
    isConnected,
    connectionState,
    sendMessage,
    requestMetrics,
    requestLogs,
    requestModels,
    startModel,
    stopModel,
    socketId: websocketService.getSocketId(),
  };
}
