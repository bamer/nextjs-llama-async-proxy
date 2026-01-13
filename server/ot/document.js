/**
 * Document State Management for OT
 * Manages document content, revision history, and undo/redo
 */

import { isValid, invert, compose } from "./operation.js";
import { transformAgainst, apply } from "./transform.js";

const MAX_HISTORY = 100;
const MAX_UNDO_STACK = 50;

class Document {
  constructor(docId, initialContent = "") {
    this.docId = docId;
    this.content = initialContent;
    this.revision = 0;
    this.history = [];
    this.pending = new Map();
    this.undoStack = [];
    this.redoStack = [];
    this.users = new Map();
    this.lastModified = Date.now();
  }

  /**
   * Apply operation to document
   * @param {Object} op - Operation to apply
   * @returns {Object} Result with success, content, revision
   */
  applyOperation(op) {
    if (!isValid(op, this.content)) {
      return {
        success: false,
        error: `Invalid operation: ${JSON.stringify(op)}`,
      };
    }

    if (op.revision !== this.revision) {
      return {
        success: false,
        error: `Revision mismatch: expected ${this.revision}, got ${op.revision}`,
      };
    }

    const newContent = apply(op, this.content);
    const undoOp = invert(op, this.content);

    this.content = newContent;
    this.revision++;
    this.history.push(op);
    this.lastModified = Date.now();

    this.undoStack.push(undoOp);
    this.redoStack = [];

    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
    if (this.undoStack.length > MAX_UNDO_STACK) {
      this.undoStack.shift();
    }

    return {
      success: true,
      content: this.content,
      revision: this.revision,
      appliedAt: this.lastModified,
    };
  }

  /**
   * Undo last operation
   * @param {string} userId - User requesting undo
   * @returns {Object} Undo result
   */
  undo(userId) {
    if (this.undoStack.length === 0) {
      return {
        success: false,
        error: "Nothing to undo",
      };
    }

    const op = this.undoStack.pop();
    const redoOp = invert(op, this.content);

    const result = this.applyOperation(op);

    if (result.success) {
      this.redoStack.push(redoOp);
      result.undoOperation = op;
    }

    return result;
  }

  /**
   * Redo last undone operation
   * @param {string} userId - User requesting redo
   * @returns {Object} Redo result
   */
  redo(userId) {
    if (this.redoStack.length === 0) {
      return {
        success: false,
        error: "Nothing to redo",
      };
    }

    const op = this.redoStack.pop();
    const undoOp = invert(op, this.content);

    const result = this.applyOperation(op);

    if (result.success) {
      this.undoStack.push(undoOp);
      result.redoOperation = op;
    }

    return result;
  }

  /**
   * Transform pending operations against new operation
   * @param {Object} newOp - New operation to apply
   * @returns {Array} List of transformed pending operations
   */
  transformPending(newOp) {
    const transformed = [];

    for (const [clientId, pendingOp] of this.pending) {
      try {
        const transformedOp = transformAgainst(pendingOp, [newOp], this.content);
        transformed.push([clientId, transformedOp]);
      } catch (error) {
        console.error(`[Document] Failed to transform pending op: ${error.message}`);
      }
    }

    return transformed;
  }

  /**
   * Add pending operation (not yet acknowledged)
   * @param {string} clientId - Client ID
   * @param {Object} op - Pending operation
   */
  addPending(clientId, op) {
    this.pending.set(clientId, op);
  }

  /**
   * Remove pending operation (after acknowledgment)
   * @param {string} clientId - Client ID
   */
  removePending(clientId) {
    this.pending.delete(clientId);
  }

  /**
   * Get pending operations for client
   * @param {string} clientId - Client ID
   * @returns {Object|null} Pending operation
   */
  getPending(clientId) {
    return this.pending.get(clientId) || null;
  }

  /**
   * Get document state
   * @returns {Object} Current state
   */
  getState() {
    return {
      docId: this.docId,
      content: this.content,
      revision: this.revision,
      users: Array.from(this.users.values()).map((u) => ({
        userId: u.userId,
        username: u.username,
        color: u.color,
        cursor: u.cursor,
        selection: u.selection,
        lastSeen: u.lastSeen,
      })),
      lastModified: this.lastModified,
    };
  }

  /**
   * Add user to document
   * @param {string} userId - User ID
   * @param {string} username - Username
   * @param {string} color - User color
   */
  addUser(userId, username, color) {
    this.users.set(userId, {
      userId,
      username,
      color,
      cursor: null,
      selection: null,
      lastSeen: Date.now(),
    });
  }

  /**
   * Remove user from document
   * @param {string} userId - User ID
   */
  removeUser(userId) {
    this.users.delete(userId);
  }

  /**
   * Update user cursor
   * @param {string} userId - User ID
   * @param {Object} cursor - Cursor position { line, ch }
   */
  updateCursor(userId, cursor) {
    const user = this.users.get(userId);
    if (user) {
      user.cursor = cursor;
      user.lastSeen = Date.now();
    }
  }

  /**
   * Update user selection
   * @param {string} userId - User ID
   * @param {Object} selection - Selection { start, end }
   */
  updateSelection(userId, selection) {
    const user = this.users.get(userId);
    if (user) {
      user.selection = selection;
      user.lastSeen = Date.now();
    }
  }

  /**
   * Clean up idle users
   * @param {number} idleTimeout - Idle timeout in ms
   * @returns {Array} List of cleaned up user IDs
   */
  cleanupIdleUsers(idleTimeout = 30000) {
    const now = Date.now();
    const cleaned = [];

    for (const [userId, user] of this.users) {
      if (now - user.lastSeen > idleTimeout) {
        this.removeUser(userId);
        cleaned.push(userId);
      }
    }

    return cleaned;
  }

  /**
   * Get operation history
   * @param {number} limit - Maximum operations to return
   * @returns {Array} Operation history
   */
  getHistory(limit = MAX_HISTORY) {
    return this.history.slice(-limit);
  }

  /**
   * Reset document to specific revision
   * @param {number} revision - Target revision
   * @returns {Object} Reset result
   */
  resetToRevision(revision) {
    if (revision < 0 || revision > this.revision) {
      return {
        success: false,
        error: `Invalid revision: ${revision}`,
      };
    }

    if (revision === this.revision) {
      return {
        success: true,
        content: this.content,
        revision: this.revision,
      };
    }

    const operationsToUndo = this.history.slice(revision);
    let tempContent = this.content;

    for (let i = operationsToUndo.length - 1; i >= 0; i--) {
      const op = operationsToUndo[i];
      const undoOp = invert(op, tempContent);
      tempContent = apply(undoOp, tempContent);
    }

    return {
      success: true,
      content: tempContent,
      revision,
      operationsToUndo,
    };
  }
}

/**
 * Document Manager - Manages multiple documents
 */
class DocumentManager {
  constructor() {
    this.documents = new Map();
  }

  /**
   * Get or create document
   * @param {string} docId - Document ID
   * @param {string} initialContent - Initial content
   * @returns {Document} Document instance
   */
  getDocument(docId, initialContent = "") {
    if (!this.documents.has(docId)) {
      this.documents.set(docId, new Document(docId, initialContent));
    }
    return this.documents.get(docId);
  }

  /**
   * Delete document
   * @param {string} docId - Document ID
   * @returns {boolean} True if deleted
   */
  deleteDocument(docId) {
    return this.documents.delete(docId);
  }

  /**
   * Get all document IDs
   * @returns {Array} List of document IDs
   */
  getDocumentIds() {
    return Array.from(this.documents.keys());
  }

  /**
   * Clean up idle users in all documents
   * @param {number} idleTimeout - Idle timeout
   * @returns {Object} Cleanup results per document
   */
  cleanupAll(idleTimeout = 30000) {
    const results = {};

    for (const [docId, doc] of this.documents) {
      results[docId] = doc.cleanupIdleUsers(idleTimeout);
    }

    return results;
  }

  /**
   * Get stats about all documents
   * @returns {Object} Document stats
   */
  getStats() {
    const stats = {
      totalDocuments: this.documents.size,
      totalUsers: 0,
      documents: [],
    };

    for (const [docId, doc] of this.documents) {
      stats.totalUsers += doc.users.size;
      stats.documents.push({
        docId,
        revision: doc.revision,
        userCount: doc.users.size,
        lastModified: doc.lastModified,
      });
    }

    return stats;
  }
}

const documentManager = new DocumentManager();

export { Document, DocumentManager, documentManager };
