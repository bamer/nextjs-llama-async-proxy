/**
 * Centralized type definitions for dashboard components
 * Extracted from src/components/dashboard/ModernDashboard.tsx and related files
 */

export interface ChartDataPoint {
  time: string;
  displayTime: string;
  value: number;
}

export interface ChartHistory {
  cpu: ChartDataPoint[];
  memory: ChartDataPoint[];
  requests: ChartDataPoint[];
  gpuUtil: ChartDataPoint[];
  power: ChartDataPoint[];
}

export interface ChartDataset {
  dataKey: string;
  label: string;
  colorDark: string;
  colorLight: string;
  valueFormatter: (value: number | null) => string;
  data: ChartDataPoint[];
  yAxisLabel?: string;
}

export interface ChartConfig {
  dataKey: string;
  label: string;
  colorDark: string;
  colorLight: string;
  yAxisLabel?: string;
}

export interface DashboardMetrics {
  cpuUsage: number;
  memoryUsage: number;
  totalRequests: number;
  uptime?: number;
  gpuUsage?: number;
  gpuPowerUsage?: number;
  activeConnections?: number;
}

export interface DashboardState {
  isConnected: boolean;
  connectionState: "connected" | "connecting" | "disconnected" | "error";
  loading: boolean;
  serverLoading: boolean;
  serverRunning: boolean;
}

export interface DashboardActions {
  onRefresh: () => void;
  onRestartServer: () => void;
  onStartServer: () => void;
  onDownloadLogs: () => void;
  onToggleModel: (modelId: string) => void;
}

export interface MetricCardData {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}
