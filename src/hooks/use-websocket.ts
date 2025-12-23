import { useEffect, useState } from "react";
import { websocketServer } from "@/lib/websocket-client";
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
    websocketServer.connect();

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
      const currentState = websocketServer.getConnectionState();
      // Only update state if it has actually changed
      setConnectionState(prevState => {
        if (prevState !== currentState) {
          return currentState;
        }
        return prevState;
      });
    };

    // Initial state - only set if different from current state
    const initialState = websocketServer.getConnectionState();
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
        case 'connection':
          console.log('WebSocket connected with ID:', message.clientId);
          break;
        case 'user_disconnected':
          console.log('User disconnected:', message.senderId);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    };

    // Add event listeners
    websocketServer.on("connect", handleConnect);
    websocketServer.on("disconnect", handleDisconnect);
    websocketServer.on("connect_error", handleConnectionState);
    websocketServer.on("reconnect", handleConnect);
    websocketServer.on("reconnect_failed", handleConnectionState);
    websocketServer.on("message", handleMessage);

    // Cleanup
    return () => {
      websocketServer.off("connect", handleConnect);
      websocketServer.off("disconnect", handleDisconnect);
      websocketServer.off("connect_error", handleConnectionState);
      websocketServer.off("reconnect", handleConnect);
      websocketServer.off("reconnect_failed", handleConnectionState);
      websocketServer.off("message", handleMessage);
      websocketServer.disconnect();
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
        websocketServer.requestMetrics();
        websocketServer.requestModels();
      }
    }, 5000); // Request data every 5 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  const sendMessage = (event: string, data?: any) => {
    if (!isConnected) {
      enqueueSnackbar("WebSocket not connected", { variant: "warning" });
      return;
    }
    websocketServer.sendMessage(event, data);
  };

  const requestMetrics = () => {
    websocketServer.requestMetrics();
  };

  const requestLogs = () => {
    websocketServer.requestLogs();
  };

  const requestModels = () => {
    websocketServer.requestModels();
  };

  const startModel = (modelId: string) => {
    websocketServer.startModel(modelId);
  };

  const stopModel = (modelId: string) => {
    websocketServer.stopModel(modelId);
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
    socketId: websocketServer.getSocketId(),
  };
}
