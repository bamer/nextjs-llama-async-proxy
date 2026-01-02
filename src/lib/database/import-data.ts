import Database from "better-sqlite3";

/**
 * Import database data with detailed SQL
 * @param actualDb - Database instance
 * @param actualPath - File path to import from
 */
export function importDatabaseData(actualDb: Database.Database, actualPath: string): void {
  actualDb.exec(`ATTACH DATABASE '${actualPath}' AS backup`);
  actualDb.exec(`
    INSERT INTO main.metrics_history
    SELECT * FROM backup.metrics_history
    WHERE NOT EXISTS (
      SELECT 1 FROM main.metrics_history WHERE main.metrics_history.id = backup.metrics_history.id
    );

    INSERT INTO main.models
    SELECT * FROM backup.models
    WHERE NOT EXISTS (
      SELECT 1 FROM main.models WHERE main.models.id = backup.models.id
    );

    INSERT INTO main.model_sampling_config
    SELECT * FROM backup.model_sampling_config
    WHERE NOT EXISTS (
      SELECT 1 FROM main.model_sampling_config WHERE main.model_sampling_config.id = backup.model_sampling_config.id
    );

    INSERT INTO main.model_memory_config
    SELECT * FROM backup.model_memory_config
    WHERE NOT EXISTS (
      SELECT 1 FROM main.model_memory_config WHERE main.model_memory_config.id = backup.model_memory_config.id
    );

    INSERT INTO main.model_gpu_config
    SELECT * FROM backup.model_gpu_config
    WHERE NOT EXISTS (
      SELECT 1 FROM main.model_gpu_config WHERE main.model_gpu_config.id = backup.model_gpu_config.id
    );

    INSERT INTO main.model_advanced_config
    SELECT * FROM backup.model_advanced_config
    WHERE NOT EXISTS (
      SELECT 1 FROM main.model_advanced_config WHERE main.model_advanced_config.id = backup.model_advanced_config.id
    );

    INSERT INTO main.model_lora_config
    SELECT * FROM backup.model_lora_config
    WHERE NOT EXISTS (
      SELECT 1 FROM main.model_lora_config WHERE main.model_lora_config.id = backup.model_lora_config.id
    );

    INSERT INTO main.model_multimodal_config
    SELECT * FROM backup.model_multimodal_config
    WHERE NOT EXISTS (
      SELECT 1 FROM main.model_multimodal_config WHERE main.model_multimodal_config.id = backup.model_multimodal_config.id
    );

    INSERT OR REPLACE INTO main.model_server_config
    SELECT * FROM backup.model_server_config;

    INSERT OR REPLACE INTO main.metadata
    SELECT * FROM backup.metadata;

    DETACH DATABASE backup;
  `);
}
