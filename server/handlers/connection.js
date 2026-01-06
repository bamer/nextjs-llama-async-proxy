/**
 * Connection Handlers
 * Socket.IO handlers for connection lifecycle
 */

import { ok } from "./response.js";

/**
 * Register connection handlers
 */
export function registerConnectionHandlers(socket, logger) {
  /**
   * Acknowledge connection
   */
  socket.on("connection:ack", () => {
    socket.emit("connection:established", { clientId: socket.id, timestamp: Date.now() });
  });

  /**
   * Handle disconnection
   */
  socket.on("disconnect", (reason) => {
    logger.info(`Client disconnected: ${socket.id}, ${reason}`);
  });
}
