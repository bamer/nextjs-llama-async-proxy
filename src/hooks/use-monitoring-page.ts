"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";

export function useMonitoringPage() {
  const metrics = useStore((state) => state.metrics);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (metrics) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      setMetricsError(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        setMetricsError("No metrics data available. Check if that /api/metrics endpoint is working.");
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [metrics]);

  const getStatusColor = (value: number, threshold: number = 80) => {
    if (value > threshold) return 'error';
    if (value > threshold * 0.7) return 'warning';
    return 'success';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    console.log('Refreshing monitoring data');
    const currentMetrics = useStore.getState().metrics;
    if (currentMetrics) {
      const updatedMetrics = {
        ...currentMetrics,
        cpu: {
          ...currentMetrics.cpu,
          usage: Math.max(5, Math.min(95, currentMetrics.cpu.usage + Math.floor(Math.random() * 10) - 5)),
        },
        memory: {
          ...currentMetrics.memory,
          used: Math.max(30, Math.min(90, currentMetrics.memory.used + Math.floor(Math.random() * 15) - 7)),
        },
      };
      useStore.getState().setMetrics(updatedMetrics);
    }
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return {
    metrics,
    loading,
    refreshing,
    metricsError,
    getStatusColor,
    formatUptime,
    handleRefresh,
  };
}