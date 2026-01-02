import type { SystemMetrics, ModelConfig, LogEntry } from "@/types";
import { useStore } from "@/lib/store";
import { websocketServer } from "@/lib/websocket-client";

interface BaseMessage {
  type: string;
  data?: unknown;
}

interface ConfigMessage extends BaseMessage {
  type: 'config_saved';
  success: boolean;
  error?: string;
  data?: unknown;
}

type WebSocketMessage = BaseMessage | ConfigMessage;

function isConfigMessage(msg: WebSocketMessage): msg is ConfigMessage {
  return msg.type === 'config_saved' && 'success' in msg;
}

export interface MessageHandlerProps {
  metricsBatchRef: React.MutableRefObject<SystemMetrics[]>;
  metricsThrottleRef: React.MutableRefObject<NodeJS.Timeout | null>;
  modelsBatchRef: React.MutableRefObject<ModelConfig[][]>;
  modelsThrottleRef: React.MutableRefObject<NodeJS.Timeout | null>;
  logQueueRef: React.MutableRefObject<LogEntry[]>;
  logThrottleRef: React.MutableRefObject<NodeJS.Timeout | null>;
  processMetricsBatch: () => void;
  processModelsBatch: () => void;
  processLogQueue: () => void;
}

export function handleMessage(
  message: unknown,
  props: MessageHandlerProps,
): void {
  if (message && typeof message === 'object' && 'type' in message) {
    const msg = message as WebSocketMessage;

    if (msg.type === 'metrics' && msg.data) {
      const metrics = msg.data as SystemMetrics;
      props.metricsBatchRef.current.push(metrics);
      if (!props.metricsThrottleRef.current) {
        props.metricsThrottleRef.current = setTimeout(props.processMetricsBatch, 500);
      }
    } else if (msg.type === 'models') {
      console.log('[WebSocketProvider] Ignoring models message from llama-server (use database models via models_loaded)');
    } else if (msg.type === 'models_loaded' && msg.data) {
      const models = msg.data as ModelConfig[];
      console.log('[WebSocketProvider] Received models from database:', models.length, 'models');
      props.modelsBatchRef.current.push(models);
      if (!props.modelsThrottleRef.current) {
        props.modelsThrottleRef.current = setTimeout(props.processModelsBatch, 500);
      }
    } else if (msg.type === 'models_imported' && msg.data) {
      console.log('[WebSocketProvider] Models imported successfully, triggering database load');
      websocketServer.sendMessage('load_models', {});
    } else if (msg.type === 'logs' && msg.data) {
      const logs = msg.data as LogEntry[];
      console.log('[WebSocketProvider] Received logs batch:', logs.length, 'entries');
      props.logQueueRef.current.push(...logs);
      if (!props.logThrottleRef.current) {
        props.logThrottleRef.current = setTimeout(props.processLogQueue, 1000);
      }
    } else if (msg.type === 'log' && msg.data) {
      const log = msg.data as LogEntry;
      console.log('[WebSocketProvider] Received single log:', log);
      props.logQueueRef.current.push(log);
      if (!props.logThrottleRef.current) {
        props.logThrottleRef.current = setTimeout(props.processLogQueue, 500);
      }
    } else if (msg.type === 'status' && msg.data) {
      console.log('[WebSocketProvider] Received llama-server status:', msg.data);
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
    } else if (msg.type === 'llamaServerStatus') {
      console.log('[WebSocketProvider] LlamaServer status:', msg.data);
      useStore.getState().setLlamaServerStatus(msg.data as any);
    } else if (msg.type === 'config_saved') {
      if (isConfigMessage(msg)) {
        if (msg.success) {
          console.log('[WebSocketProvider] Config saved successfully:', msg.data);
        } else {
          console.error('[WebSocketProvider] Config save failed:', msg.error);
        }
      } else {
        console.warn('[WebSocketProvider] Received config_saved message with unexpected format');
      }
    }
  }
}

export { isConfigMessage };
export type { WebSocketMessage };
