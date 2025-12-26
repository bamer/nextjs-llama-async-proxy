import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { MONITORING_CONFIG } from "@/config/monitoring.config";

interface ChartDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  requests: number;
  gpu?: number;
  gpuMemory?: number;
  gpuPower?: number;
}

export function useDashboardMetrics() {
  const metrics = useStore((state) => state.metrics);
  const { isConnected } = require("@/hooks/use-websocket")();
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
    if (metrics && metrics.cpuUsage !== undefined) {
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
    if (metrics && metrics.cpuUsage !== undefined) {
      setChartData((prev) => {
        const hasChanged =
          prev.length === 0 ||
          prev[prev.length - 1].cpu !== metrics.cpuUsage ||
          prev[prev.length - 1].memory !== metrics.memoryUsage ||
          prev[prev.length - 1].requests !== metrics.totalRequests ||
          (metrics.gpuUsage !== undefined &&
            prev[prev.length - 1]?.gpu !== metrics.gpuUsage);

        if (!hasChanged) {
          return prev;
        }

        const timestamp = new Date().toLocaleTimeString();
        const newData: ChartDataPoint = {
          timestamp,
          cpu: metrics.cpuUsage,
          memory: metrics.memoryUsage,
          requests: metrics.totalRequests,
          gpu: metrics.gpuUsage,
          gpuMemory: metrics.gpuMemoryUsage,
          gpuPower: metrics.gpuPowerUsage,
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
