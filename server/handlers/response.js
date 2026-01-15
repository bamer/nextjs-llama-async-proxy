/**
 * Response Helpers
 * Socket.IO ack callback formatting utilities
 */

/**
 * Send a successful response via ack callback or emit event.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {string} event - Event name to emit.
 * @param {Object} data - Data to send in the response.
 * @param {number} reqId - Request identifier.
 * @param {Function} ack - Optional acknowledgment callback.
 */
export function ok(socket, event, data, reqId, ack) {
  const response = { success: true, data, requestId: reqId, timestamp: Date.now() };
  if (typeof ack === "function") {
    ack(response);
  } else {
    socket.emit(event, response);
  }
}

/**
 * Send an error response via ack callback or emit event.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {string} event - Event name to emit.
 * @param {string} message - Error message to send.
 * @param {number} reqId - Request identifier.
 * @param {Function} ack - Optional acknowledgment callback.
 */
export function err(socket, event, message, reqId, ack) {
  const response = {
    success: false,
    error: { message },
    requestId: reqId,
    timestamp: Date.now(),
  };
  if (typeof ack === "function") {
    ack(response);
  } else {
    socket.emit(event, response);
  }
}
