import { useCallback } from "react";
import { websocketServer } from "@/lib/websocket-client";

export function useWebSocketApi(isConnected: boolean) {
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

  const on = useCallback((event: string, callback: (data: any) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    websocketServer.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: (data: any) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    websocketServer.off(event, callback);
  }, []);

  return {
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
}