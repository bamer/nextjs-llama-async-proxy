/**
 * Logger
 * Socket.IO-aware logger that integrates with file logging
 */

import { fileLogger } from "./file-logger.js";

class Logger {
  constructor() {
    this.io = null;
  }

  setIo(io) {
    this.io = io;
    fileLogger.setIo(io);
  }

  setDb(db) {
    fileLogger.setDb(db);
  }

  log(level, msg, source = "server") {
    fileLogger.log(level, msg, source);
  }

  info(msg, source = "server") {
    fileLogger.info(msg, source);
  }

  error(msg, source = "server") {
    fileLogger.error(msg, source);
  }

  warn(msg, source = "server") {
    fileLogger.warn(msg, source);
  }

  debug(msg, source = "server") {
    fileLogger.debug(msg, source);
  }
}

const logger = new Logger();

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
