"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { websocketServer } from "@/lib/websocket-client";
import { useWebSocketStateManager } from "./websocket-state-manager";
import { handleMessage } from "./websocket-message-handler";

interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
  reconnectionAttempts: number;
  sendMessage: (event: string, data?: unknown) => void;
  requestMetrics: () => void;
  requestLogs: () => void;
  requestModels: () => void;
  startModel: (modelId: string) => void;
  stopModel: (modelId: string) => void;
  unloadModel: (modelId: string) => void;
  on: <T = unknown>(event: string, callback: (data: T) => void) => void;
  off: <T = unknown>(event: string, callback: (data: T) => void) => void;
  socketId: string;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [reconnectionAttempts, setReconnectionAttempts] = useState<number>(0);

  const stateManager = useWebSocketStateManager();

  useEffect(() => {
    console.log('[WebSocketProvider] Initializing WebSocket connection...');
    websocketServer.connect();

    const handleConnect = () => {
      console.log('[WebSocketProvider] WebSocket connected');
      setIsConnected(true);
      setConnectionState('connected');
      setReconnectionAttempts(0);
      websocketServer.requestMetrics();
      websocketServer.requestLogs();
    };

    const handleDisconnect = () => {
      console.log('[WebSocketProvider] WebSocket disconnected');
      setIsConnected(false);
      setConnectionState('reconnecting');
      setReconnectionAttempts((prev) => prev + 1);
    };

    const handleError = (error: unknown) => {
      console.error('[WebSocketProvider] WebSocket error:', error);
      setConnectionState('error');
    };

    const handleMessageWrapper = (message: unknown) => {
      handleMessage(message, stateManager);
    };

    websocketServer.on('connect', handleConnect);
    websocketServer.on('disconnect', handleDisconnect);
    websocketServer.on('connect_error', handleError);
    websocketServer.on('message', handleMessageWrapper);

    return () => {
      console.log('[WebSocketProvider] Cleaning up event listeners (keeping WebSocket alive)');

      if (stateManager.logThrottleRef.current) {
        clearTimeout(stateManager.logThrottleRef.current);
        stateManager.processLogQueue();
      }
      if (stateManager.metricsThrottleRef.current) {
        clearTimeout(stateManager.metricsThrottleRef.current);
        stateManager.processMetricsBatch();
      }
      if (stateManager.modelsThrottleRef.current) {
        clearTimeout(stateManager.modelsThrottleRef.current);
        stateManager.processModelsBatch();
      }

      websocketServer.off('connect', handleConnect);
      websocketServer.off('disconnect', handleDisconnect);
      websocketServer.off('connect_error', handleError);
      websocketServer.off('message', handleMessageWrapper);
    };
  }, [stateManager]);

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

  const on = useCallback(<T = unknown>(event: string, callback: (data: T) => void) => {
    websocketServer.on(event, callback as (data: unknown) => void);
  }, []);

  const off = useCallback(<T = unknown>(event: string, callback: (data: T) => void) => {
    websocketServer.off(event, callback as (data: unknown) => void);
  }, []);

  // Memoize the value object to prevent unnecessary re-renders
  const value: WebSocketContextType = {
    isConnected,
    connectionState,
    reconnectionAttempts,
    sendMessage,
    requestMetrics,
    requestLogs,
    requestModels,
    startModel,
    stopModel,
    unloadModel,
    on,
    off,
    socketId: websocketServer.getSocketId() || 'unknown',
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
