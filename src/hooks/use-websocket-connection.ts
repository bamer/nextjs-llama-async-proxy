import { useState, useEffect } from "react";
import { websocketServer } from "@/lib/websocket-client";

export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [reconnectionAttempts, setReconnectionAttempts] = useState<number>(0);

  useEffect(() => {
    // Connect to WebSocket ONCE on mount
    console.log('[WebSocketProvider] Initializing WebSocket connection...');
    websocketServer.connect();

    // Handle connect event
    const handleConnect = () => {
      console.log('[WebSocketProvider] WebSocket connected');
      setIsConnected(true);
      setConnectionState('connected');
      setReconnectionAttempts(0);

      // Request initial data after connection
      websocketServer.requestMetrics();
      // Models are loaded via 'load_models' message from models page (database as source of truth)
      // Do NOT call requestModels() here to avoid overwriting database models with llama-server models
      websocketServer.requestLogs();
    };

    // Handle disconnect event
    const handleDisconnect = () => {
      console.log('[WebSocketProvider] WebSocket disconnected');
      setIsConnected(false);
      setConnectionState('reconnecting');
      setReconnectionAttempts((prev) => prev + 1);
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

    // Cleanup - don't disconnect socket, just remove listeners
    return () => {
      console.log('[WebSocketProvider] Cleaning up connection event listeners (keeping WebSocket alive)');

      // Remove event listeners
      websocketServer.off('connect', handleConnect);
      websocketServer.off('disconnect', handleDisconnect);
      websocketServer.off('connect_error', handleError);
    };
  }, []); // Empty deps - connect only once

  return {
    isConnected,
    connectionState,
    reconnectionAttempts,
  };
}