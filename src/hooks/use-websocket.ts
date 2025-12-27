import { useEffect, useState, useRef } from 'react';
import { websocketServer } from '@/lib/websocket-client';
import { useStore } from '@/lib/store';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const logQueueRef = useRef<any[]>([]);
  const logThrottleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect on mount
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

    const processLogQueue = () => {
      if (logQueueRef.current.length > 0) {
        // Process all accumulated logs at once
        logQueueRef.current.forEach((log) => {
          useStore.getState().addLog(log);
        });
        logQueueRef.current = [];
      }
      logThrottleRef.current = null;
    };

    const handleMessage = (message: unknown) => {
      // Update store based on message type
      if (message && typeof message === 'object' && 'type' in message) {
        const msg = message as { type: string; data?: unknown };
        if (msg.type === 'metrics' && msg.data) {
          useStore.getState().setMetrics(msg.data as any);
        } else if (msg.type === 'models' && msg.data) {
          useStore.getState().setModels(msg.data as any);
        } else if (msg.type === 'logs' && msg.data) {
          // Handle batch logs (on requestLogs response)
          useStore.getState().setLogs(msg.data as any);
        } else if (msg.type === 'log' && msg.data) {
          // Handle individual log events (real-time streaming) - throttle these
          logQueueRef.current.push(msg.data);
          
          // Schedule processing if not already scheduled
          if (!logThrottleRef.current) {
            logThrottleRef.current = setTimeout(processLogQueue, 500);
          }
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
      // Flush any remaining logs
      if (logThrottleRef.current) {
        clearTimeout(logThrottleRef.current);
        processLogQueue();
      }
      
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
