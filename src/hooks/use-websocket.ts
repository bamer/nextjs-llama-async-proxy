"use client";

import { useEffectEvent as ReactUseEffectEvent, useCallback } from 'react';
import { useWebSocketContext } from '@/providers/websocket-provider';

/**
 * Simplified WebSocket hook that consumes app-level WebSocket connection
 * Connection is managed by WebSocketProvider at app startup
 * This hook just provides convenient methods for components
 */
export function useWebSocket() {
  const { isConnected, connectionState, sendMessage, requestMetrics, requestLogs, requestModels, startModel, stopModel } = useWebSocketContext();

  return {
    isConnected,
    connectionState,
    sendMessage,
    requestMetrics,
    requestLogs,
    requestModels,
    startModel,
    stopModel,
  };
}
