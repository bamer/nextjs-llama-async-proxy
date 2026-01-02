"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { websocketServer } from "@/lib/websocket-client";
import { useWebSocketStateManager } from "./websocket-state-manager";
import { handleMessage } from "./websocket-message-handler";
import type { WebSocketMessage } from "./websocket-message-handler";

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
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
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

  const sendMessage = (event: string, data?: unknown) => {
    if (!isConnected) {
      console.warn('[WebSocketProvider] WebSocket not connected, message not sent:', event);
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

  const unloadModel = (modelId: string) => {
    websocketServer.sendMessage('unloadModel', { modelId });
  };

  const on = (event: string, callback: (data: any) => void) => {
    websocketServer.on(event, callback);
  };

  const off = (event: string, callback: (data: any) => void) => {
    websocketServer.off(event, callback);
  };

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
