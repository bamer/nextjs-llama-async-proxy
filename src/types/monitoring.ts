/** src/types/monitoring.ts */
export interface MonitoringEntry {
  system: {
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
  };
  models: Array<{
    status: string;
    memory: number;
    requests: number;
  }>;
}