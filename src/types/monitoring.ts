/** src/types/monitoring.ts */
export interface MonitoringEntry {
  cpuUsage: number;
  memoryUsage: number;
  activeModels: number;
  totalRequests: number;
  avgResponseTime: number;
  timestamp: string;
}