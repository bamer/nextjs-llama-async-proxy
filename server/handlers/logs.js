/**
 * Logs Handlers
 * Socket.IO handlers for log operations
 * Uses async file I/O and path traversal protection
 */

import fs from "fs/promises";
import path from "path";
import { ok, err } from "./response.js";
import { fileLogger } from "./file-logger.js";

// Constants for log directory and file
const LOG_DIR = path.resolve(process.cwd(), "logs");
const LLAMA_SERVER_LOG = "llama-server.log";

/**
 * Validates that a log filename is safe and within the logs directory.
 * Prevents path traversal attacks by ensuring the resolved path is within LOG_DIR.
 * @param {string} fileName - The filename to validate.
 * @returns {Promise<string>} The validated absolute path to the log file.
 * @throws {Error} If the filename is invalid or outside the logs directory.
 */
async function validateLogPath(fileName) {
  // Reject empty, null, or undefined filenames
  if (!fileName || typeof fileName !== "string") {
    throw new Error("Invalid log filename: must be a non-empty string");
  }

  // Reject absolute paths - prevents access to system files
  if (path.isAbsolute(fileName)) {
    throw new Error("Invalid log filename: absolute paths are not allowed");
  }

  // Reject paths that would traverse outside the logs directory
  if (fileName.includes("..") || fileName.includes("/..") || fileName.includes("../")) {
    throw new Error("Invalid log filename: path traversal is not allowed");
  }

  // Reject paths with null bytes (old school attack)
  if (fileName.includes("\0")) {
    throw new Error("Invalid log filename: null bytes are not allowed");
  }

  // Resolve the full path and verify it's within LOG_DIR
  const resolvedPath = path.resolve(LOG_DIR, fileName);

  // Ensure the resolved path is within the logs directory
  if (!resolvedPath.startsWith(LOG_DIR)) {
    throw new Error("Invalid log filename: path is outside the logs directory");
  }

  // Verify the file exists and is accessible
  try {
    await fs.access(resolvedPath);
  } catch {
    throw new Error(`Log file not found: ${fileName}`);
  }

  return resolvedPath;
}

/**
 * Check if a file exists and is accessible.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<boolean>} True if file exists.
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Register all Socket.IO event handlers for log operations.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
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
  socket.on("logs:read-file", async (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const fileName = req?.fileName || null;
      const logs = await fileLogger.readLogFile(fileName);
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
  socket.on("logs:list-files", async (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const files = await fileLogger.listLogFiles();
      const size = await fileLogger.getLogsDirectorySize();
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
  socket.on("logs:clear-files", async (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      const cleared = await fileLogger.clearLogFiles();
      ok(socket, "logs:clear-files:result", { cleared }, id, ack);
    } catch (e) {
      err(socket, "logs:clear-files:result", e.message, id, ack);
    }
  });

  /**
   * Read llama-server log file with path traversal protection.
   */
  socket.on("logs:read-llama-server", async (req, ack) => {
    const id = req?.requestId || Date.now();
    try {
      // Use constant filename for llama-server.log instead of user input
      const llamaLogPath = path.join(LOG_DIR, LLAMA_SERVER_LOG);

      // Check if file exists using async
      const exists = await fileExists(llamaLogPath);
      if (!exists) {
        ok(
          socket,
          "logs:read-llama-server:result",
          {
            logs: [],
            fileName: LLAMA_SERVER_LOG,
            message: "Log file not found",
          },
          id,
          ack
        );
        return;
      }

      // Read file asynchronously
      const content = await fs.readFile(llamaLogPath, { encoding: "utf8" });
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
          fileName: LLAMA_SERVER_LOG,
        },
        id,
        ack
      );
    } catch (e) {
      err(socket, "logs:read-llama-server:result", e.message, id, ack);
    }
  });

  /**
   * Receive log entry from client and log it on server
   */
  socket.on("logs:entry", (req) => {
    const entry = req?.entry;
    if (!entry) return;

    const level = entry.level || "info";
    const message = entry.message || String(entry);
    const source = entry.source || "client";

    // Log to server's file logger (which handles file, DB, broadcast)
    fileLogger.log(level, message, source);
  });
}
