/**
 * Metrics Repository
 * Handles metrics CRUD operations and pruning
 */

export class MetricsRepository {
  /**
   * @param {Object} db - Better-sqlite3 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Save metrics to the database
   * @param {Object} m - Metrics object
   */
  save(m) {
    const query = `INSERT INTO metrics (cpu_usage, memory_usage,
      disk_usage, active_models, uptime, gpu_usage, gpu_memory_used, gpu_memory_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    this.db
      .prepare(query)
      .run(
        m.cpu_usage || 0,
        m.memory_usage || 0,
        m.disk_usage || 0,
        m.active_models || 0,
        m.uptime || 0,
        m.gpu_usage || 0,
        m.gpu_memory_used || 0,
        m.gpu_memory_total || 0
      );
  }

  /**
   * Get metrics history
   * @param {number} limit - Maximum records
   * @returns {Array} Array of metrics objects
   */
  getHistory(limit = 100) {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT ?").all(limit);
  }

  /**
   * Get the latest metrics
   * @returns {Object|null} Latest metrics or null
   */
  getLatest() {
    return this.db.prepare("SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 1").get();
  }

  /**
   * Prune old metrics to maintain bounded database size
   * @param {number} maxRecords - Maximum records to keep
   * @returns {number} Number of records deleted
   */
  prune(maxRecords = 10000) {
    try {
      const result = this.db.prepare("SELECT COUNT(*) as cnt FROM metrics").get();

      if (result.cnt > maxRecords) {
        const toDelete = result.cnt - maxRecords;
        const deleteResult = this.db
          .prepare(
            "DELETE FROM metrics WHERE id IN (SELECT id FROM metrics ORDER BY timestamp ASC LIMIT ?)"
          )
          .run(toDelete);
        console.log(`[DB] Pruned ${deleteResult.changes} old metrics, kept ${maxRecords}`);
        return deleteResult.changes;
      }
      return 0;
    } catch (e) {
      console.error("[DB] Metrics pruning error:", e.message);
      return 0;
    }
  }
}

export default MetricsRepository;
