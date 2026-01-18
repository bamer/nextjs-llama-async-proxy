/**
 * Logs Handlers
 * Socket.IO handlers for log operations with standardized callback pattern
 */

import fs from "fs/promises";
import path from "path";
import { fileLogger } from "./file-logger.js";

// Constants for log directory and file
const LOG_DIR = path.resolve(process.cwd(), "logs");
const LLAMA_SERVER_LOG = "llama-server.log";

/**
 * Generate a unique request ID for tracking requests
 * @param {object} req - Request object
 * @returns {string} Request ID
 */
function getRequestId(req) {
  return req?.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates that a log filename is safe and within the logs directory.
 * @param {string} fileName - The filename to validate.
 * @returns {Promise<string>} The validated absolute path to the log file.
 * @throws {Error} If the filename is invalid or outside the logs directory.
 */
async function validateLogPath(fileName) {
  if (!fileName || typeof fileName !== "string") {
    throw new Error("Invalid log filename: must be a non-empty string");
  }

  if (path.isAbsolute(fileName)) {
    throw new Error("Invalid log filename: absolute paths are not allowed");
  }

  if (fileName.includes("..") || fileName.includes("/..") || fileName.includes("../")) {
    throw new Error("Invalid log filename: path traversal is not allowed");
  }

  if (fileName.includes("\0")) {
    throw new Error("Invalid log filename: null bytes are not allowed");
  }

  const resolvedPath = path.resolve(LOG_DIR, fileName);

  if (!resolvedPath.startsWith(LOG_DIR)) {
    throw new Error("Invalid log filename: path is outside the logs directory");
  }

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
 * All handlers use standardized callback pattern.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} db - Database instance.
 */
export function registerLogsHandlers(socket, db) {
  // Initialize file logger with database
  fileLogger.setDb(db);

  /**
   * Get logs from database.
   * CONTRACT:
   * - Input: { limit?: number }
   * - Output: { success: true, data: { logs }, timestamp: string }
   */
  socket.on("logs:get", (req, callback) => {
    const id = getRequestId(req);
    console.log("[DEBUG] logs:get request", { requestId: id, limit: req?.limit });

    try {
      const logs = db.getLogs(req?.limit || 100);

      console.log("[DEBUG] logs:get response", { requestId: id, count: logs.length });

      callback({
        success: true,
        data: { logs },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] logs:get failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to get logs",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Get logs from file.
   * CONTRACT:
   * - Input: { fileName?: string }
   * - Output: { success: true, data: { logs, fileName }, timestamp: string }
   */
  socket.on("logs:read-file", async (req, callback) => {
    const id = getRequestId(req);
    const fileName = req?.fileName || null;

    console.log("[DEBUG] logs:read-file request", { requestId: id, fileName });

    try {
      const logs = await fileLogger.readLogFile(fileName);

      console.log("[DEBUG] logs:read-file response", { requestId: id, count: logs.length });

      callback({
        success: true,
        data: {
          logs,
          fileName: fileName || fileLogger.getLogFileName(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] logs:read-file failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to read log file",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * List log files.
   * CONTRACT:
   * - Input: {}
   * - Output: { success: true, data: { files, size }, timestamp: string }
   */
  socket.on("logs:list-files", async (req, callback) => {
    const id = getRequestId(req);

    console.log("[DEBUG] logs:list-files request", { requestId: id });

    try {
      const files = await fileLogger.listLogFiles();
      const size = await fileLogger.getLogsDirectorySize();

      console.log("[DEBUG] logs:list-files response", { requestId: id, count: files.length });

      callback({
        success: true,
        data: { files, size },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] logs:list-files failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to list log files",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Clear logs from database.
   * CONTRACT:
   * - Input: {}
   * - Output: { success: true, data: { cleared }, timestamp: string }
   * - Broadcasts: logs:cleared
   */
  socket.on("logs:clear", (req, callback) => {
    const id = getRequestId(req);

    console.log("[DEBUG] logs:clear request", { requestId: id });

    try {
      const cleared = db.clearLogs();

      // Broadcast to all clients
      socket.broadcast.emit("logs:cleared", {
        count: cleared,
        timestamp: new Date().toISOString(),
      });

      console.log("[DEBUG] logs:clear response", { requestId: id, cleared });

      callback({
        success: true,
        data: { cleared },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] logs:clear failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to clear logs",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Clear log files.
   * CONTRACT:
   * - Input: {}
   * - Output: { success: true, data: { cleared }, timestamp: string }
   */
  socket.on("logs:clear-files", async (req, callback) => {
    const id = getRequestId(req);

    console.log("[DEBUG] logs:clear-files request", { requestId: id });

    try {
      const cleared = await fileLogger.clearLogFiles();

      // Broadcast to all clients
      socket.broadcast.emit("logs:cleared", {
        count: cleared,
        timestamp: new Date().toISOString(),
      });

      console.log("[DEBUG] logs:clear-files response", { requestId: id, cleared });

      callback({
        success: true,
        data: { cleared },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] logs:clear-files failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to clear log files",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Read llama-server log file with path traversal protection.
   * CONTRACT:
   * - Input: {}
   * - Output: { success: true, data: { logs, fileName }, timestamp: string }
   */
  socket.on("logs:read-llama-server", async (req, callback) => {
    const id = getRequestId(req);

    console.log("[DEBUG] logs:read-llama-server request", { requestId: id });

    try {
      const llamaLogPath = path.join(LOG_DIR, LLAMA_SERVER_LOG);
      const exists = await fileExists(llamaLogPath);

      if (!exists) {
        console.log("[DEBUG] llama-server.log not found", { requestId: id });

        callback({
          success: true,
          data: {
            logs: [],
            fileName: LLAMA_SERVER_LOG,
            message: "Log file not found",
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const content = await fs.readFile(llamaLogPath, { encoding: "utf8" });
      const lines = content.trim().split("\n");

      const logs = lines
        .filter((line) => line.trim() && !line.startsWith("#"))
        .map((line) => {
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

      console.log("[DEBUG] logs:read-llama-server response", { requestId: id, count: logs.length });

      callback({
        success: true,
        data: {
          logs,
          fileName: LLAMA_SERVER_LOG,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[ERROR] logs:read-llama-server failed:", e.message);
      callback({
        success: false,
        error: e.message || "Failed to read llama-server log",
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * Receive log entry from client and log it on server.
   * Type: One-way (no callback)
   * CONTRACT:
   * - Input: { entry: { level, message, source? } }
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
