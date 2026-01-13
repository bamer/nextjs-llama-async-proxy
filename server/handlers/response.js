/**
 * Response Helpers
 * Socket.IO ack callback formatting utilities
 */

/**
 * Send a successful response via ack callback
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
 * Send an error response via ack callback
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
