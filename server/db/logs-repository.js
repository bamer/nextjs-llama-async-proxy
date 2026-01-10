/**
 * Logs Repository
 * Handles log entries CRUD operations
 */

export class LogsRepository {
  /**
   * @param {Object} db - Better-sqlite3 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Get logs from the database
   * @param {number} limit - Maximum records
   * @returns {Array} Array of log objects
   */
  getAll(limit = 100) {
    return this.db.prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?").all(limit);
  }

  /**
   * Add a log entry
   * @param {string} level - Log level
   * @param {string} msg - Log message
   * @param {string} source - Log source
   */
  add(level, msg, source = "server") {
    const query = "INSERT INTO logs (level, message, source) VALUES (?, ?, ?)";
    this.db.prepare(query).run(level, String(msg), source);
  }

  /**
   * Add llama-server log entry
   * @param {string} level - Log level
   * @param {string} msg - Log message
   * @param {Object} metadata - Optional metadata
   */
  addLlamaServerLog(level, msg, metadata = {}) {
    const query = "INSERT INTO logs (level, message, source, metadata) VALUES (?, ?, ?, ?)";
    this.db.prepare(query).run(level, String(msg), "llama-server", JSON.stringify(metadata));
    console.log("[DEBUG] LogsRepository.addLlamaServerLog:", { level, msg });
  }

  /**
   * Get llama-server logs only
   * @param {number} limit - Maximum records
   * @returns {Array} Array of llama-server log objects
   */
  getLlamaServerLogs(limit = 100) {
    const logs = this.db
      .prepare("SELECT * FROM logs WHERE source = ? ORDER BY timestamp DESC LIMIT ?")
      .all("llama-server", limit);
    console.log("[DEBUG] LogsRepository.getLlamaServerLogs:", { count: logs.length });
    return logs;
  }

  /**
   * Clear all logs
   * @returns {number} Number of logs cleared
   */
  clear() {
    return this.db.prepare("DELETE FROM logs").run().changes;
  }
}

export default LogsRepository;
