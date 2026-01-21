/**
 * Response Helper Functions
 * Standardized response format for Socket.IO handlers
 */

/**
 * Send a success response
 * @param {Object} socket - Socket.IO socket instance
 * @param {string} event - Event name for response
 * @param {Object} data - Response data
 * @param {string} id - Request ID
 * @param {Function} ack - Acknowledgment callback (optional)
 */
export function ok(socket, event, data, id, ack) {
  const response = {
    success: true,
    data,
    requestId: id,
    timestamp: new Date().toISOString(),
  };

  if (typeof ack === "function") {
    ack(response);
  } else {
    socket.emit(event, response);
  }
}

/**
 * Send an error response
 * @param {Object} socket - Socket.IO socket instance
 * @param {string} event - Event name for response
 * @param {string} error - Error message
 * @param {string} id - Request ID
 * @param {Function} ack - Acknowledgment callback (optional)
 */
export function err(socket, event, error, id, ack) {
  const response = {
    success: false,
    error: { message: error },
    requestId: id,
    timestamp: new Date().toISOString(),
  };

  if (typeof ack === "function") {
    ack(response);
  } else {
    socket.emit(event, response);
  }
}
