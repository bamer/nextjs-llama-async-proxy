/** src/types/monitoring.ts */

export interface SystemMetrics {
  cpu: {
    usage: number;
  };
  memory: {
    used: number;
  };
  disk: {
    used: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  uptime: number;
  gpu?: {
    usage: number;
    memoryUsed: number;
    memoryTotal: number;
    powerUsage: number;
    powerLimit: number;
    temperature: number;
    name?: string;
  };
}

export interface ModelMetrics {
  status: string;
  memory: number;
  requests: number;
}

export interface MonitoringEntry {
  system: SystemMetrics;
  models: ModelMetrics[];
}