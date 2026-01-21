/**
 * Operational Transform Operation Types
 * Defines operations for collaborative text editing
 */

/**
 * Create an insert operation
 * @param {number} position - Position to insert at
 * @param {string} text - Text to insert
 * @param {string} userId - User ID making the operation
 * @param {number} revision - Document revision
 * @returns {Object} Insert operation
 */
export function insert(position, text, userId, revision) {
  return {
    type: "insert",
    position,
    text,
    userId,
    revision,
    timestamp: Date.now(),
  };
}

/**
 * Create a delete operation
 * @param {number} position - Position to delete from
 * @param {number} length - Length of text to delete
 * @param {string} userId - User ID making the operation
 * @param {number} revision - Document revision
 * @returns {Object} Delete operation
 */
export function deleteOp(position, length, userId, revision) {
  return {
    type: "delete",
    position,
    length,
    userId,
    revision,
    timestamp: Date.now(),
  };
}

/**
 * Create a retain operation (no-op)
 * @param {number} position - Position to retain
 * @param {string} userId - User ID
 * @param {number} revision - Document revision
 * @returns {Object} Retain operation
 */
export function retain(position, userId, revision) {
  return {
    type: "retain",
    position,
    userId,
    revision,
    timestamp: Date.now(),
  };
}

/**
 * Check if operation is valid
 * @param {Object} op - Operation to validate
 * @param {string} content - Current document content
 * @returns {boolean} True if valid
 */
export function isValid(op, content) {
  if (!op || typeof op !== "object") return false;
  if (typeof op.position !== "number" || op.position < 0) return false;
  if (op.position > content.length) return false;

  if (op.type === "insert") {
    return typeof op.text === "string" && op.text.length > 0;
  }
  if (op.type === "delete") {
    return (
      typeof op.length === "number" &&
      op.length > 0 &&
      op.position + op.length <= content.length
    );
  }
  if (op.type === "retain") {
    return true;
  }

  return false;
}

/**
 * Create inverse of operation (for undo)
 * @param {Object} op - Operation to invert
 * @param {string} content - Content before operation
 * @returns {Object} Inverted operation
 */
export function invert(op, content) {
  if (op.type === "insert") {
    return deleteOp(op.position, op.text.length, op.userId, op.revision);
  }
  if (op.type === "delete") {
    const deletedText = content.substring(op.position, op.position + op.length);
    return insert(op.position, deletedText, op.userId, op.revision);
  }
  if (op.type === "retain") {
    return op;
  }

  throw new Error(`Cannot invert operation of type: ${op.type}`);
}

/**
 * Compose multiple operations into one
 * @param {Array<Object>} ops - Operations to compose
 * @returns {Object|null} Composed operation or null if empty
 */
export function compose(ops) {
  if (ops.length === 0) return null;
  if (ops.length === 1) return ops[0];

  const result = { ...ops[0] };

  for (let i = 1; i < ops.length; i++) {
    const op = ops[i];

    if (op.type === "insert") {
      if (result.type === "insert") {
        if (op.position === result.position + result.text.length) {
          result.text += op.text;
          result.timestamp = Math.max(result.timestamp, op.timestamp);
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (op.type === "delete") {
      if (result.type === "delete") {
        if (op.position === result.position + result.length || op.position <= result.position + result.length && op.position >= result.position) {
          result.length = Math.max(result.position + result.length, op.position + op.length) - result.position;
          result.timestamp = Math.max(result.timestamp, op.timestamp);
        } else if (op.position === result.position) {
          result.length = Math.max(result.length, op.length);
          result.timestamp = Math.max(result.timestamp, op.timestamp);
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  }

  return result;
}
