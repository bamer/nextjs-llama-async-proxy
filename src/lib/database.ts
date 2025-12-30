import Database from "better-sqlite3";
import { initDatabase, closeDatabase, getDatabaseSize } from "./database/database-client";
import type {
  ModelConfig,
  ModelSamplingConfig,
  ModelMemoryConfig,
  ModelGpuConfig,
  ModelAdvancedConfig,
  ModelLoraConfig,
  ModelMultimodalConfig,
  ModelFitParams,
  ModelServerConfig,
} from "./database/models-service";
import type {
  MetricsData,
  MetricsHistoryEntry,
} from "./database/metrics-service";
import type { LogEntry } from "./database/logs-service";
import type { MetricsHistoryEntry as HistoryEntry } from "./database/monitoring-service";

export {
  initDatabase,
  closeDatabase,
  getDatabaseSize,
  setMetadata,
  getMetadata,
  deleteMetadata,
  vacuumDatabase,
  exportDatabase,
  importDatabase,
} from "./database/database-client";

export {
  saveModel,
  saveModelFitParams,
  saveServerConfig,
  getModels,
  getModelById,
  getModelByName,
  getModelFitParams,
  shouldReanalyzeFitParams,
  getServerConfig,
  updateModel,
  deleteModel,
  deleteAllModels,
  type ModelConfig,
  type ModelSamplingConfig,
  type ModelMemoryConfig,
  type ModelGpuConfig,
  type ModelAdvancedConfig,
  type ModelLoraConfig,
  type ModelMultimodalConfig,
  type ModelFitParams,
  type ModelServerConfig,
} from "./database/models-service";

export {
  saveMetrics,
  getMetricsHistory,
  getLatestMetrics,
  getMetricsByTimeRange,
  calculateAverages,
  calculateTotals,
  type MetricsData,
  type MetricsHistoryEntry,
} from "./database/metrics-service";

export {
  getLogs,
  getLogsByLevel,
  getLogsByTimeRange,
  filterBySource,
  filterByLevel,
  insertLog,
  deleteLogsOlderThan,
  deleteLogsByLevel,
  deleteLogsBySource,
  clearAllLogs,
  type LogEntry,
} from "./database/logs-service";

export {
  getHistory,
  getHistoryByTimeRange,
  getHistoryWithSampling,
  deleteOldHistory,
  deleteHistoryByTimeRange,
  clearAllHistory,
  getHistoryCount,
  getHistorySizeBytes,
  getOldestHistoryEntry,
  getNewestHistoryEntry,
  type MetricsHistoryEntry as HistoryEntry,
} from "./database/monitoring-service";

export * from "./database/models-service";
export * from "./database/metrics-service";
export * from "./database/logs-service";
export * from "./database/monitoring-service";

export type { Database } from "better-sqlite3";
