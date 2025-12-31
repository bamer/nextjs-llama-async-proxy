/**
 * Zustand store types and interfaces
 */

import { ThemeMode } from '@/contexts/ThemeContext';
import { SystemMetrics as MonitoringSystemMetrics } from '@/types/monitoring';

// Re-export SystemMetrics from monitoring for store usage
export type SystemMetrics = MonitoringSystemMetrics;

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

export interface AppState {
  models: ModelConfig[];
  activeModelId: string | null;
  metrics: SystemMetrics | null;
  logs: LogEntry[];
  settings: {
    theme: ThemeMode;
    notifications: boolean;
    autoRefresh: boolean;
  };
  status: {
    isLoading: boolean;
    error: string | null;
    llamaServerStatus: 'running' | 'stopped' | 'unknown';
  };
  chartHistory: ChartHistory;
}

export interface AppActions {
  setModels: (models: ModelConfig[]) => void;
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, updates: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  setActiveModel: (id: string | null) => void;
  setMetrics: (metrics: SystemMetrics) => void;
  addLog: (log: LogEntry) => void;
  setLogs: (logs: LogEntry[]) => void;
  clearLogs: () => void;
  setLlamaServerStatus: (status: 'running' | 'stopped' | 'unknown') => void;
  addChartData: (type: keyof ChartHistory, value: number) => void;
  setChartData: (data: ChartHistory) => void;
  trimChartData: (maxPoints?: number) => void;
  clearChartData: () => void;
  rebuildChartHistory: (metrics: SystemMetrics) => void;
  updateSettings: (updates: Partial<AppState['settings']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type AppStore = AppState & AppActions;
