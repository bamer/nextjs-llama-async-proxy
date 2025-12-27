import { APP_CONFIG } from "@/config/app.config";

declare global {
  interface Window {
    __APP_CONFIG__: typeof APP_CONFIG;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_WS_URL: string;
      NEXT_PUBLIC_SENTRY_DSN: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }

  type Nullable<T> = T | null;
  type Optional<T> = T | undefined;

  type AsyncReturnType<T extends (...args: unknown[]) => unknown> = T extends (
    ...args: unknown[]
  ) => Promise<infer R>
    ? R
    : never;

  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: unknown;
    };
    timestamp: string;
  }

  interface PaginatedResponse<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }

  interface WebSocketMessage<T = unknown> {
    type: string;
    data: T;
    timestamp: number;
    requestId?: string;
  }

  interface ModelConfig {
    id: string;
    name: string;
    type: "llama" | "mistral" | "other";
    parameters: Record<string, unknown>;
    status: "idle" | "loading" | "running" | "error";
    createdAt: string;
    updatedAt: string;
    template?: string;
    availableTemplates?: string[];
  }

  interface SystemMetrics {
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

  interface LogEntry {
    id: string;
    level: "info" | "warn" | "error" | "debug";
    message: string | Record<string, unknown>;
    timestamp: string;
    source?: string;
    context?: Record<string, unknown>;
  }
}

export type { ModelConfig, SystemMetrics, LogEntry, ApiResponse, WebSocketMessage, AsyncReturnType, Nullable, Optional, PaginatedResponse };
