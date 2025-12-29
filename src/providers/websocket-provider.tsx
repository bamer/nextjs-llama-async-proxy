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
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
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
      // Models are loaded via 'load_models' message from models page (database as source of truth)
      // Do NOT call requestModels() here to avoid overwriting database models with llama-server models
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
          // Do NOT process 'models' messages from llama-server
          // Models are loaded from database via 'load_models' message
          // Llama-server models don't have database IDs needed for configuration
          console.log('[WebSocketProvider] Ignoring models message from llama-server (use database models via load_models)');
        } else if (msg.type === 'logs' && msg.data) {
          // Batch logs with 1000ms debounce
          const logs = msg.data as LogEntry[];
          console.log('[WebSocketProvider] Received logs batch:', logs.length, 'entries');
          logQueueRef.current.push(...logs);
          if (!logThrottleRef.current) {
            logThrottleRef.current = setTimeout(processLogQueue, 1000);
          }
        } else if (msg.type === 'log' && msg.data) {
          // Single log with 500ms debounce
          const log = msg.data as LogEntry;
          console.log('[WebSocketProvider] Received single log:', log);
          logQueueRef.current.push(log);
          if (!logThrottleRef.current) {
            logThrottleRef.current = setTimeout(processLogQueue, 500);
          }
        } else if (msg.type === 'status' && msg.data) {
          // Llama-server status update with model runtime states
          console.log('[WebSocketProvider] Received llama-server status:', msg.data);
          // Update model statuses in store without replacing models
          const statusData = msg.data as { models?: ModelConfig[]; status?: string };
          if (statusData.models && Array.isArray(statusData.models)) {
            const llamaModels = statusData.models;
            useStore.getState().models.forEach((dbModel) => {
              const llamaModel = llamaModels.find((lm) => lm.name === dbModel.name);
              if (llamaModel && llamaModel.status) {
                useStore.getState().updateModel(dbModel.id, { status: llamaModel.status });
              }
            });
          }
        } else if (msg.type === 'modelStopped') {
          // Model was stopped/unloaded from llama-server
          console.log('[WebSocketProvider] Model stopped:', msg.data);
        } else if (msg.type === 'llamaServerStatus') {
          // LlamaServer status update
          console.log('[WebSocketProvider] LlamaServer status:', msg.data);
          useStore.getState().setLlamaServerStatus(msg.data as any);
        } else if (msg.type === 'save_model') {
          // TODO: Forward to backend API route to save model
          console.warn('[WebSocketProvider] save_model message requires backend API endpoint');
        } else if (msg.type === 'update_model') {
          // TODO: Forward to backend API route to update model
          console.warn('[WebSocketProvider] update_model message requires backend API endpoint');
        } else if (msg.type === 'delete_model') {
          // TODO: Forward to backend API route to delete model
          console.warn('[WebSocketProvider] delete_model message requires backend API endpoint');
        } else if (msg.type === 'load_config') {
          // TODO: Forward to backend API route to load model config
          console.warn('[WebSocketProvider] load_config message requires backend API endpoint');
        } else if (msg.type === 'save_config') {
          // Config saved in database (handled by backend)
          console.log('[WebSocketProvider] Config saved:', msg.data);
        } else if (msg.type === 'models_loaded') {
          // Models loaded from database (source of truth)
          console.log('[WebSocketProvider] Database models loaded:', msg.data);
          console.log('[WebSocketProvider] Data type:', typeof msg.data);
          console.log('[WebSocketProvider] Data array?', Array.isArray(msg.data));
          console.log('[WebSocketProvider] Data length:', msg.data?.length);
          if (msg.data && (msg.data as ModelConfig[]).length > 0) {
            console.log('[WebSocketProvider] First model name:', (msg.data as ModelConfig[])[0]?.name);
            console.log('[WebSocketProvider] First model id:', (msg.data as ModelConfig[])[0]?.id);
          }
          if (msg.data) {
            useStore.getState().setModels(msg.data as ModelConfig[]);
            console.log('[WebSocketProvider] Called setModels, store now has:', useStore.getState().models.length);
          }
        } else if (msg.type === 'model_saved') {
          // Model saved to database
          console.log('[WebSocketProvider] Model saved to database:', msg.data);
        } else if (msg.type === 'model_updated') {
          // Model updated in database
          console.log('[WebSocketProvider] Model updated in database:', msg.data);
        } else if (msg.type === 'model_deleted') {
          // Model deleted from database
          console.log('[WebSocketProvider] Model deleted from database:', msg.data);
        } else if (msg.type === 'config_loaded') {
          // Config loaded from database
          console.log('[WebSocketProvider] Config loaded:', msg.data);
        } else if (msg.type === 'config_saved') {
          // Config saved to database
          if (msg.success) {
            console.log('[WebSocketProvider] Config saved successfully:', msg.data);
          } else {
            console.error('[WebSocketProvider] Config save failed:', msg.error);
          }
        } else if (msg.type === 'models_imported') {
          // Models imported from llama-server to database
          console.log('[WebSocketProvider] Models imported:', msg.data);
          if (msg.data) {
            useStore.getState().setModels(msg.data as ModelConfig[]);
          }
        }
      }
    };

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

  const unloadModel = useCallback((modelId: string) => {
    websocketServer.sendMessage('unloadModel', { modelId });
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    websocketServer.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: (data: any) => void) => {
    websocketServer.off(event, callback);
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
    on,
    off,
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
