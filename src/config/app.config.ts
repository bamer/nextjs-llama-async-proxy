export const APP_CONFIG = Object.freeze({
  name: "Llama Runner Pro",
  version: "2.0.0",
  description: "Advanced Llama Model Management System",
  api: Object.freeze({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    websocketUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000",
    timeout: 30000,
  }),
  features: Object.freeze({
    analytics: true,
    realtimeMonitoring: true,
    modelManagement: true,
    authentication: false,
  }),
  theme: Object.freeze({
    default: "system",
    dark: "dark",
    light: "light",
  }),
  cache: Object.freeze({
    ttl: 300,
    maxEntries: 100,
  }),
  sentry: Object.freeze({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  }),
});

export type AppConfig = typeof APP_CONFIG;