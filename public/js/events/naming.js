// Centralized domain:action event naming constants for Socket.IO
export const Events = Object.freeze({
  MODELS_LIST: "models:list",
  MODELS_UPDATED: "models:updated",
  MODELS_LOAD: "models:load",
  METRICS_SUBSCRIBE: "metrics:subscribe",
  METRICS_UNSUBSCRIBE: "metrics:unsubscribe",
  METRICS_UPDATED: "metrics:updated",
  LOGS_ENTRY: "logs:entry",
  CONFIG_GET: "config:get",
  CONFIG_UPDATE: "config:update",
  LLAMA_STATUS: "llama:status",
  PRESETS_UPDATED: "presets:updated",
});
