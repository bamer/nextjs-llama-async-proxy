import { apiClient } from "@/utils/api-client";
import { useStore } from "@/lib/store";
import { SystemMetrics, ApiResponse } from "@/types";
import { ChartHistoryData } from "@/types/api-service-types";

class MetricsApiService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = "/api";
  }

  public async getMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get<SystemMetrics>(`${this.baseUrl}/metrics`);
    if (response.success && response.data) {
      // API routes now send nested SystemMetrics format directly - no transformation needed
      const metrics = response.data;
      useStore.getState().setMetrics(metrics);
      return metrics;
    }
    throw new Error(response.error?.message || "Failed to fetch metrics");
  }

  public async getMetricsHistory(params: { limit?: number; hours?: number }): Promise<SystemMetrics[]> {
    const response = await apiClient.get<SystemMetrics[]>(`${this.baseUrl}/metrics/history`, {
      params,
    });
    if (response.success && response.data) {
      // API routes now send nested SystemMetrics format directly - no transformation needed
      return response.data;
    }
    throw new Error(response.error?.message || "Failed to fetch metrics history");
  }

  public async getMonitoringHistory(params?: { minutes?: number }): Promise<ApiResponse<ChartHistoryData>> {
    const response = await apiClient.get<ChartHistoryData>(`${this.baseUrl}/monitoring/history`, { params });
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to fetch monitoring history");
  }

  public async getLatestMonitoring(): Promise<ApiResponse<any>> {
    const response = await apiClient.get<any>(`${this.baseUrl}/monitoring/latest`);
    if (response.success && response.data) {
      return response;
    }
    throw new Error(response.error?.message || "Failed to fetch latest monitoring data");
  }

  public async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    const response = await apiClient.get<SystemMetrics>(`${this.baseUrl}/system/metrics`);
    if (response.success && response.data) {
      // API routes now send nested SystemMetrics format directly - no transformation needed
      const metrics = response.data;
      useStore.getState().setMetrics(metrics);
      return { ...response, data: metrics };
    }
    throw new Error(response.error?.message || "Failed to fetch system metrics");
  }
}

export const metricsApiService = new MetricsApiService();