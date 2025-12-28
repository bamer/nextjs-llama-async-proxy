"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { websocketServer } from "@/lib/websocket-client";
import { useStore } from "@/lib/store";
import type { SystemMetrics, ModelConfig, LogEntry } from "@/types";

interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  sendMessage: (event: string, data?: unknown) => void;
  requestMetrics: () => void;
  requestLogs: () => void;
  requestModels: () => void;
  startModel: (modelId: string) => void;
  stopModel: (modelId: string) => void;
  unloadModel: (modelId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  // Batching refs for different data types
  const metricsBatchRef = useRef<SystemMetrics[]>([]);
  const metricsThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const modelsBatchRef = useRef<ModelConfig[][]>([]);
  const modelsThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const logQueueRef = useRef<LogEntry[]>([]);
  const logThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Process metrics batch
  const processMetricsBatch = useCallback(() => {
    if (metricsBatchRef.current.length > 0) {
      const latestMetrics = metricsBatchRef.current[metricsBatchRef.current.length - 1];
      useStore.getState().setMetrics(latestMetrics);
      metricsBatchRef.current = [];
    }
    metricsThrottleRef.current = null;
  }, []);

  // Process models batch
  const processModelsBatch = useCallback(() => {
    if (modelsBatchRef.current.length > 0) {
      const latestModels = modelsBatchRef.current[modelsBatchRef.current.length - 1];
      useStore.getState().setModels(latestModels);
      modelsBatchRef.current = [];
    }
    modelsThrottleRef.current = null;
  }, []);

  // Process log queue
  const processLogQueue = useCallback(() => {
    if (logQueueRef.current.length > 0) {
      logQueueRef.current.forEach((log) => {
        useStore.getState().addLog(log);
      });
      logQueueRef.current = [];
    }
    logThrottleRef.current = null;
  }, []);

  useEffect(() => {
    // Connect to WebSocket ONCE on mount
    console.log('[WebSocketProvider] Initializing WebSocket connection...');
    websocketServer.connect();

    // Handle connect event
    const handleConnect = () => {
      console.log('[WebSocketProvider] WebSocket connected');
      setIsConnected(true);
      setConnectionState('connected');

      // Request initial data after connection
      websocketServer.requestMetrics();
      websocketServer.requestModels();
      websocketServer.requestLogs();
    };

    // Handle incoming messages
    const handleMessage = (message: unknown) => {
      if (message && typeof message === 'object' && 'type' in message) {
        const msg = message as { type: string; data?: unknown };

        if (msg.type === 'metrics' && msg.data) {
          // Batch metrics with 500ms debounce
          metricsBatchRef.current.push(msg.data as SystemMetrics);
          if (!metricsThrottleRef.current) {
            metricsThrottleRef.current = setTimeout(processMetricsBatch, 500);
          }
        } else if (msg.type === 'models' && msg.data) {
          // Batch models with 1000ms debounce
          modelsBatchRef.current.push(msg.data as ModelConfig[]);
          if (!modelsThrottleRef.current) {
            modelsThrottleRef.current = setTimeout(processModelsBatch, 1000);
          }
        } else if (msg.type === 'modelStopped') {
          // Model was stopped/unloaded from llama-server
          console.log('[WebSocketProvider] Model stopped:', msg.data);
        } else if (msg.type === 'llamaServerStatus') {
          // LlamaServer status update
          console.log('[WebSocketProvider] LlamaServer status:', msg.data);
          useStore.getState().setLlamaServerStatus(msg.data as any);
        }
      }
    };

    // Unload model from llama-server memory
    const unloadModel = useCallback((modelId: string) => {
      console.log('[WebSocketProvider] Unloading model:', modelId);
      sendMessage('unloadModel', { modelId });
    }, [sendMessage]);

    // Handle disconnect event
    const handleDisconnect = () => {
      console.log('[WebSocketProvider] WebSocket disconnected');
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    // Handle connect_error event
    const handleError = (error: unknown) => {
      console.error('[WebSocketProvider] WebSocket error:', error);
      setConnectionState('error');
    };

    // Add event listeners
    websocketServer.on('connect', handleConnect);
    websocketServer.on('disconnect', handleDisconnect);
    websocketServer.on('connect_error', handleError);
    websocketServer.on('message', handleMessage);

    // Cleanup - don't disconnect socket, just remove listeners
    return () => {
      console.log('[WebSocketProvider] Cleaning up event listeners (keeping WebSocket alive)');

      // Flush any remaining data
      if (logThrottleRef.current) {
        clearTimeout(logThrottleRef.current);
        processLogQueue();
      }
      if (metricsThrottleRef.current) {
        clearTimeout(metricsThrottleRef.current);
        processMetricsBatch();
      }
      if (modelsThrottleRef.current) {
        clearTimeout(modelsThrottleRef.current);
        processModelsBatch();
      }

      // Remove event listeners
      websocketServer.off('connect', handleConnect);
      websocketServer.off('disconnect', handleDisconnect);
      websocketServer.off('connect_error', handleError);
      websocketServer.off('message', handleMessage);
    };
  }, []); // Empty deps - connect only once

  const sendMessage = useCallback((event: string, data?: unknown) => {
    if (!isConnected) {
      console.warn('[WebSocketProvider] WebSocket not connected, message not sent:', event);
      return;
    }
    websocketServer.sendMessage(event, data);
  }, [isConnected]);

  const requestMetrics = useCallback(() => {
    websocketServer.requestMetrics();
  }, []);

  const requestLogs = useCallback(() => {
    websocketServer.requestLogs();
  }, []);

  const requestModels = useCallback(() => {
    websocketServer.requestModels();
  }, []);

  const startModel = useCallback((modelId: string) => {
    websocketServer.startModel(modelId);
  }, []);

  const stopModel = useCallback((modelId: string) => {
    websocketServer.stopModel(modelId);
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    connectionState,
    sendMessage,
    requestMetrics,
    requestLogs,
    requestModels,
    startModel,
    stopModel,
    unloadModel,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}
