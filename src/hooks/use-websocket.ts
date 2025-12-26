import { useEffect, useState } from 'react';
import { websocketServer } from '@/lib/websocket-client';
import { useStore } from '@/lib/store';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  useEffect(() => {
    // Connect on mount
    console.log('WebSocket hook: connecting...');
    websocketServer.connect();

    // Set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleError = (error: unknown) => {
      console.error('WebSocket error:', error);
    };

    const handleMessage = (message: unknown) => {
      console.log('WebSocket hook received message:', message);

      // Update store based on message type
      if (message && typeof message === 'object' && 'type' in message) {
        const msg = message as { type: string; data?: unknown };
        if (msg.type === 'metrics' && msg.data) {
          useStore.getState().setMetrics(msg.data as any);
        } else if (msg.type === 'models' && msg.data) {
          useStore.getState().setModels(msg.data as any);
        } else if (msg.type === 'logs' && msg.data) {
          useStore.getState().setLogs(msg.data as any);
        }
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
  }, []);

  const sendMessage = (event: string, data?: unknown) => {
    if (!isConnected) {
      console.warn('WebSocket not connected');
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
