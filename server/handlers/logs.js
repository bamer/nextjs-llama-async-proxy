/**
 * Logs Handlers
 * Socket.IO handlers for log operations
 */

import fs from "fs";
import path from "path";
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
  socket.on("logs:get", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const logs = db.getLogs(req?.limit || 100);
      ok(socket, "logs:get:result", { logs }, id, ack);
    } catch (e) {
      err(socket, "logs:get:result", e.message, id, ack);
    }
  });

  /**
   * Get logs from file
   */
  socket.on("logs:read-file", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const fileName = req?.fileName || null;
      const logs = fileLogger.readLogFile(fileName);
      ok(
        socket,
        "logs:read-file:result",
        { logs, fileName: fileName || fileLogger.getLogFileName() },
        id,
        ack
      );
    } catch (e) {
      err(socket, "logs:read-file:result", e.message, id, ack);
    }
  });

  /**
   * List log files
   */
  socket.on("logs:list-files", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const files = fileLogger.listLogFiles();
      const size = fileLogger.getLogsDirectorySize();
      ok(socket, "logs:list-files:result", { files, size }, id, ack);
    } catch (e) {
      err(socket, "logs:list-files:result", e.message, id, ack);
    }
  });

  /**
   * Clear logs from database
   */
  socket.on("logs:clear", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const cleared = db.clearLogs();
      ok(socket, "logs:clear:result", { cleared }, id, ack);
    } catch (e) {
      err(socket, "logs:clear:result", e.message, id, ack);
    }
  });

  /**
   * Clear log files
   */
  socket.on("logs:clear-files", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const cleared = fileLogger.clearLogFiles();
      ok(socket, "logs:clear-files:result", { cleared }, id, ack);
    } catch (e) {
      err(socket, "logs:clear-files:result", e.message, id, ack);
    }
  });

  /**
   * Read llama-server log file
   */
  socket.on("logs:read-llama-server", (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const llamaLogPath = path.join(process.cwd(), "logs", "llama-server.log");

      if (!fs.existsSync(llamaLogPath)) {
        ok(
          socket,
          "logs:read-llama-server:result",
          {
            logs: [],
            fileName: "llama-server.log",
            message: "Log file not found",
          },
          id,
          ack
        );
        return;
      }

      const content = fs.readFileSync(llamaLogPath, { encoding: "utf8" });
      const lines = content.trim().split("\n");

      const logs = lines
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => {
          // Parse: [timestamp] [LEVEL] message
          const match = line.match(/\[([^\]]+)\]\s\[([^\]]+)\]\s(.+)/);
          if (match) {
            return {
              timestamp: new Date(match[1]).getTime(),
              level: match[2].toLowerCase(),
              message: match[3],
            };
          }
          return {
            timestamp: Date.now(),
            level: "info",
            message: line,
          };
        })
        .reverse();

      ok(
        socket,
        "logs:read-llama-server:result",
        {
          logs,
          fileName: "llama-server.log",
        },
        id,
        ack
      );
    } catch (e) {
      err(socket, "logs:read-llama-server:result", e.message, id, ack);
    }
  });
}
