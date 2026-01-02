

interface Config {
  basePath: string;
  logLevel: string;
  maxConcurrentModels: number;
  autoUpdate: boolean;
  notificationsEnabled: boolean;
  modelDefaults: ModelDefaults;
}

interface ModelDefaults {
  ctx_size: number;
  batch_size: number;
  temperature: number;
  top_p: number;
  top_k: number;
  gpu_layers: number;
  threads: number;
}

type TabType = "general" | "modelDefaults";

export type { Config, ModelDefaults, TabType };
