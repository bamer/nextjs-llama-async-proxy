/**
 * File Logger class that logs to files in logs/ directory with daily rotation.
 * Integrates with Socket.IO for real-time broadcasting and database for persistence.
 * Uses async file I/O to prevent event loop blocking.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileLogger {
  /**
   * Create a new FileLogger instance.
   * @param {string|null} logsDir - Custom logs directory path.
   */
  constructor(logsDir = null) {
    this.io = null;
    this.db = null;
    this.logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
    this.logLevel = process.env.LOG_LEVEL || "info";

    this.logsDir = logsDir || path.join(path.dirname(__dirname), "..", "logs");

    // Initialize logs directory asynchronously
    this._initPromise = this._ensureLogsDir();
  }

  /**
   * Ensure the logs directory exists.
   * @returns {Promise<void>}
   */
  async _ensureLogsDir() {
    try {
      await fs.access(this.logsDir);
    } catch {
      await fs.mkdir(this.logsDir, { recursive: true });
      console.log(`[Logger] Created logs directory: ${this.logsDir}`);
    }
  }

  /**
   * Wait for initialization to complete.
   * @returns {Promise<void>}
   */
  async _waitForInit() {
    if (this._initPromise) {
      await this._initPromise;
      this._initPromise = null;
    }
  }

  /**
   * Set the Socket.IO instance for broadcasting logs.
   * @param {Object} io - Socket.IO server instance.
   */
  setIo(io) {
    this.io = io;
  }

  /**
   * Set the database instance for log persistence.
   * @param {Object} db - Database instance.
   */
  setDb(db) {
    this.db = db;
  }

  /**
   * Get today's log filename.
   * @param {Date} date - Date to generate filename for.
   * @returns {string} Log filename in format app-YYYYMMDD.log.
   */
  getLogFileName(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `app-${year}${month}${day}.log`;
  }

  /**
   * Get the full path to the current log file.
   * @returns {string} Absolute path to log file.
   */
  getLogFilePath() {
    return path.join(this.logsDir, this.getLogFileName());
  }

  /**
   * Write a log entry to the log file asynchronously.
   * @param {string} level - Log level.
   * @param {string} msg - Message to write.
   * @param {string} source - Source identifier.
   */
  async writeToFile(level, msg, source) {
    try {
      await this._waitForInit();
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${msg}\n`;
      const filePath = this.getLogFilePath();

      // Append to log file asynchronously
      await fs.appendFile(filePath, logLine, { encoding: "utf8" });
    } catch (e) {
      console.error("[Logger] Error writing to log file:", e.message);
    }
  }

  /**
   * Log a message at the specified level.
   * Respects current log level threshold for filtering.
   * @param {string} level - Log level (error, warn, info, debug).
   * @param {string} msg - Message to log.
   * @param {string} source - Source identifier for the log.
   */
  log(level, msg, source = "server") {
    // Check if this log level should be logged
    if (this.logLevels[level] > this.logLevels[this.logLevel]) {
      return; // Suppress logs below current log level
    }

    const timestamp = Date.now();

    // Write to file (async, fire and forget for performance)
    this.writeToFile(level, msg, source);

    // Save to database
    if (this.db) {
      try {
        this.db.addLog(level, msg, source);
      } catch (e) {
        console.error("[Logger] Error saving to database:", e.message);
      }
    }

    // Broadcast via Socket.IO
    if (this.io) {
      this.io.emit("logs:entry", {
        type: "broadcast",
        data: {
          entry: {
            level,
            message: String(msg),
            source,
            timestamp,
          },
        },
      });
    }

    // Console output
    const ts = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${ts}] [${level.toUpperCase()}] [${source}] ${msg}`);
  }

  /**
   * Log an info message.
   * @param {string} msg - Message to log.
   * @param {string} source - Source identifier for the log.
   */
  info(msg, source = "server") {
    this.log("info", msg, source);
  }

  /**
   * Log an error message.
   * @param {string} msg - Message to log.
   * @param {string} source - Source identifier for the log.
   */
  error(msg, source = "server") {
    this.log("error", msg, source);
  }

  /**
   * Log a warning message.
   * @param {string} msg - Message to log.
   * @param {string} source - Source identifier for the log.
   */
  warn(msg, source = "server") {
    this.log("warn", msg, source);
  }

  /**
   * Log a debug message.
   * @param {string} msg - Message to log.
   * @param {string} source - Source identifier for the log.
   */
  debug(msg, source = "server") {
    if (this.logLevels[this.logLevel] >= this.logLevels.debug) {
      this.log("debug", msg, source);
    }
  }

  /**
   * Read logs from a file asynchronously.
   * @param {string|null} fileName - Name of the log file to read.
   * @returns {Promise<Array<Object>>} Promise resolving to array of parsed log entries.
   */
  async readLogFile(fileName = null) {
    try {
      await this._waitForInit();
      const filePath = fileName ? path.join(this.logsDir, fileName) : this.getLogFilePath();

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return [];
      }

      const content = await fs.readFile(filePath, { encoding: "utf8" });
      const lines = content.trim().split("\n");

      return lines
        .filter((line) => line.trim())
        .map((line) => {
          // Parse: [timestamp] [level] [source] message
          const match = line.match(/\[([^\]]+)\]\s\[([^\]]+)\]\s\[([^\]]+)\]\s(.+)/);
          if (match) {
            return {
              timestamp: new Date(match[1]).getTime(),
              level: match[2].toLowerCase(),
              source: match[3],
              message: match[4],
            };
          }
          return null;
        })
        .filter((entry) => entry !== null)
        .reverse(); // Most recent first
    } catch (e) {
      console.error("[Logger] Error reading log file:", e.message);
      return [];
    }
  }

  /**
   * List all log files in the logs directory.
   * @returns {Promise<Array<string>>} Promise resolving to array of log filenames sorted by name.
   */
  async listLogFiles() {
    try {
      await this._waitForInit();
      try {
        await fs.access(this.logsDir);
      } catch {
        return [];
      }

      const files = await fs.readdir(this.logsDir);
      return files
        .filter((f) => f.endsWith(".log"))
        .sort()
        .reverse();
    } catch (e) {
      console.error("[Logger] Error listing log files:", e.message);
      return [];
    }
  }

  /**
   * Clear all log files from the logs directory.
   * @returns {Promise<number>} Promise resolving to number of files deleted.
   */
  async clearLogFiles() {
    try {
      await this._waitForInit();
      const files = await this.listLogFiles();
      let cleared = 0;

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        try {
          await fs.unlink(filePath);
          cleared++;
        } catch {
          console.warn(`[Logger] Could not delete file: ${filePath}`);
        }
      }

      this.info(`Cleared ${cleared} log files`, "logger");
      return cleared;
    } catch (e) {
      console.error("[Logger] Error clearing log files:", e.message);
      return 0;
    }
  }

  /**
   * Get the total size of all log files in the directory.
   * @returns {Promise<number>} Promise resolving to total size in bytes.
   */
  async getLogsDirectorySize() {
    try {
      await this._waitForInit();
      let totalSize = 0;
      const files = await this.listLogFiles();

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        try {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          console.warn(`[Logger] Could not stat file: ${filePath}`);
        }
      }

      return totalSize;
    } catch (e) {
      console.error("[Logger] Error getting directory size:", e.message);
      return 0;
    }
  }
}

const fileLogger = new FileLogger(null);

export { fileLogger };
export default FileLogger;
