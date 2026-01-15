/**
 * Client Logger
 * Captures client-side logs and sends them to server
 * Only enabled when ?enable-logging=true URL parameter is set
 */

// Check if client logging should be enabled via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const ENABLE_LOGGING = urlParams.get("enable-logging") === "true";

class ClientLogger {
  constructor() {
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
    this.isInitialized = false;
    this.socket = null;
    this.isActive = false; // Only active when explicitly enabled
  }

  init(socket) {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.socket = socket;

    // Only wrap console if logging is enabled
    if (ENABLE_LOGGING) {
      this.isActive = true;
      this._wrapConsole();
      this.originalConsole.log("[ClientLogger] Client logging ENABLED (via ?enable-logging=true)");
    } else {
      this.originalConsole.log("[ClientLogger] Client logging disabled (use ?enable-logging=true to enable)");
    }
  }

  _wrapConsole() {
    console.log = (...args) => {
      this._log("info", args);
      this.originalConsole.log(...args);
    };

    console.info = (...args) => {
      this._log("info", args);
      this.originalConsole.info(...args);
    };

    console.warn = (...args) => {
      this._log("warn", args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args) => {
      this._log("error", args);
      this.originalConsole.error(...args);
    };

    console.debug = (...args) => {
      this._log("debug", args);
      this.originalConsole.debug(...args);
    };
  }

  _log(level, args) {
    // Skip if not active
    if (!this.isActive) return;

    try {
      // Format message
      const message = args.map(arg => {
        if (typeof arg === "object") {
          return JSON.stringify(arg, null, 2);
        }
        return String(arg);
      }).join(" ");

      // Check socket connection
      const isSocketConnected = this.socket && (
        (typeof this.socket.isConnected === "function" ? this.socket.isConnected() : this.socket.isConnected)
      );

      if (isSocketConnected) {
        const eventData = {
          requestId: Date.now(),
          data: {
            level,
            message: `[CLIENT] ${message}`,
            source: "client",
          },
        };

        this.socket.emit("logs:add", eventData);
      }
    } catch (e) {
      // Silent fail - don't use console here to avoid recursion
    }
  }

  // Manual logging methods (only work when enabled)
  log(message, level = "info") {
    this._log(level, [message]);
  }

  info(message) {
    this._log("info", [message]);
  }

  warn(message) {
    this._log("warn", [message]);
  }

  error(message) {
    this._log("error", [message]);
  }

  debug(message) {
    this._log("debug", [message]);
  }

  // Enable/disable methods
  enable() {
    if (!this.isActive) {
      this.isActive = true;
      this._wrapConsole();
      this.originalConsole.log("[ClientLogger] Client logging enabled");
    }
  }

  disable() {
    if (this.isActive) {
      this.isActive = false;
      // Restore original console methods
      console.log = this.originalConsole.log;
      console.info = this.originalConsole.info;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      console.debug = this.originalConsole.debug;
      this.originalConsole.log("[ClientLogger] Client logging disabled");
    }
  }
}

// Create global instance
window.clientLogger = new ClientLogger();