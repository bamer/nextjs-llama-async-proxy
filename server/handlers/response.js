/**
 * Response Helpers
 * Socket.IO response formatting utilities
 */

/**
 * Send a successful response
 */
export function ok(socket, event, data, reqId) {
  socket.emit(event, { success: true, data, requestId: reqId, timestamp: Date.now() });
}

/**
 * Send an error response
 */
export function err(socket, event, message, reqId) {
  socket.emit(event, {
    success: false,
    error: { message },
    requestId: reqId,
    timestamp: Date.now(),
  });
}
