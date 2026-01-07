/**
 * Logger
 * Simple Socket.IO-aware logger
 */

class Logger {
  constructor() {
    this.io = null;
  }

  setIo(io) {
    this.io = io;
  }

  log(level, msg) {
    const ts = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${ts}] ${msg}`);
    if (this.io) {
      this.io.emit("logs:entry", { entry: { level, message: String(msg), timestamp: Date.now() } });
    }
  }

  info(msg) {
    this.log("info", msg);
  }

  error(msg) {
    this.log("error", msg);
  }

  warn(msg) {
    this.log("warn", msg);
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
