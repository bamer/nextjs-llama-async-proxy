import { useEffect, useState, useRef, useCallback } from 'react';
import { websocketServer } from '@/lib/websocket-client';
import { useStore } from '@/lib/store';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const logQueueRef = useRef<any[]>([]);
  const logThrottleRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reconnection state
  const reconnectionAttemptsRef = useRef<number>(0);
  const reconnectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectionAttempts = 5;
  const initialReconnectionDelay = 1000; // 1 second
  const maxReconnectionDelay = 30000; // 30 seconds
  const isReconnectingRef = useRef<boolean>(false);
  const eventListenersAddedRef = useRef<boolean>(false);

  // Calculate exponential backoff delay
  const calculateBackoffDelay = useCallback((attempt: number): number => {
    const delay = initialReconnectionDelay * Math.pow(2, attempt);
    return Math.min(delay, maxReconnectionDelay);
  }, []);

  // Clear any pending reconnection timer
  const clearReconnectionTimer = useCallback(() => {
    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
      reconnectionTimerRef.current = null;
    }
  }, []);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    clearReconnectionTimer();

    if (reconnectionAttemptsRef.current >= maxReconnectionAttempts) {
      setConnectionState('error');
      isReconnectingRef.current = false;
      console.error('Max reconnection attempts reached');
      return;
    }

    reconnectionAttemptsRef.current++;
    isReconnectingRef.current = true;
    setConnectionState('reconnecting');

    const delay = calculateBackoffDelay(reconnectionAttemptsRef.current - 1);
    console.log(`Reconnection attempt ${reconnectionAttemptsRef.current}/${maxReconnectionAttempts} in ${delay}ms`);

    reconnectionTimerRef.current = setTimeout(() => {
      websocketServer.connect();
    }, delay);
  }, [calculateBackoffDelay, clearReconnectionTimer]);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      // User came back to tab - attempt to reconnect if disconnected
      if (!isConnected && connectionState === 'disconnected') {
        reconnectionAttemptsRef.current = 0;
        attemptReconnect();
      }
    }
  }, [isConnected, connectionState, attemptReconnect]);

  useEffect(() => {
    // Connect on mount
    websocketServer.connect();

    // Set up event listeners
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
      isReconnectingRef.current = false;
      
      // Check if this is a reconnection (attempt > 0)
      const wasReconnecting = reconnectionAttemptsRef.current > 0;
      
      if (wasReconnecting) {
        console.log(`WebSocket reconnected successfully after ${reconnectionAttemptsRef.current} attempts`);
        // Resubscribe to all data types after successful reconnection
        console.log('Resubscribing to data streams...');
        websocketServer.requestMetrics();
        websocketServer.requestModels();
        websocketServer.requestLogs();
      }
      
      reconnectionAttemptsRef.current = 0;
      clearReconnectionTimer();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      // Only show "disconnected" if we're not already reconnecting
      if (!isReconnectingRef.current) {
        setConnectionState('disconnected');
      }
      // Start reconnection if not at max attempts
      if (reconnectionAttemptsRef.current < maxReconnectionAttempts) {
        attemptReconnect();
      }
    };

    const handleError = (error: unknown) => {
      console.error('WebSocket error:', error);
      // On error, attempt to reconnect
      if (!isConnected && reconnectionAttemptsRef.current < maxReconnectionAttempts) {
        attemptReconnect();
      }
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

    // Add event listeners only once
    if (!eventListenersAddedRef.current) {
      websocketServer.on('connect', handleConnect);
      websocketServer.on('disconnect', handleDisconnect);
      websocketServer.on('connect_error', handleError);
      websocketServer.on('message', handleMessage);
      eventListenersAddedRef.current = true;
    }

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      // Remove visibility change listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Flush any remaining logs
      if (logThrottleRef.current) {
        clearTimeout(logThrottleRef.current);
        processLogQueue();
      }
      
      // Clear reconnection timer
      clearReconnectionTimer();
      
      // Remove event listeners
      websocketServer.off('connect', handleConnect);
      websocketServer.off('disconnect', handleDisconnect);
      websocketServer.off('connect_error', handleError);
      websocketServer.off('message', handleMessage);
      eventListenersAddedRef.current = false;
      
      websocketServer.disconnect();
    };
  }, [clearReconnectionTimer, attemptReconnect, handleVisibilityChange]);

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
    reconnectionAttempts: reconnectionAttemptsRef.current,
  };
}
