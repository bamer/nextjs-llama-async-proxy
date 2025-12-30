import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./database-client";

export interface MetricsData {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  gpu_usage?: number;
  gpu_temperature?: number;
  gpu_memory_used?: number;
  gpu_memory_total?: number;
  gpu_power_usage?: number;
  active_models?: number;
  uptime?: number;
  requests_per_minute?: number;
}

export interface MetricsHistoryEntry {
  id: number;
  timestamp: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  gpu_usage: number;
  gpu_temperature: number;
  gpu_memory_used: number;
  gpu_memory_total: number;
  gpu_power_usage: number;
  active_models: number;
  uptime: number;
  requests_per_minute: number;
  created_at: number;
}

export function saveMetrics(data: MetricsData): void {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      INSERT INTO metrics_history (
        timestamp, cpu_usage, memory_usage, disk_usage, gpu_usage,
        gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
        active_models, uptime, requests_per_minute, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      Date.now(),
      data.cpu_usage ?? 0,
      data.memory_usage ?? 0,
      data.disk_usage ?? 0,
      data.gpu_usage ?? 0,
      data.gpu_temperature ?? 0,
      data.gpu_memory_used ?? 0,
      data.gpu_memory_total ?? 0,
      data.gpu_power_usage ?? 0,
      data.active_models ?? 0,
      data.uptime ?? 0,
      data.requests_per_minute ?? 0,
      Date.now()
    );

    const cleanupStmt = db.prepare(`
      DELETE FROM metrics_history
      WHERE created_at < ?
    `);

    cleanupStmt.run(Date.now() - 10 * 60 * 1000);
  } finally {
    closeDatabase(db);
  }
}

export function getMetricsHistory(minutes: number = 10): MetricsHistoryEntry[] {
  const db = initDatabase();
  const cutoffTime = Date.now() - minutes * 60 * 1000;

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      WHERE created_at >= ?
      ORDER BY timestamp ASC
    `);

    const entries = stmt.all(cutoffTime) as MetricsHistoryEntry[];
    return entries;
  } finally {
    closeDatabase(db);
  }
}

export function getLatestMetrics(): MetricsData | null {
  const db = initDatabase();

  try {
    const row = db.prepare(`
      SELECT cpu_usage, memory_usage, disk_usage, gpu_usage,
             gpu_temperature, gpu_memory_used, gpu_memory_total, gpu_power_usage,
             active_models, uptime, requests_per_minute
      FROM metrics_history
      ORDER BY timestamp DESC
      LIMIT 1
    `).get() as MetricsData | undefined;

    if (!row) return null;
    return row;
  } finally {
    closeDatabase(db);
  }
}

export function getMetricsByTimeRange(startTime: number, endTime: number): MetricsHistoryEntry[] {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `);

    const entries = stmt.all(startTime, endTime) as MetricsHistoryEntry[];
    return entries;
  } finally {
    closeDatabase(db);
  }
}

export function calculateAverages(entries: MetricsHistoryEntry[]): {
  avg_cpu: number;
  avg_memory: number;
  avg_gpu: number;
} {
  if (entries.length === 0) {
    return { avg_cpu: 0, avg_memory: 0, avg_gpu: 0 };
  }

  const sumCpu = entries.reduce((sum, entry) => sum + entry.cpu_usage, 0);
  const sumMemory = entries.reduce((sum, entry) => sum + entry.memory_usage, 0);
  const sumGpu = entries.reduce((sum, entry) => sum + entry.gpu_usage, 0);

  return {
    avg_cpu: sumCpu / entries.length,
    avg_memory: sumMemory / entries.length,
    avg_gpu: sumGpu / entries.length,
  };
}

export function calculateTotals(entries: MetricsHistoryEntry[]): {
  total_requests: number;
  total_active_models: number;
  max_uptime: number;
} {
  if (entries.length === 0) {
    return { total_requests: 0, total_active_models: 0, max_uptime: 0 };
  }

  const sumRequests = entries.reduce((sum, entry) => sum + entry.requests_per_minute, 0);
  const maxActiveModels = Math.max(...entries.map((entry) => entry.active_models));
  const maxUptime = Math.max(...entries.map((entry) => entry.uptime));

  return {
    total_requests: sumRequests,
    total_active_models: maxActiveModels,
    max_uptime: maxUptime,
  };
}
