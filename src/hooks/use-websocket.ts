"use client";

import { useEffectEvent as ReactUseEffectEvent, useCallback, useEffect } from "react";
import { useWebSocketContext } from "@/providers/websocket-provider";

/**
 * Generic hook for subscribing to specific WebSocket event types
 * Provides type-safe event handler registration with automatic cleanup
 *
 * @template T - Type of event data payload
 * @param eventType - The WebSocket event type to subscribe to
 * @param handler - Callback function to handle incoming events
 * @param dependencies - Dependency array for the handler memoization (defaults to empty)
 *
 * @example
 * ```tsx
 * useWebSocketEvent<ModelUpdateEvent>('model_update', (data) => {
 *   console.log('Model updated:', data.modelId);
 * }, [modelId]);
 * ```
 */
export function useWebSocketEvent<T = unknown>(
  eventType: string,
  handler: (data: T) => void,
  dependencies: React.DependencyList = []
): void {
  const { on, off } = useWebSocketContext();

  // Memoize the handler to prevent unnecessary re-subscriptions
  const memoizedHandler = useCallback(handler, dependencies);

  useEffect(
    () => {
      // Register the event handler
      on(eventType, memoizedHandler);

      // Cleanup: unregister the event handler on unmount
      return () => {
        off(eventType, memoizedHandler);
      };
    },
    [eventType, memoizedHandler, on, off]
  );
}

/**
 * Simplified WebSocket hook that consumes app-level WebSocket connection
 * Connection is managed by WebSocketProvider at app startup
 * This hook just provides convenient methods for components
 */
export function useWebSocket() {
  const {
    isConnected,
    connectionState,
    reconnectionAttempts,
    sendMessage,
    requestMetrics,
    requestLogs,
    requestModels,
    startModel,
    stopModel,
    on,
    off,
    socketId,
  } = useWebSocketContext();

  return {
    isConnected,
    connectionState,
    reconnectionAttempts,
    sendMessage,
    requestMetrics,
    requestLogs,
    requestModels,
    startModel,
    stopModel,
    on,
    off,
    useWebSocketEvent,
    socketId,
  };
}
