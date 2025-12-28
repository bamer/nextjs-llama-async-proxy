/**
 * Mock type definitions for test fixtures
 * These types replace `any` usage with proper TypeScript typing
 */

// Component mock types
export interface MockModelConfig {
  id: string;
  name: string;
  status: "idle" | "loading" | "running" | "error";
  type: "llama" | "mistral" | "other";
  template?: string;
  availableTemplates?: string[];
  progress?: number;
}

export interface MockMetrics {
  cpuUsage: number;
  memoryUsage: number;
  totalRequests: number;
  uptime?: number;
  gpuUsage?: number;
  gpuPowerUsage?: number;
}

export interface MockLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface MockApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Component prop types
export interface MockComponentProps {
  isDark: boolean;
  isMobile?: boolean;
  onToggle?: () => void;
  onStart?: () => void;
  onStop?: () => void;
}

// Chart data types
export interface MockChartDataPoint {
  time: string;
  displayTime: string;
  value: number;
}

export interface MockChartHistory {
  cpu: MockChartDataPoint[];
  memory: MockChartDataPoint[];
  requests: MockChartDataPoint[];
  gpuUtil: MockChartDataPoint[];
  power: MockChartDataPoint[];
}

// WebSocket message types
export interface MockWebSocketMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
  requestId?: string;
}

// Store mock types
export interface MockStoreState {
  models: MockModelConfig[];
  metrics: MockMetrics | null;
  logs: MockLogEntry[];
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
    autoRefresh: boolean;
  };
  chartHistory: MockChartHistory;
}

// API response types
export interface MockModelsResponse {
  models: MockModelConfig[];
  totalCount: number;
  page?: number;
}

export interface MockMetricsResponse {
  metrics: MockMetrics;
  lastUpdated: string;
}

export interface MockLogsResponse {
  logs: MockLogEntry[];
  totalCount: number;
}

// Utility types
export type MockAsyncReturnType<T> = T extends (...args: unknown[]) => infer R
  ? R
  : unknown;
