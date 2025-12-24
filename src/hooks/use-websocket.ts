import { useEffect, useState } from 'react';
import { websocketServer } from '@/lib/websocket-client';
import { useStore } from '@/lib/store';
import { useSnackbar } from 'notistack';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Connect on mount
    console.log('WebSocket hook: connecting...');
    websocketServer.connect();

    // Set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
      enqueueSnackbar('WebSocket connected', { variant: 'success' });
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
      enqueueSnackbar('WebSocket disconnected', { variant: 'warning' });
    };

    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      enqueueSnackbar('WebSocket error', { variant: 'error' });
    };

    const handleMessage = (message: any) => {
      console.log('WebSocket hook received message:', message);

      // Update store based on message type
      if (message.type === 'metrics' && message.data) {
        useStore.getState().setMetrics(message.data);
      } else if (message.type === 'models' && message.data) {
        useStore.getState().setModels(message.data);
      } else if (message.type === 'logs' && message.data) {
        useStore.getState().setLogs(message.data);
      }
    };

    // Add event listeners
    websocketServer.on('connect', handleConnect);
    websocketServer.on('disconnect', handleDisconnect);
    websocketServer.on('connect_error', handleError);
    websocketServer.on('message', handleMessage);

    // Cleanup
    return () => {
      websocketServer.off('connect', handleConnect);
      websocketServer.off('disconnect', handleDisconnect);
      websocketServer.off('connect_error', handleError);
      websocketServer.off('message', handleMessage);
      websocketServer.disconnect();
    };
  }, [enqueueSnackbar]);

  const sendMessage = (event: string, data?: any) => {
    if (!isConnected) {
      enqueueSnackbar('WebSocket not connected', { variant: 'warning' });
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
