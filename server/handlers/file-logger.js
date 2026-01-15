/**
 * File Logger class that logs to files in logs/ directory with daily rotation.
 * Integrates with Socket.IO for real-time broadcasting and database for persistence.
 */
import fs from "fs";
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

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      console.log(`[Logger] Created logs directory: ${this.logsDir}`);
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
   * Write a log entry to the log file.
   * @param {string} level - Log level.
   * @param {string} msg - Message to write.
   * @param {string} source - Source identifier.
   */
  writeToFile(level, msg, source) {
    try {
      const timestamp = new Date().toISOString();
      const logLine = `[${timestamp}] [${level.toUpperCase()}] [${source}] ${msg}\n`;
      const filePath = this.getLogFilePath();

      // Append to log file
      fs.appendFileSync(filePath, logLine, { encoding: "utf8" });
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

    // Write to file
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
   * Read logs from a file.
   * @param {string|null} fileName - Name of the log file to read.
   * @returns {Array<Object>} Array of parsed log entries.
   */
  readLogFile(fileName = null) {
    try {
      const filePath = fileName ? path.join(this.logsDir, fileName) : this.getLogFilePath();

      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, { encoding: "utf8" });
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
   * @returns {Array<string>} Array of log filenames sorted by name.
   */
  listLogFiles() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return [];
      }

      return fs
        .readdirSync(this.logsDir)
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
   * @returns {number} Number of files deleted.
   */
  clearLogFiles() {
    try {
      const files = this.listLogFiles();
      let cleared = 0;

      files.forEach((file) => {
        const filePath = path.join(this.logsDir, file);
        fs.unlinkSync(filePath);
        cleared++;
      });

      this.info(`Cleared ${cleared} log files`, "logger");
      return cleared;
    } catch (e) {
      console.error("[Logger] Error clearing log files:", e.message);
      return 0;
    }
  }

  /**
   * Get the total size of all log files in the directory.
   * @returns {number} Total size in bytes.
   */
  getLogsDirectorySize() {
    try {
      let totalSize = 0;
      const files = this.listLogFiles();

      files.forEach((file) => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

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
