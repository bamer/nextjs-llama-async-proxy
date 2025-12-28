"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { websocketServer } from '@/lib/websocket-client';
import { useStore } from '@/lib/store';
import type { SystemMetrics, ModelConfig, LogEntry } from '@/types';
import { useEffectEvent } from './use-effect-event';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  // Batching refs for different data types
  const logQueueRef = useRef<LogEntry[]>([]);
  const logThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const metricsBatchRef = useRef<SystemMetrics[]>([]);
  const metricsThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const modelsBatchRef = useRef<ModelConfig[][]>([]);
  const modelsThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Reconnection state
  const reconnectionAttemptsRef = useRef<number>(0);
  const reconnectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectionAttempts = 5;
  const initialReconnectionDelay = 1000; // 1 second
  const maxReconnectionDelay = 30000; // 30 seconds
  const isReconnectingRef = useRef<boolean>(false);
  const eventListenersAddedRef = useRef<boolean>(false);

  // Use refs for connection state to avoid callback recreation
  const isConnectedRef = useRef<boolean>(false);
  const connectionStateRef = useRef<string>('disconnected');

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

  // Handle page visibility changes - stable callback using useEffectEvent pattern
  const handleVisibilityChange = useEffectEvent(() => {
    if (document.visibilityState === 'visible') {
      // User came back to tab - attempt to reconnect if disconnected
      // Use refs to avoid callback recreation when state changes
      if (!isConnectedRef.current && connectionStateRef.current === 'disconnected') {
        reconnectionAttemptsRef.current = 0;
        attemptReconnect();
      }
    }
  });

  // Extracted event handlers using useEffectEvent for stability
  const handleConnect = useEffectEvent(() => {
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
  });

  const handleDisconnect = useEffectEvent(() => {
    setIsConnected(false);
    // Only show "disconnected" if we're not already reconnecting
    if (!isReconnectingRef.current) {
      setConnectionState('disconnected');
    }
    // Start reconnection if not at max attempts
    if (reconnectionAttemptsRef.current < maxReconnectionAttempts) {
      attemptReconnect();
    }
  });

  const handleError = useEffectEvent((error: unknown) => {
    console.error('WebSocket error:', error);
    // On error, attempt to reconnect
    if (!isConnectedRef.current && reconnectionAttemptsRef.current < maxReconnectionAttempts) {
      attemptReconnect();
    }
  });

  const handleMessage = useEffectEvent((message: unknown) => {
    // Update store based on message type with batching
    if (message && typeof message === 'object' && 'type' in message) {
      const msg = message as { type: string; data?: unknown };

      if (msg.type === 'metrics' && msg.data) {
        // Batch metrics with 500ms debounce (increased from 200ms)
        metricsBatchRef.current.push(msg.data as SystemMetrics);

        // Schedule processing if not already scheduled
        if (!metricsThrottleRef.current) {
          metricsThrottleRef.current = setTimeout(processMetricsBatch, 500);
        }
      } else if (msg.type === 'models' && msg.data) {
        // Batch models with 1000ms debounce (increased from 300ms)
        modelsBatchRef.current.push(msg.data as ModelConfig[]);

        // Schedule processing if not already scheduled
        if (!modelsThrottleRef.current) {
          modelsThrottleRef.current = setTimeout(processModelsBatch, 1000);
        }
      } else if (msg.type === 'logs' && msg.data) {
        // Handle batch logs (on requestLogs response) - immediate update
        useStore.getState().setLogs(msg.data as any);
      } else if (msg.type === 'log' && msg.data) {
        // Handle individual log events (real-time streaming) - throttle these
        // Increased to 1000ms debounce to reduce re-renders during log storms
        logQueueRef.current.push(msg.data as LogEntry);

        // Schedule processing if not already scheduled
        if (!logThrottleRef.current) {
          logThrottleRef.current = setTimeout(processLogQueue, 1000);
        }
      }
    }
  });

  // Process metrics batch - stable callback using useEffectEvent pattern
  const processMetricsBatch = useEffectEvent(() => {
    if (metricsBatchRef.current.length > 0) {
      // Use the most recent data (last element)
      const latestMetrics = metricsBatchRef.current[metricsBatchRef.current.length - 1];
      useStore.getState().setMetrics(latestMetrics);
      metricsBatchRef.current = [];
    }
    metricsThrottleRef.current = null;
  });

  // Process models batch - stable callback using useEffectEvent pattern
  const processModelsBatch = useEffectEvent(() => {
    if (modelsBatchRef.current.length > 0) {
      // Use the most recent data (last element)
      const latestModels = modelsBatchRef.current[modelsBatchRef.current.length - 1];
      useStore.getState().setModels(latestModels);
      modelsBatchRef.current = [];
    }
    modelsThrottleRef.current = null;
  });

  // Process log queue - stable callback using useEffectEvent pattern
  const processLogQueue = useEffectEvent(() => {
    if (logQueueRef.current.length > 0) {
      // Process all accumulated logs at once
      logQueueRef.current.forEach((log) => {
        useStore.getState().addLog(log);
      });
      logQueueRef.current = [];
    }
    logThrottleRef.current = null;
  });

  // Sync refs with state (separate effect to avoid recreation of main effect)
  useEffect(() => {
    isConnectedRef.current = isConnected;
    connectionStateRef.current = connectionState;
  }, [isConnected, connectionState]);

  useEffect(() => {
    // Connect on mount
    websocketServer.connect();

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

      // Flush any remaining metrics
      if (metricsThrottleRef.current) {
        clearTimeout(metricsThrottleRef.current);
        processMetricsBatch();
      }

      // Flush any remaining models
      if (modelsThrottleRef.current) {
        clearTimeout(modelsThrottleRef.current);
        processModelsBatch();
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
  }, []); // No dependencies - all handlers are stable via useEffectEvent

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
