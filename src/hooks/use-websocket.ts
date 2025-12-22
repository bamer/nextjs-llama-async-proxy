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
    console.log('WebSocket hook: connecting...');
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
      const currentState = websocketService.getConnectionState();
      // Only update state if it has actually changed
      setConnectionState(prevState => {
        if (prevState !== currentState) {
          return currentState;
        }
        return prevState;
      });
    };

    // Initial state - only set if different from current state
    const initialState = websocketService.getConnectionState();
    if (connectionState !== initialState) {
      setConnectionState(initialState);
    }

    // Handle incoming messages and update store
    const handleMessage = (message: any) => {
      console.log('WebSocket hook received message:', message);
      
      // Update store based on message type
      switch (message.type) {
        case 'metrics':
          useStore.getState().setMetrics(message.data);
          break;
        case 'models':
          useStore.getState().setModels(message.data);
          break;
        case 'logs':
          useStore.getState().setLogs(message.data);
          break;
        case 'model_status':
          useStore.getState().updateModel(message.data.modelId, { status: message.data.status });
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    };

    // Add event listeners
    websocketService.on("connect", handleConnect);
    websocketService.on("disconnect", handleDisconnect);
    websocketService.on("connect_error", handleConnectionState);
    websocketService.on("reconnect", handleConnect);
    websocketService.on("reconnect_failed", handleConnectionState);
    websocketService.on("message", handleMessage);

    // Cleanup
    return () => {
      websocketService.off("connect", handleConnect);
      websocketService.off("disconnect", handleDisconnect);
      websocketService.off("connect_error", handleConnectionState);
      websocketService.off("reconnect", handleConnect);
      websocketService.off("reconnect_failed", handleConnectionState);
      websocketService.off("message", handleMessage);
      websocketService.disconnect();
    };
  }, []);

  // Handle errors separately to avoid infinite loops
  useEffect(() => {
    if (status.error) {
      enqueueSnackbar(status.error, { variant: "error" });
      useStore.getState().clearError();
    }
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
