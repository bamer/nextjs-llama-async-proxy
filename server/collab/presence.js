/**
 * Presence System for Collaborative Editing
 * Tracks active users, cursors, and selections per document
 */

import { documentManager } from "../ot/index.js";

const USER_COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A8",
  "#FFA833",
  "#33FFF5",
  "#A833FF",
  "#FF57A8",
];

/**
 * Assign a unique color to user
 * @param {string} userId - User ID
 * @returns {string} Color hex code
 */
function assignUserColor(userId) {
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
}

/**
 * Presence Manager - Manages user presence across documents
 */
class PresenceManager {
  constructor() {
    this.users = new Map();
    this.documents = new Map();
  }

  /**
   * Add user to document
   * @param {string} userId - User ID
   * @param {string} docId - Document ID
   * @param {string} username - Username
   * @param {string} socketId - Socket ID
   */
  addUser(userId, docId, username, socketId) {
    const color = assignUserColor(userId);
    const user = {
      userId,
      username,
      socketId,
      color,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    this.users.set(userId, user);

    if (!this.documents.has(docId)) {
      this.documents.set(docId, new Set());
    }

    this.documents.get(docId).add(userId);

    const doc = documentManager.getDocument(docId);
    doc.addUser(userId, username, color);

    return user;
  }

  /**
   * Remove user from document
   * @param {string} userId - User ID
   * @param {string} docId - Document ID
   */
  removeUser(userId, docId) {
    const doc = this.documents.get(docId);
    if (doc) {
      doc.delete(userId);
    }

    const document = documentManager.getDocument(docId);
    if (document) {
      document.removeUser(userId);
    }

    this.users.delete(userId);
  }

  /**
   * Update user cursor position
   * @param {string} userId - User ID
   * @param {string} docId - Document ID
   * @param {Object} cursor - Cursor position { line, ch }
   */
  updateCursor(userId, docId, cursor) {
    const user = this.users.get(userId);
    if (user) {
      user.cursor = cursor;
      user.lastSeen = Date.now();

      const document = documentManager.getDocument(docId);
      if (document) {
        document.updateCursor(userId, cursor);
      }
    }
  }

  /**
   * Update user selection
   * @param {string} userId - User ID
   * @param {string} docId - Document ID
   * @param {Object} selection - Selection { start, end }
   */
  updateSelection(userId, docId, selection) {
    const user = this.users.get(userId);
    if (user) {
      user.selection = selection;
      user.lastSeen = Date.now();

      const document = documentManager.getDocument(docId);
      if (document) {
        document.updateSelection(userId, selection);
      }
    }
  }

  /**
   * Get user info
   * @param {string} userId - User ID
   * @returns {Object|null} User info
   */
  getUser(userId) {
    return this.users.get(userId) || null;
  }

  /**
   * Get all users in document
   * @param {string} docId - Document ID
   * @returns {Array} List of users
   */
  getDocumentUsers(docId) {
    const userIds = this.documents.get(docId) || new Set();
    const users = [];

    for (const userId of userIds) {
      const user = this.users.get(userId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  /**
   * Get user count for document
   * @param {string} docId - Document ID
   * @returns {number} User count
   */
  getDocumentUserCount(docId) {
    const users = this.documents.get(docId);
    return users ? users.size : 0;
  }

  /**
   * Check if user is in document
   * @param {string} userId - User ID
   * @param {string} docId - Document ID
   * @returns {boolean} True if user is in document
   */
  isUserInDocument(userId, docId) {
    const users = this.documents.get(docId);
    return users ? users.has(userId) : false;
  }

  /**
   * Get all documents with users
   * @returns {Array} List of document IDs with user counts
   */
  getActiveDocuments() {
    const active = [];

    for (const [docId, users] of this.documents) {
      if (users.size > 0) {
        active.push({
          docId,
          userCount: users.size,
        });
      }
    }

    return active;
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
        cleaned.push(userId);
        for (const [docId, users] of this.documents) {
          if (users.has(userId)) {
            users.delete(userId);
            const document = documentManager.getDocument(docId);
            if (document) {
              document.removeUser(userId);
            }
          }
        }
      }
    }

    for (const userId of cleaned) {
      this.users.delete(userId);
    }

    return cleaned;
  }

  /**
   * Get stats
   * @returns {Object} Presence stats
   */
  getStats() {
    return {
      totalUsers: this.users.size,
      totalDocuments: this.documents.size,
      activeDocuments: this.getDocumentsWithUsers().length,
    };
  }

  /**
   * Get documents with user counts
   * @returns {Array} List of documents with users
   */
  getDocumentsWithUsers() {
    const docs = [];

    for (const [docId, users] of this.documents) {
      if (users.size > 0) {
        docs.push({
          docId,
          userCount: users.size,
        });
      }
    }

    return docs;
  }
}

const presenceManager = new PresenceManager();

export { PresenceManager, presenceManager, assignUserColor, USER_COLORS };
