/**
 * Database Client - Main orchestration module
 * Refactored to use extracted submodules for better maintainability
 */

// Connection pooling
export { initDatabase, closeDatabase, getDatabaseSize } from "./connection-pool";

// Database schema and table creation
export { createTables, TABLE_SCHEMAS } from "./database.types";

// Query helpers and utility functions
export {
  setMetadata,
  getMetadata,
  deleteMetadata,
  vacuumDatabase,
  exportDatabase,
  importDatabase,
  clearAllTables,
} from "./query-helpers";
