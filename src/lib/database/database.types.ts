import Database from "better-sqlite3";
import { MODEL_TABLES } from "./types/model.types";
import { CONFIG_TABLES } from "./types/config.types";
import { METRICS_TABLES } from "./types/metrics.types";

export const TABLE_SCHEMAS = {
  ...MODEL_TABLES,
  ...CONFIG_TABLES,
  ...METRICS_TABLES,
} as const;

export function createTables(db: Database.Database): void {
  db.exec(TABLE_SCHEMAS.metrics_history);
  db.exec(TABLE_SCHEMAS.models);
  db.exec(TABLE_SCHEMAS.model_fit_params);
  db.exec(TABLE_SCHEMAS.model_sampling_config);
  db.exec(TABLE_SCHEMAS.model_memory_config);
  db.exec(TABLE_SCHEMAS.model_gpu_config);
  db.exec(TABLE_SCHEMAS.model_advanced_config);
  db.exec(TABLE_SCHEMAS.model_lora_config);
  db.exec(TABLE_SCHEMAS.model_multimodal_config);
  db.exec(TABLE_SCHEMAS.model_server_config);
  db.exec(TABLE_SCHEMAS.metadata);
}

export { MODEL_TABLES, CONFIG_TABLES, METRICS_TABLES };
