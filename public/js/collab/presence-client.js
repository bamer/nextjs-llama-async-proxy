/**
 * Presence Client - Client-side presence tracking
 * Manages remote users, cursors, and selections
 */

class PresenceClient {
  constructor() {
    this.docId = null;
    this.currentUserId = null;
    this.remoteUsers = new Map();
    this.callbacks = new Map();
  }

  /**
   * Initialize presence client
   * @param {string} docId - Document ID
   * @param {string} userId - Current user ID
   */
  init(docId, userId) {
    this.docId = docId;
    this.currentUserId = userId;
    this.remoteUsers.clear();
    console.log("[PresenceClient] Initialized", { docId, userId });
  }

  /**
   * Join document
   * @param {string} username - Username
   * @param {Function} callback - Optional callback
   */
  join(username, callback) {
    const requestId = `join_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    window.socketClient.emit("collab:join", {
      docId: this.docId,
      username,
      requestId,
    });

    if (callback) {
      this.callbacks.set(`joined_${requestId}`, callback);
    }
  }

  /**
   * Leave document
   * @param {Function} callback - Optional callback
   */
  leave(callback) {
    const requestId = `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    window.socketClient.emit("collab:leave", {
      docId: this.docId,
      requestId,
    });

    if (callback) {
      this.callbacks.set(`left_${requestId}`, callback);
    }
  }

  /**
   * Update cursor position
   * @param {Object} cursor - Cursor position { line, ch }
   * @param {Function} callback - Optional callback
   */
  updateCursor(cursor, callback) {
    const requestId = `cursor_${Date.now()}`;

    window.socketClient.emit("collab:cursor", {
      docId: this.docId,
      cursor,
      requestId,
    });

    if (callback) {
      this.callbacks.set(`cursor_${requestId}`, callback);
    }
  }

  /**
   * Update selection
   * @param {Object} selection - Selection { start, end }
   * @param {Function} callback - Optional callback
   */
  updateSelection(selection, callback) {
    const requestId = `selection_${Date.now()}`;

    window.socketClient.emit("collab:selection", {
      docId: this.docId,
      selection,
      requestId,
    });

    if (callback) {
      this.callbacks.set(`selection_${requestId}`, callback);
    }
  }

  /**
   * Request document sync
   * @param {number} fromRevision - Starting revision
   * @param {Function} callback - Callback
   */
  sync(fromRevision, callback) {
    const requestId = `sync_${Date.now()}`;

    window.socketClient.emit("collab:sync", {
      docId: this.docId,
      fromRevision,
      requestId,
    });

    this.callbacks.set(`sync_${requestId}`, callback);
  }

  /**
   * Request undo
   * @param {Function} callback - Callback
   */
  undo(callback) {
    const requestId = `undo_${Date.now()}`;

    window.socketClient.emit("collab:undo", {
      docId: this.docId,
      requestId,
    });

    this.callbacks.set(`undo_${requestId}`, callback);
  }

  /**
   * Request redo
   * @param {Function} callback - Callback
   */
  redo(callback) {
    const requestId = `redo_${Date.now()}`;

    window.socketClient.emit("collab:redo", {
      docId: this.docId,
      requestId,
    });

    this.callbacks.set(`redo_${requestId}`, callback);
  }

  /**
   * Handle user joined event
   * @param {Object} data - Event data
   */
  handleUserJoined(data) {
    const { user } = data;

    if (user.userId !== this.currentUserId) {
      this.remoteUsers.set(user.userId, user);
      this.emit("user-joined", user);
      console.log("[PresenceClient] User joined", user.username);
    }
  }

  /**
   * Handle user left event
   * @param {Object} data - Event data
   */
  handleUserLeft(data) {
    const { userId, username } = data;

    if (userId !== this.currentUserId && this.remoteUsers.has(userId)) {
      const user = this.remoteUsers.get(userId);
      this.remoteUsers.delete(userId);
      this.emit("user-left", user);
      console.log("[PresenceClient] User left", username);
    }
  }

  /**
   * Handle cursor update
   * @param {Object} data - Event data
   */
  handleCursorUpdate(data) {
    const { userId, cursor } = data;

    if (userId !== this.currentUserId && this.remoteUsers.has(userId)) {
      const user = this.remoteUsers.get(userId);
      user.cursor = cursor;
      this.emit("cursor-update", { userId, user, cursor });
    }
  }

  /**
   * Handle selection update
   * @param {Object} data - Event data
   */
  handleSelectionUpdate(data) {
    const { userId, selection } = data;

    if (userId !== this.currentUserId && this.remoteUsers.has(userId)) {
      const user = this.remoteUsers.get(userId);
      user.selection = selection;
      this.emit("selection-update", { userId, user, selection });
    }
  }

  /**
   * Handle join confirmation
   * @param {Object} data - Response data
   */
  handleJoined(data) {
    const { docId, revision, content, users, currentUser } = data;

    this.docId = docId;
    this.remoteUsers.clear();

    for (const user of users) {
      if (user.userId !== this.currentUserId) {
        this.remoteUsers.set(user.userId, user);
      }
    }

    this.emit("joined", {
      docId,
      revision,
      content,
      users: Array.from(this.remoteUsers.values()),
      currentUser,
    });

    console.log("[PresenceClient] Joined document", { docId, userCount: users.length });
  }

  /**
   * Handle sync response
   * @param {Object} data - Sync data
   */
  handleSync(data) {
    const { revision, content, operations } = data;
    this.emit("sync", { revision, content, operations });
  }

  /**
   * Handle undo/redo response
   * @param {Object} data - Response data
   * @param {string} type - "undo" or "redo"
   */
  handleUndoRedo(data, type) {
    this.emit(type, data);
  }

  /**
   * Add event listener
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback
   */
  on(eventType, callback) {
    this.callbacks.set(eventType, callback);
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   */
  off(eventType) {
    this.callbacks.delete(eventType);
  }

  /**
   * Trigger event
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  emit(eventType, data) {
    if (this.callbacks.has(eventType)) {
      const callback = this.callbacks.get(eventType);
      callback(data);
    }
  }

  /**
   * Get remote users
   * @returns {Array} List of remote users
   */
  getRemoteUsers() {
    return Array.from(this.remoteUsers.values());
  }

  /**
   * Get user count
   * @returns {number} Number of users
   */
  getUserCount() {
    return this.remoteUsers.size + 1;
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object|null} User info
   */
  getUser(userId) {
    if (userId === this.currentUserId) {
      return null;
    }
    return this.remoteUsers.get(userId) || null;
  }

  /**
   * Reset state
   */
  reset() {
    this.docId = null;
    this.currentUserId = null;
    this.remoteUsers.clear();
    this.callbacks.clear();
  }

  /**
   * Get state
   * @returns {Object} Current state
   */
  getState() {
    return {
      docId: this.docId,
      currentUserId: this.currentUserId,
      remoteUserCount: this.remoteUsers.size,
      users: this.getRemoteUsers(),
    };
  }
}

window.PresenceClient = PresenceClient;
const presenceClient = new PresenceClient();

export { presenceClient, PresenceClient };
