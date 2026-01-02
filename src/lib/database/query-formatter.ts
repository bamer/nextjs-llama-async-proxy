/**
 * Format error message for database operations
 * @param operation - Name of the operation
 * @param details - Additional error details
 * @returns Formatted error message
 */
export function formatDbError(operation: string, details: string): string {
  return `Database ${operation} failed: ${details}`;
}

/**
 * Format success message for database operations
 * @param operation - Name of the operation
 * @param details - Additional success details
 * @returns Formatted success message
 */
export function formatDbSuccess(operation: string, details?: string): string {
  if (details) {
    return `Database ${operation} succeeded: ${details}`;
  }
  return `Database ${operation} succeeded`;
}

/**
 * Format warning message for database operations
 * @param operation - Name of the operation
 * @param details - Additional warning details
 * @returns Formatted warning message
 */
export function formatDbWarning(operation: string, details: string): string {
  return `Database ${operation} warning: ${details}`;
}

/**
 * Format metadata value for storage
 * @param value - Value to format
 * @returns Formatted string value
 */
export function formatMetadataValue(value: string): string {
  return String(value);
}

/**
 * Format export file path
 * @param filePath - File path to format
 * @returns Normalized file path
 */
export function formatExportPath(filePath: string): string {
  return filePath.trim();
}

/**
 * Format import file path
 * @param filePath - File path to format
 * @returns Normalized file path
 */
export function formatImportPath(filePath: string): string {
  return filePath.trim();
}

/**
 * Get SQL for exporting database
 * @param filePath - Destination file path
 * @returns SQL statement
 */
export function formatExportSql(filePath: string): string {
  return `VACUUM INTO '${filePath}'`;
}

/**
 * Get SQL for attaching backup database for import
 * @param filePath - Backup database path
 * @returns SQL statement
 */
export function formatAttachBackupSql(filePath: string): string {
  return `ATTACH DATABASE '${filePath}' AS backup`;
}

/**
 * Get SQL for detaching backup database
 * @returns SQL statement
 */
export function formatDetachBackupSql(): string {
  return "DETACH DATABASE backup";
}

/**
 * Format INSERT OR REPLACE SQL statement
 * @param tableName - Table name
 * @param columns - Column names (comma-separated)
 * @returns SQL statement
 */
export function formatInsertOrReplaceSql(
  tableName: string,
  columns: string
): string {
  return `INSERT OR REPLACE INTO ${tableName} ${columns}`;
}

/**
 * Format INSERT SQL statement with WHERE NOT EXISTS clause
 * @param tableName - Target table name
 * @param columns - Column names to insert
 * @param conditionColumns - Columns for WHERE NOT EXISTS clause
 * @returns SQL statement
 */
export function formatInsertIfNotExistsSql(
  tableName: string,
  columns: string,
  conditionColumns: string
): string {
  return `
    INSERT INTO ${tableName} ${columns}
    SELECT * FROM backup.${tableName}
    WHERE NOT EXISTS (
      SELECT 1 FROM ${tableName} WHERE ${conditionColumns}
    )
  `;
}

/**
 * Format SQL for clearing a table
 * @param tableName - Table name
 * @returns SQL statement
 */
export function formatClearTableSql(tableName: string): string {
  return `DELETE FROM ${tableName}`;
}

/**
 * Get list of tables to import from backup
 * @returns Array of table names and their SQL
 */
export function getImportTableQueries(): string[] {
  return [
    formatInsertIfNotExistsSql(
      "main.metrics_history",
      "SELECT * FROM backup.metrics_history",
      "main.metrics_history.id = backup.metrics_history.id"
    ),
    formatInsertIfNotExistsSql(
      "main.models",
      "SELECT * FROM backup.models",
      "main.models.id = backup.models.id"
    ),
    formatInsertIfNotExistsSql(
      "main.model_sampling_config",
      "SELECT * FROM backup.model_sampling_config",
      "main.model_sampling_config.id = backup.model_sampling_config.id"
    ),
    formatInsertIfNotExistsSql(
      "main.model_memory_config",
      "SELECT * FROM backup.model_memory_config",
      "main.model_memory_config.id = backup.model_memory_config.id"
    ),
    formatInsertIfNotExistsSql(
      "main.model_gpu_config",
      "SELECT * FROM backup.model_gpu_config",
      "main.model_gpu_config.id = backup.model_gpu_config.id"
    ),
    formatInsertIfNotExistsSql(
      "main.model_advanced_config",
      "SELECT * FROM backup.model_advanced_config",
      "main.model_advanced_config.id = backup.model_advanced_config.id"
    ),
    formatInsertIfNotExistsSql(
      "main.model_lora_config",
      "SELECT * FROM backup.model_lora_config",
      "main.model_lora_config.id = backup.model_lora_config.id"
    ),
    formatInsertIfNotExistsSql(
      "main.model_multimodal_config",
      "SELECT * FROM backup.model_multimodal_config",
      "main.model_multimodal_config.id = backup.model_multimodal_config.id"
    ),
    formatInsertOrReplaceSql(
      "main.model_server_config",
      "SELECT * FROM backup.model_server_config"
    ),
    formatInsertOrReplaceSql(
      "main.metadata",
      "SELECT * FROM backup.metadata"
    ),
    formatDetachBackupSql(),
  ];
}
