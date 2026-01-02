import { useCallback, useRef } from "react";
import type { SystemMetrics, ModelConfig, LogEntry } from "@/types";
import { useStore } from "@/lib/store";

export interface BatchingRefs {
  metricsBatchRef: React.RefObject<SystemMetrics[]>;
  metricsThrottleRef: React.RefObject<NodeJS.Timeout | null>;
  modelsBatchRef: React.RefObject<ModelConfig[][]>;
  modelsThrottleRef: React.RefObject<NodeJS.Timeout | null>;
  logQueueRef: React.RefObject<LogEntry[]>;
  logThrottleRef: React.RefObject<NodeJS.Timeout | null>;
}

export function useWebSocketStateManager(): BatchingRefs & {
  processMetricsBatch: () => void;
  processModelsBatch: () => void;
  processLogQueue: () => void;
} {
  const metricsBatchRef = useRef<SystemMetrics[]>([]);
  const metricsThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const modelsBatchRef = useRef<ModelConfig[][]>([]);
  const modelsThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const logQueueRef = useRef<LogEntry[]>([]);
  const logThrottleRef = useRef<NodeJS.Timeout | null>(null);

  const processMetricsBatch = useCallback(() => {
    if (metricsBatchRef.current.length > 0) {
      const latestMetrics = metricsBatchRef.current[metricsBatchRef.current.length - 1];
      useStore.getState().setMetrics(latestMetrics);
      metricsBatchRef.current = [];
    }
    metricsThrottleRef.current = null;
  }, []);

  const processModelsBatch = useCallback(() => {
    if (modelsBatchRef.current.length > 0) {
      const latestModels = modelsBatchRef.current[modelsBatchRef.current.length - 1];
      useStore.getState().setModels(latestModels);
      modelsBatchRef.current = [];
    }
    modelsThrottleRef.current = null;
  }, []);

  const processLogQueue = useCallback(() => {
    if (logQueueRef.current.length > 0) {
      logQueueRef.current.forEach((log) => {
        useStore.getState().addLog(log);
      });
      logQueueRef.current = [];
    }
    logThrottleRef.current = null;
  }, []);

  return {
    metricsBatchRef,
    metricsThrottleRef,
    modelsBatchRef,
    modelsThrottleRef,
    logQueueRef,
    logThrottleRef,
    processMetricsBatch,
    processModelsBatch,
    processLogQueue,
  };
}
