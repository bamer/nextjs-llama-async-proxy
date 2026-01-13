/**
 * OT Client - Client-side operational transform logic
 * Handles local operations and transforms with remote operations
 */

class OTClient {
  constructor() {
    this.docId = null;
    this.localRevision = 0;
    this.pendingOperations = [];
    this.acknowledgedOperations = new Map();
    this.outboundCallbacks = new Map();
    this.inboundCallbacks = new Map();
  }

  /**
   * Initialize client for document
   * @param {string} docId - Document ID
   * @param {string} content - Initial content
   * @param {number} revision - Initial revision
   */
  init(docId, content, revision) {
    this.docId = docId;
    this.localRevision = revision;
    this.pendingOperations = [];
    this.acknowledgedOperations.clear();
    console.log("[OTClient] Initialized", { docId, revision, contentLength: content.length });
  }

  /**
   * Create insert operation
   * @param {number} position - Position to insert
   * @param {string} text - Text to insert
   * @returns {Object} Operation
   */
  createInsert(position, text) {
    return {
      type: "insert",
      position,
      text,
      userId: window.socketClient?.id || "local",
      revision: this.localRevision,
      timestamp: Date.now(),
    };
  }

  /**
   * Create delete operation
   * @param {number} position - Position to delete
   * @param {number} length - Length to delete
   * @returns {Object} Operation
   */
  createDelete(position, length) {
    return {
      type: "delete",
      position,
      length,
      userId: window.socketClient?.id || "local",
      revision: this.localRevision,
      timestamp: Date.now(),
    };
  }

  /**
   * Apply operation locally
   * @param {Object} op - Operation to apply
   * @param {string} content - Current content
   * @returns {string} New content
   */
  apply(op, content) {
    if (op.type === "insert") {
      const before = content.slice(0, op.position);
      const after = content.slice(op.position);
      return before + op.text + after;
    }

    if (op.type === "delete") {
      const before = content.slice(0, op.position);
      const after = content.slice(op.position + op.length);
      return before + after;
    }

    return content;
  }

  /**
   * Transform local operation with remote operations
   * @param {Object} localOp - Local operation
   * @param {Array<Object>} remoteOps - Remote operations to transform against
   * @returns {Object} Transformed operation
   */
  transform(localOp, remoteOps) {
    let result = { ...localOp };

    for (const remoteOp of remoteOps) {
      result = this.transformOne(result, remoteOp);
    }

    return result;
  }

  /**
   * Transform one operation against another
   * @param {Object} opA - First operation
   * @param {Object} opB - Second operation
   * @returns {Object} Transformed operation A
   */
  transformOne(opA, opB) {
    if (opA.type === "insert" && opB.type === "insert") {
      if (opA.position < opB.position) {
        return opA;
      }
      if (opA.position > opB.position) {
        return { ...opA, position: opA.position + opB.text.length };
      }
      if (opA.position === opB.position) {
        const userIdA = opA.userId || window.socketClient?.id || "";
        const userIdB = opB.userId || "";
        if (userIdA < userIdB) {
          return opA;
        }
        return { ...opA, position: opA.position + opB.text.length };
      }
    }

    if (opA.type === "insert" && opB.type === "delete") {
      if (opA.position < opB.position) {
        return opA;
      }
      if (opA.position >= opB.position + opB.length) {
        return { ...opA, position: opA.position - opB.length };
      }
      if (opA.position >= opB.position && opA.position < opB.position + opB.length) {
        return { ...opA, position: opB.position };
      }
    }

    if (opA.type === "delete" && opB.type === "insert") {
      if (opA.position < opB.position) {
        return opA;
      }
      if (opA.position >= opB.position) {
        return { ...opA, position: opA.position + opB.text.length };
      }
    }

    if (opA.type === "delete" && opB.type === "delete") {
      const aStart = opA.position;
      const aEnd = aStart + opA.length;
      const bStart = opB.position;
      const bEnd = bStart + opB.length;

      if (aEnd <= bStart) {
        return opA;
      }
      if (bEnd <= aStart) {
        return { ...opA, position: aStart - opB.length };
      }
      if (aStart <= bStart && aEnd >= bEnd) {
        return opA;
      }
      if (bStart <= aStart && bEnd >= aEnd) {
        return { ...opA, position: bStart, length: 0 };
      }
      if (aStart < bStart && aEnd < bEnd) {
        return opA;
      }
      if (bStart < aStart && bEnd < aEnd) {
        return { ...opA, position: bStart, length: aEnd - bEnd };
      }
    }

    return opA;
  }

  /**
   * Send operation to server
   * @param {Object} op - Operation to send
   * @param {Function} callback - Optional callback
   */
  sendOperation(op, callback) {
    if (!window.socketClient?.isConnected) {
      console.warn("[OTClient] Socket not connected, buffering operation");
      this.pendingOperations.push(op);
      return;
    }

    const requestId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.acknowledgedOperations.set(requestId, op);

    window.socketClient.emit("collab:operation", {
      docId: this.docId,
      operation: op,
      requestId,
    });

    if (callback) {
      this.outboundCallbacks.set(requestId, callback);
    }
  }

  /**
   * Handle incoming operation
   * @param {Object} data - Operation data from server
   * @param {string} localContent - Current local content
   * @returns {Object} Result with new content
   */
  handleIncomingOperation(data, localContent) {
    const { operation, revision } = data;

    console.log("[OTClient] Incoming operation", { type: operation.type, revision });

    const newContent = this.apply(operation, localContent);
    this.localRevision = revision;

    return {
      content: newContent,
      revision,
      operation,
    };
  }

  /**
   * Handle operation acknowledgment
   * @param {string} requestId - Request ID
   * @param {Object} result - Result data
   */
  handleAck(requestId, result) {
    if (this.outboundCallbacks.has(requestId)) {
      const callback = this.outboundCallbacks.get(requestId);
      callback(result);
      this.outboundCallbacks.delete(requestId);
    }

    this.acknowledgedOperations.delete(requestId);
  }

  /**
   * Add callback for operation events
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   */
  on(eventType, callback) {
    this.inboundCallbacks.set(eventType, callback);
  }

  /**
   * Remove callback
   * @param {string} eventType - Event type
   */
  off(eventType) {
    this.inboundCallbacks.delete(eventType);
  }

  /**
   * Trigger callback
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  emit(eventType, data) {
    if (this.inboundCallbacks.has(eventType)) {
      const callback = this.inboundCallbacks.get(eventType);
      callback(data);
    }
  }

  /**
   * Get pending operations count
   * @returns {number} Count
   */
  getPendingCount() {
    return this.pendingOperations.length;
  }

  /**
   * Reset client state
   */
  reset() {
    this.docId = null;
    this.localRevision = 0;
    this.pendingOperations = [];
    this.acknowledgedOperations.clear();
    this.outboundCallbacks.clear();
    this.inboundCallbacks.clear();
  }

  /**
   * Get client state
   * @returns {Object} Current state
   */
  getState() {
    return {
      docId: this.docId,
      localRevision: this.localRevision,
      pendingCount: this.pendingOperations.length,
      acknowledgedCount: this.acknowledgedOperations.size,
    };
  }
}

window.OTClient = OTClient;
const otClient = new OTClient();

export { otClient, OTClient };
