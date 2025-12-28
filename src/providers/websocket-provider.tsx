"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { websocketServer } from "@/lib/websocket-client";
import { useStore } from "@/lib/store";
import { saveMetrics, getMetricsHistory } from "@/lib/database";
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

      // Save to database for persistence (non-blocking)
      try {
        const metricsData: Record<string, number | undefined> = {
          cpu_usage: latestMetrics.cpuUsage,
          memory_usage: latestMetrics.memoryUsage,
          disk_usage: latestMetrics.diskUsage,
          active_models: latestMetrics.activeModels,
          uptime: latestMetrics.uptime
        };

        // Add optional GPU metrics if available
        if (latestMetrics.gpuUsage !== undefined) {
          metricsData.gpu_usage = latestMetrics.gpuUsage;
        }
        if (latestMetrics.gpuTemperature !== undefined) {
          metricsData.gpu_temperature = latestMetrics.gpuTemperature;
        }
        if (latestMetrics.gpuMemoryUsed !== undefined) {
          metricsData.gpu_memory_used = latestMetrics.gpuMemoryUsed;
        }
        if (latestMetrics.gpuMemoryTotal !== undefined) {
          metricsData.gpu_memory_total = latestMetrics.gpuMemoryTotal;
        }
        if (latestMetrics.gpuPowerUsage !== undefined) {
          metricsData.gpu_power_usage = latestMetrics.gpuPowerUsage;
        }

        saveMetrics(metricsData);
      } catch (error) {
        console.error('[WebSocketProvider] Failed to save metrics to database:', error);
      }

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

      // Load metrics history from database (last 10 minutes)
      try {
        const metricsHistory = getMetricsHistory(10);
        console.log('[WebSocketProvider] Loaded metrics history:', metricsHistory.length, 'records');

        // Set the most recent historical metrics as initial state
        if (metricsHistory.length > 0) {
          const mostRecentMetrics = metricsHistory[metricsHistory.length - 1];
          const initialMetrics: SystemMetrics = {
            cpuUsage: mostRecentMetrics.cpu_usage || 0,
            memoryUsage: mostRecentMetrics.memory_usage || 0,
            diskUsage: mostRecentMetrics.disk_usage || 0,
            activeModels: mostRecentMetrics.active_models || 0,
            totalRequests: 0,
            avgResponseTime: 0,
            uptime: mostRecentMetrics.uptime || 0,
            timestamp: new Date().toISOString()
          };

          // Add optional GPU metrics if available
          if (mostRecentMetrics.gpu_usage !== undefined) {
            initialMetrics.gpuUsage = mostRecentMetrics.gpu_usage;
          }
          if (mostRecentMetrics.gpu_temperature !== undefined) {
            initialMetrics.gpuTemperature = mostRecentMetrics.gpu_temperature;
          }
          if (mostRecentMetrics.gpu_memory_used !== undefined) {
            initialMetrics.gpuMemoryUsed = mostRecentMetrics.gpu_memory_used;
          }
          if (mostRecentMetrics.gpu_memory_total !== undefined) {
            initialMetrics.gpuMemoryTotal = mostRecentMetrics.gpu_memory_total;
          }
          if (mostRecentMetrics.gpu_power_usage !== undefined) {
            initialMetrics.gpuPowerUsage = mostRecentMetrics.gpu_power_usage;
          }

          useStore.getState().setMetrics(initialMetrics);
        }
      } catch (error) {
        console.error('[WebSocketProvider] Failed to load metrics history:', error);
      }

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
