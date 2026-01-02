import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./connection-pool";

/**
 * Clear all data from all tables (for testing)
 * @warning This will delete all data from the database
 * @param db - Optional database instance (will create one if not provided)
 */
export function clearAllTables(db?: Database.Database): void {
  const shouldClose = !db;
  const actualDb = db || initDatabase();

  try {
    actualDb.exec("DELETE FROM model_fit_params");
    actualDb.exec("DELETE FROM model_sampling_config");
    actualDb.exec("DELETE FROM model_memory_config");
    actualDb.exec("DELETE FROM model_gpu_config");
    actualDb.exec("DELETE FROM model_advanced_config");
    actualDb.exec("DELETE FROM model_lora_config");
    actualDb.exec("DELETE FROM model_multimodal_config");
    actualDb.exec("DELETE FROM models");
    actualDb.exec("DELETE FROM metrics_history");
    console.log("All tables cleared");
  } finally {
    if (shouldClose) {
      closeDatabase(actualDb);
    }
  }
}
