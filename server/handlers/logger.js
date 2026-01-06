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
}

const logger = new Logger();

export { logger };
