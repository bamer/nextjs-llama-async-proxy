import { transports } from "winston";
import Transport from "winston-transport";
import { Server } from "socket.io";
import { Writable } from "stream";

/**
 * Custom Winston Transport for broadcasting logs via Socket.IO WebSocket
 * Integrates with the existing logging system to stream logs in real-time
 * to all connected clients without storing disk I/O in the UI path.
 */
export class WebSocketTransport extends Transport {
  private io: Server | null = null;
  private logQueue: LogEntry[] = [];
  private maxQueueSize = 500;

  constructor(opts: { io?: Server } = {}) {
    super(opts);
    this.io = opts.io || null;
  }

  /**
   * Set the Socket.IO instance (can be set after construction)
   */
  setSocketIOInstance(io: Server): void {
    this.io = io;
  }

  /**
   * Main transport method - called by Winston on every log event
   */
  log(info: any, callback?: () => void): void {
    setImmediate(() => {
      // Extract log information
      const timestamp = info.timestamp || new Date().toISOString();
      const level = info.level || "info";
      let message = info.message || "";

      // Handle different message formats
      if (typeof message === "object") {
        message = JSON.stringify(message);
      } else {
        message = String(message);
      }

      // Create log entry
      const logEntry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        level: (level as "error" | "warn" | "info" | "debug") || "info",
        message,
        context: {
          source: "application",
        },
      };

      // Add to queue
      this.logQueue.unshift(logEntry);
      if (this.logQueue.length > this.maxQueueSize) {
        this.logQueue.pop();
      }

      // Broadcast to all connected clients
      if (this.io) {
        this.io.emit("log", {
          type: "log",
          data: logEntry,
          timestamp: Date.now(),
        });
      }

      // Callback is required for Winston to continue
      if (callback) {
        callback();
      }
    });
  }

  /**
   * Get cached logs (for requestLogs or reconnections)
   */
  getCachedLogs(): LogEntry[] {
    return [...this.logQueue];
  }

  /**
   * Get logs for a specific level
   */
  getLogsByLevel(level: string): LogEntry[] {
    return this.logQueue.filter((log) => log.level === level);
  }

  /**
   * Clear the log queue
   */
  clearQueue(): void {
    this.logQueue = [];
  }
}

export default WebSocketTransport;
