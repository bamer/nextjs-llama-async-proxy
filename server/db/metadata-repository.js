/**
 * Metadata Repository
 * Handles key-value metadata storage with JSON support
 */

export class MetadataRepository {
  /**
   * @param {Object} db - Better-sqlite3 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Get metadata value by key
   * @param {string} key - Metadata key
   * @param {*} defaultValue - Default if not found
   * @returns {*} Metadata value or default
   */
  get(key, defaultValue = null) {
    try {
      const r = this.db.prepare("SELECT value FROM metadata WHERE key = ?").get(key);
      if (r) return JSON.parse(r.value);
    } catch {
      // Silently ignore JSON parse errors
    }
    return defaultValue;
  }

  /**
   * Set metadata value
   * @param {string} key - Metadata key
   * @param {*} value - Value to store
   */
  set(key, value) {
    const valueToStore = value === null || value === undefined ? "{}" : JSON.stringify(value);
    const query = "INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, ?)";
    this.db.prepare(query).run(key, valueToStore, Math.floor(Date.now() / 1000));
  }
}

export default MetadataRepository;
