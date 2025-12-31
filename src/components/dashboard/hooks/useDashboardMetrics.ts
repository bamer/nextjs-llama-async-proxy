import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import type { AppStore } from "@/lib/store/types";
import { MONITORING_CONFIG } from "@/config/monitoring.config";
import { useWebSocket } from "@/hooks/use-websocket";

interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  requests: number;
  gpu: number;
  gpuMemory: number;
  gpuPower: number;
}

export function useDashboardMetrics() {
  const metrics = useStore((state: AppStore) => state.metrics);
  const { isConnected } = useWebSocket();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle connection state
  useEffect(() => {
    if (isConnected) {
      setLoading(false);
    }
  }, [isConnected]);

  // Handle metrics update
  useEffect(() => {
    if (metrics && metrics.cpu?.usage !== undefined) {
      setLoading(false);
    }
  }, [metrics]);

  // Connection timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Connection timeout - setting loading to false");
        setLoading(false);
      }
    }, MONITORING_CONFIG.WEBSOCKET.CONNECTION_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Update chart data
  useEffect(() => {
    if (metrics && metrics.cpu?.usage !== undefined) {
      setChartData((prev) => {
        const cpuUsage = metrics.cpu?.usage ?? 0;
        const memoryUsage = metrics.memory?.used ?? 0;

        const hasChanged =
          prev.length === 0 ||
          prev[prev.length - 1].cpu !== cpuUsage ||
          prev[prev.length - 1].memory !== memoryUsage;

        if (!hasChanged) {
          return prev;
        }

        const timestamp = new Date().toLocaleTimeString();
        const newData: ChartDataPoint = {
          timestamp,
          cpu: cpuUsage,
          memory: memoryUsage,
          requests: 0, // Not available in new format
          gpu: 0, // Not available in new format
          gpuMemory: 0, // Not available in new format
          gpuPower: 0, // Not available in new format
        };

        return [...prev, newData].slice(-20);
      });
    }
  }, [metrics]);

  return {
    metrics,
    chartData,
    loading,
    isConnected,
  };
}
