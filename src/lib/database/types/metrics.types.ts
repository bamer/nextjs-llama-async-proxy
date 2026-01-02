export const METRICS_TABLES = {
  metrics_history: `
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      cpu_usage REAL NOT NULL,
      memory_usage REAL NOT NULL,
      disk_usage REAL NOT NULL,
      gpu_usage REAL NOT NULL,
      gpu_temperature REAL NOT NULL,
      gpu_memory_used REAL NOT NULL,
      gpu_memory_total REAL NOT NULL,
      gpu_power_usage REAL NOT NULL,
      active_models INTEGER NOT NULL,
      uptime INTEGER NOT NULL,
      requests_per_minute REAL NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp);
    CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics_history(created_at);
  `,
} as const;
