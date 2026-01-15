/**
 * Socket.IO-aware Logger class that integrates with file logging.
 * Provides methods for logging at different levels and broadcasting to clients.
 */
import { fileLogger } from "./file-logger.js";

class Logger {
  /**
   * Create a new Logger instance.
   */
  constructor() {
    this.io = null;
  }

  /**
   * Set the Socket.IO instance for broadcasting logs.
   * @param {Object} io - Socket.IO server instance.
   */
  setIo(io) {
    this.io = io;
    fileLogger.setIo(io);
  }

  /**
   * Set the database instance for log persistence.
   * @param {Object} db - Database instance.
   */
  setDb(db) {
    fileLogger.setDb(db);
  }

  /**
   * Log a message at the specified level.
   * @param {string} level - Log level (error, warn, info, debug).
   * @param {string} msg - Message to log.
   * @param {string} source - Source identifier for the log.
   */
  log(level, msg, source = "server") {
    fileLogger.log(level, msg, source);
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
    this.log("debug", msg, source);
  }
}

const logger = new Logger();

/**
 * Register Socket.IO handlers for client log submissions.
 * @param {Object} socket - Socket.IO socket instance.
 * @param {Object} loggerInstance - Logger instance to use.
 */
function registerLoggerHandlers(socket, loggerInstance) {
  socket.on("logs:add", (req) => {
    const { requestId: providedRequestId, data } = req || {};
    const requestId = providedRequestId ?? Date.now();
    const { level, message } = data || {};

    // Check if both level and message are missing/invalid
    const levelMissing = !level;
    const messageMissing = message === undefined || message === null || message === "";

    if (levelMissing || messageMissing) {
      return socket.emit("logs:add:result", {
        success: false,
        error: { message: "Missing required fields: level and message" },
        requestId,
        timestamp: Date.now(),
      });
    }

    // Call the appropriate logger method
    if (level === "info") {
      loggerInstance.info(message);
    } else if (level === "error") {
      loggerInstance.error(message);
    } else if (level === "warn") {
      loggerInstance.warn(message);
    } else {
      loggerInstance.log(level, message);
    }

    socket.emit("logs:add:result", {
      success: true,
      data: { added: true },
      requestId,
      timestamp: Date.now(),
    });
  });
}

export { logger, registerLoggerHandlers };
export default Logger;
