/**
 * Logs Handlers
 * Socket.IO handlers for log operations
 */

import { ok, err } from "./response.js";

/**
 * Register logs handlers
 */
export function registerLogsHandlers(socket, db) {
  /**
   * Get logs
   */
  socket.on("logs:get", (req) => {
    const id = req?.requestId || Date.now();
    try {
      ok(socket, "logs:get:result", { logs: db.getLogs(req?.limit || 100) }, id);
    } catch (e) {
      err(socket, "logs:get:result", e.message, id);
    }
  });

  /**
   * Clear logs
   */
  socket.on("logs:clear", (req) => {
    const id = req?.requestId || Date.now();
    try {
      ok(socket, "logs:clear:result", { cleared: db.clearLogs() }, id);
    } catch (e) {
      err(socket, "logs:clear:result", e.message, id);
    }
  });
}
