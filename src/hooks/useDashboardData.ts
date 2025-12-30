"use client";

import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useApi } from "@/hooks/use-api";
import type { Model, SystemMetrics } from "@/types";

export function useDashboardData() {
  const { isConnected, connectionState, requestMetrics, on, off } = useWebSocket();

  const modelsQuery = useApi<Model[]>("/api/models");
  const metricsQuery = useApi<SystemMetrics>("/api/metrics");

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Handle metrics updates from WebSocket
  const handleMetricsUpdate = useCallback((data: unknown) => {
    try {
      const metricsData = data as SystemMetrics;
      setMetrics(metricsData);
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
  }, [isConnected, requestMetrics, on, off, handleMetricsUpdate]);

  // Fallback to API metrics when WebSocket is disconnected
  useEffect(() => {
    if (!isConnected && metricsQuery.data) {
      setMetrics(metricsQuery.data);
    }
  }, [isConnected, metricsQuery.data]);

  // Update loading and error states
  useEffect(() => {
    const modelsLoading = modelsQuery.isLoading;
    const metricsLoading = metricsQuery.isLoading;
    const modelsError = modelsQuery.error;
    const metricsError = metricsQuery.error;

    setLoading(modelsLoading || metricsLoading);

    if (modelsError) {
      setError(modelsError instanceof Error ? modelsError.message : "Failed to load models");
    } else if (metricsError) {
      setError(metricsError instanceof Error ? metricsError.message : "Failed to load metrics");
    }
  }, [modelsQuery.isLoading, metricsQuery.isLoading, modelsQuery.error, metricsQuery.error]);

  // Combined models data from query
  const models: Model[] = modelsQuery.data || [];

  return {
    models,
    metrics,
    loading,
    error,
    connectionState,
  };
}
