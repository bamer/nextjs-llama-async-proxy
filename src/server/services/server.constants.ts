export const METRICS_BROADCAST_INTERVAL = 10000; // 10 seconds

export const LLAMA_SERVER_HOST = process.env.LLAMA_SERVER_HOST || "localhost";
export const LLAMA_SERVER_PORT = process.env.LLAMA_SERVER_PORT || "8134";

export const MODEL_STATUS_MAP = {
  loaded: "running",
} as const;

export const CONFIG_TYPES = {
  SAMPLING: "sampling",
  MEMORY: "memory",
  GPU: "gpu",
  ADVANCED: "advanced",
  LORA: "lora",
  MULTIMODAL: "multimodal",
} as const;
