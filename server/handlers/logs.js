/**
 * Logs Handlers
 * Socket.IO handlers for log operations
 */

import { ok, err } from "./response.js";
import { fileLogger } from "./file-logger.js";

/**
 * Register logs handlers
 */
export function registerLogsHandlers(socket, db) {
  // Initialize file logger with database
  fileLogger.setDb(db);

  /**
   * Get logs from database
   */
  socket.on("logs:get", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const logs = db.getLogs(req?.limit || 100);
      ok(socket, "logs:get:result", { logs }, id);
    } catch (e) {
      err(socket, "logs:get:result", e.message, id);
    }
  });

  /**
   * Get logs from file
   */
  socket.on("logs:read-file", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const fileName = req?.fileName || null;
      const logs = fileLogger.readLogFile(fileName);
      ok(socket, "logs:read-file:result", { logs, fileName: fileName || fileLogger.getLogFileName() }, id);
    } catch (e) {
      err(socket, "logs:read-file:result", e.message, id);
    }
  });

  /**
   * List log files
   */
  socket.on("logs:list-files", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const files = fileLogger.listLogFiles();
      const size = fileLogger.getLogsDirectorySize();
      ok(socket, "logs:list-files:result", { files, size }, id);
    } catch (e) {
      err(socket, "logs:list-files:result", e.message, id);
    }
  });

  /**
   * Clear logs from database
   */
  socket.on("logs:clear", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const cleared = db.clearLogs();
      ok(socket, "logs:clear:result", { cleared }, id);
    } catch (e) {
      err(socket, "logs:clear:result", e.message, id);
    }
  });

  /**
   * Clear log files
   */
  socket.on("logs:clear-files", (req) => {
    const id = req?.requestId || Date.now();
    try {
      const cleared = fileLogger.clearLogFiles();
      ok(socket, "logs:clear-files:result", { cleared }, id);
    } catch (e) {
      err(socket, "logs:clear-files:result", e.message, id);
    }
  });
}
