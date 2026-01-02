import { useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { SystemMetrics, ModelConfig, LogEntry } from "@/types";

export function useWebSocketDataBatching() {
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

  // Add metrics to batch
  const addMetricsToBatch = useCallback((metrics: SystemMetrics) => {
    metricsBatchRef.current.push(metrics);
    if (!metricsThrottleRef.current) {
      metricsThrottleRef.current = setTimeout(processMetricsBatch, 500);
    }
  }, [processMetricsBatch]);

  // Add models to batch
  const addModelsToBatch = useCallback((models: ModelConfig[]) => {
    modelsBatchRef.current.push(models);
    if (!modelsThrottleRef.current) {
      modelsThrottleRef.current = setTimeout(processModelsBatch, 500);
    }
  }, [processModelsBatch]);

  // Add logs to queue
  const addLogsToQueue = useCallback((logs: LogEntry[], isBatch: boolean = true) => {
    if (isBatch) {
      logQueueRef.current.push(...logs);
    } else {
      logQueueRef.current.push(logs[0]); // Single log
    }
    if (!logThrottleRef.current) {
      const delay = isBatch ? 1000 : 500;
      logThrottleRef.current = setTimeout(processLogQueue, delay);
    }
  }, [processLogQueue]);

  // Flush all batches (for cleanup)
  const flushBatches = useCallback(() => {
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
  }, [processLogQueue, processMetricsBatch, processModelsBatch]);

  return {
    addMetricsToBatch,
    addModelsToBatch,
    addLogsToQueue,
    flushBatches,
  };
}