"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useApi } from "@/hooks/use-api";
import type { SystemMetrics } from "@/types/monitoring";

// Old metrics format from WebSocket/API (global.d.ts)
interface OldSystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeModels: number;
  totalRequests: number;
  avgResponseTime: number;
  uptime: number;
  timestamp: string;
  gpuUsage?: number;
  gpuMemoryUsage?: number;
  gpuMemoryTotal?: number;
  gpuMemoryUsed?: number;
  gpuPowerUsage?: number;
  gpuPowerLimit?: number;
  gpuTemperature?: number;
  gpuName?: string;
}

// Transform old flat metrics format to new nested format
function transformMetrics(oldMetrics: OldSystemMetrics): SystemMetrics {
  return {
    cpu: { usage: oldMetrics.cpuUsage },
    memory: { used: oldMetrics.memoryUsage },
    disk: { used: oldMetrics.diskUsage },
    network: { rx: 0, tx: 0 }, // Not available in old format
    uptime: oldMetrics.uptime,
  };
}

export function useDashboardData() {
  const { isConnected, connectionState, requestMetrics, on, off } = useWebSocket();

  const apiData = useApi();

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Handle metrics updates from WebSocket
  const handleMetricsUpdate = useCallback((data: unknown) => {
    try {
      // WebSocket sends old format - transform to new format
      const oldMetrics = data as OldSystemMetrics;
      const newMetrics = transformMetrics(oldMetrics);
      setMetrics(newMetrics);
      setError(null);
    } catch (err) {
      console.error("Failed to parse metrics data:", err);
      setError("Failed to parse metrics data");
    }
  }, []);

  // Request metrics via WebSocket when connected
  useEffect(() => {
    if (isConnected) {
      requestMetrics();
      on("metrics", handleMetricsUpdate);

      return () => {
        off("metrics", handleMetricsUpdate);
      };
    }
    return;
  }, [isConnected, requestMetrics, on, off, handleMetricsUpdate]);

  // Fallback to API metrics when WebSocket is disconnected
  useEffect(() => {
    if (!isConnected && apiData.metrics.data) {
      setMetrics(apiData.metrics.data);
    }
  }, [isConnected, apiData.metrics.data]);

  // Update loading and error states
  useEffect(() => {
    const modelsLoading = apiData.models.isLoading;
    const metricsLoading = apiData.metrics.isLoading;
    const modelsError = apiData.models.error;
    const metricsError = apiData.metrics.error;

    setLoading(modelsLoading || metricsLoading);

    if (modelsError) {
      setError(modelsError instanceof Error ? modelsError.message : "Failed to load models");
    } else if (metricsError) {
      setError(metricsError instanceof Error ? metricsError.message : "Failed to load metrics");
    }
  }, [apiData.models.isLoading, apiData.metrics.isLoading, apiData.models.error, apiData.metrics.error]);

  // Combined models data from query
  const models = apiData.models.data || [];

  return {
    models,
    metrics,
    loading,
    error,
    isConnected,
    connectionState,
  };
}
