import { useCallback } from "react";
import { websocketServer } from "@/lib/websocket-client";
import { useStore } from "@/lib/store";
import type { SystemMetrics, ModelConfig, LogEntry } from "@/types";
import type { WebSocketMessage } from "@/types/websocket-types";
import { isConfigMessage } from "@/types/websocket-types";
import { useWebSocketDataBatching } from "./use-websocket-data-batching";

export function useWebSocketMessageHandlers() {
  const { addMetricsToBatch, addModelsToBatch, addLogsToQueue } = useWebSocketDataBatching();

  const handleMessage = useCallback((message: unknown) => {
    if (message && typeof message === 'object' && 'type' in message) {
      const msg = message as WebSocketMessage;

      if (msg.type === 'metrics' && msg.data) {
        // Backend now sends nested SystemMetrics format directly - no transformation needed
        const metrics = msg.data as SystemMetrics;
        addMetricsToBatch(metrics);
      } else if (msg.type === 'models' && msg.data) {
        // Do NOT process 'models' messages from llama-server
        // Models are loaded from database via 'models_loaded' message
        // Llama-server models don't have database IDs needed for configuration
        console.log('[WebSocketProvider] Ignoring models message from llama-server (use database models via models_loaded)');
      } else if (msg.type === 'models_loaded' && msg.data) {
        // Models loaded from database - process them
        const models = msg.data as ModelConfig[];
        console.log('[WebSocketProvider] Received models from database:', models.length, 'models');
        addModelsToBatch(models);
      } else if (msg.type === 'models_imported' && msg.data) {
        // Models imported successfully - trigger load from database
        console.log('[WebSocketProvider] Models imported successfully, triggering database load');
        websocketServer.sendMessage('load_models', {});
      } else if (msg.type === 'logs' && msg.data) {
        // Batch logs with 1000ms debounce
        const logs = msg.data as LogEntry[];
        console.log('[WebSocketProvider] Received logs batch:', logs.length, 'entries');
        addLogsToQueue(logs, true);
      } else if (msg.type === 'log' && msg.data) {
        // Single log with 500ms debounce
        const log = msg.data as LogEntry;
        console.log('[WebSocketProvider] Received single log:', log);
        addLogsToQueue([log], false);
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
          useStore.getState().setLlamaServerStatus(msg.data as any); // eslint-disable-line @typescript-eslint/no-explicit-any
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
        const dataArray = Array.isArray(msg.data) ? msg.data : [];
        console.log('[WebSocketProvider] Data length:', dataArray.length);
        if (dataArray.length > 0) {
          console.log('[WebSocketProvider] First model name:', (dataArray[0] as ModelConfig)?.name);
          console.log('[WebSocketProvider] First model id:', (dataArray[0] as ModelConfig)?.id);
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
        if (isConfigMessage(msg)) {
          if (msg.success) {
            console.log('[WebSocketProvider] Config saved successfully:', msg.data);
          } else {
            console.error('[WebSocketProvider] Config save failed:', msg.error);
          }
        } else {
          console.warn('[WebSocketProvider] Received config_saved message with unexpected format');
        }
      } else if (msg.type === 'models_imported') {
        // Models imported from llama-server to database
        console.log('[WebSocketProvider] Models imported:', msg.data);
        if (msg.data) {
          useStore.getState().setModels(msg.data as ModelConfig[]);
        }
      }
    }
  }, [addMetricsToBatch, addModelsToBatch, addLogsToQueue]);

  return {
    handleMessage,
  };
}