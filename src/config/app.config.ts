export const APP_CONFIG = {
  name: "Llama Runner Pro",
  version: "2.0.0",
  description: "Advanced Llama Model Management System",
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
    websocketUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001",
    timeout: 30000,
  },
  features: {
    analytics: true,
    realtimeMonitoring: true,
    modelManagement: true,
    authentication: false,
  },
  theme: {
    default: "system",
    dark: "dark",
    light: "light",
  },
  cache: {
    ttl: 300,
    maxEntries: 100,
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;