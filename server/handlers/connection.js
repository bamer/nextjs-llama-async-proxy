/**
 * Connection Handlers
 * Socket.IO handlers for connection lifecycle
 */

import { ok } from "./response.js";

/**
 * Register all Socket.IO event handlers for connection lifecycle.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} logger - Logger instance for connection events.
 */
export function registerConnectionHandlers(socket, logger) {
  /**
   * Acknowledge connection
   */
  socket.on("connection:ack", () => {
    socket.emit("connection:established", { clientId: socket.id, timestamp: Date.now() });
  });

  /**
   * Handle disconnection with detailed logging
   */
  socket.on("disconnect", (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    // Common reasons: "transport close", "transport error", "server shutting down", "ping timeout"
    if (reason === "transport close") {
      logger.warn(`[SOCKET] Client ${socket.id} disconnected - transport closed (possible network issue or server load)`);
    } else if (reason === "transport error") {
      logger.warn(`[SOCKET] Client ${socket.id} disconnected - transport error`);
    } else if (reason === "ping timeout") {
      logger.warn(`[SOCKET] Client ${socket.id} disconnected - ping timeout (server too busy?)`);
    }
  });
}
