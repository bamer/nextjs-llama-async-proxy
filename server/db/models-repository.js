/**
 * Models Repository
 * Handles all CRUD operations for models
 */

import { isValidModelFile, validateModelEntry } from "./model-validator.js";

/**
 * Allowed columns for update operations
 */
const ALLOWED_UPDATE_COLUMNS = [
  "name",
  "type",
  "status",
  "parameters",
  "model_path",
  "file_size",
  "params",
  "quantization",
  "ctx_size",
  "batch_size",
  "threads",
  "embedding_size",
  "block_count",
  "head_count",
  "head_count_kv",
  "ffn_dim",
  "file_type",
];

export class ModelsRepository {
  /**
   * @param {Object} db - Better-sqlite3 database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all models
   * @returns {Array} Array of model objects
   */
  getAll() {
    return this.db.prepare("SELECT * FROM models ORDER BY created_at DESC").all();
  }

  /**
   * Get a single model by ID
   * @param {string} id - Model ID
   * @returns {Object|null} Model object or null
   */
  getById(id) {
    return this.db.prepare("SELECT * FROM models WHERE id = ?").get(id);
  }

  /**
   * Save a model (insert or replace)
   * @param {Object} model - Model object to save
   * @returns {Object} Saved model object
   */
  save(model) {
    const id = model.id || `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    const query = `INSERT OR REPLACE INTO models (id, name, type, status,
      parameters, model_path, file_size, params, quantization, ctx_size,
      batch_size, threads, created_at, updated_at,
      embedding_size, block_count, head_count, head_count_kv, ffn_dim, file_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    this.db
      .prepare(query)
      .run(
        id,
        model.name,
        model.type || "llama",
        model.status || "idle",
        JSON.stringify(model.parameters || {}),
        model.model_path || model.path || null,
        model.file_size || null,
        model.params || null,
        model.quantization || null,
        model.ctx_size || 4096,
        model.batch_size || 512,
        model.threads || 4,
        model.created_at || now,
        now,
        model.embedding_size || 0,
        model.block_count || 0,
        model.head_count || 0,
        model.head_count_kv || 0,
        model.ffn_dim || 0,
        model.file_type || 0
      );

    return this.getById(id);
  }

  /**
   * Update a model by ID
   * @param {string} id - Model ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated model or null
   */
  update(id, updates) {
    const set = [];
    const vals = [];

    for (const [k, v] of Object.entries(updates)) {
      if (ALLOWED_UPDATE_COLUMNS.includes(k)) {
        set.push(`${k} = ?`);
        if (Array.isArray(v)) {
          vals.push(JSON.stringify(v));
        } else if (k === "parameters") {
          vals.push(JSON.stringify(v));
        } else {
          vals.push(v);
        }
      }
    }

    if (set.length === 0) return null;
    vals.push(Math.floor(Date.now() / 1000), id);

    const query = `UPDATE models SET ${set.join(", ")}, updated_at = ? WHERE id = ?`;
    this.db.prepare(query).run(...vals);
    return this.getById(id);
  }

  /**
   * Delete a model by ID
   * @param {string} id - Model ID
   * @returns {boolean} True if deleted
   */
  delete(id) {
    return this.db.prepare("DELETE FROM models WHERE id = ?").run(id).changes > 0;
  }

  /**
   * Remove models with invalid files
   * @returns {number} Number of models deleted
   */
  cleanupMissingFiles() {
    const models = this.getAll();
    let deleted = 0;

    for (const m of models) {
      const { valid, reason } = validateModelEntry(m);

      if (!valid) {
        console.log("[DEBUG] Cleanup: Removing", m.name, "(", reason, ")");
        this.delete(m.id);
        deleted++;
      }
    }

    console.log("[DEBUG] Cleanup: Removed", deleted, "invalid models");
    return deleted;
  }
}

export default ModelsRepository;
