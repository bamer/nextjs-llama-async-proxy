import { APP_CONFIG } from "@config/app.config";

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
  type AsyncReturnType<T extends (...args: any) => Promise<any>> = T extends (
    ...args: any
  ) => Promise<infer R>
    ? R
    : any;

  interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
    timestamp: string;
  }

  interface PaginatedResponse<T = any> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }

  interface WebSocketMessage<T = any> {
    type: string;
    data: T;
    timestamp: number;
    requestId?: string;
  }

  interface ModelConfig {
    id: string;
    name: string;
    type: "llama" | "mistral" | "other";
    parameters: Record<string, any>;
    status: "idle" | "loading" | "running" | "error";
    createdAt: string;
    updatedAt: string;
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
  }

  interface LogEntry {
    id: string;
    level: "info" | "warn" | "error" | "debug";
    message: string;
    timestamp: string;
    context?: Record<string, any>;
  }
}