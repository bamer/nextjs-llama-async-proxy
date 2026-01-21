/**
 * Debug Tools - Minimal debugging utilities
 * CRITICAL: Capture original console BEFORE any wrapping
 */

const _ORIGINAL_CONSOLE = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

function _safeLog(...args) {
  _ORIGINAL_CONSOLE.log.apply(console, args);
}

class LoggingMonitor {
  constructor() {
    this.enabled = false;
    this._inProgress = new Set();
  }

  logCapture(source, data) {
    if (!this.enabled || this._inProgress.has(source)) return;
    this._inProgress.add(source);
    try {
      _ORIGINAL_CONSOLE.log(`[LOGGING:CAPTURE] ${source}`, data);
    } finally {
      this._inProgress.delete(source);
    }
  }
}

class TimingProfiler {
  mark(name) {
    _safeLog(`[TIMING:MARK] ${name} @ ${performance.now().toFixed(2)}ms`);
  }
}

class EventTracer {
  constructor() {
    this.enabled = false;
  }
  trace(event, data) {
    if (!this.enabled) return;
    _safeLog(`[TRACE:${event}]`, data);
  }
}

class SocketMonitor {
  constructor() {
    this.enabled = false;
  }
  logEvent(type, event, data) {
    if (!this.enabled) return;
    _safeLog(`[SOCKET:${type}] ${event}`, data);
  }
}

window.DEBUG_SYSTEM = {
  timing: new TimingProfiler(),
  tracer: new EventTracer(),
  socket: new SocketMonitor(),
  logging: new LoggingMonitor(),

  enable() {
    this.timing.mark("debug_system_enabled");
    this.tracer.enabled = true;
    this.socket.enabled = true;
    this.logging.enabled = true;
  },

  disable() {
    this.tracer.enabled = false;
    this.socket.enabled = false;
    this.logging.enabled = false;
  },

  clear() {
    this.logging._inProgress.clear();
  },
};

// Export utilities for avoiding infinite loops
window._safeLog = _safeLog;
window._ORIGINAL_CONSOLE = _ORIGINAL_CONSOLE;

// Auto-enable debug only via ?debug=true
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("debug") === "true") {
  window.DEBUG_SYSTEM.enable();
  _safeLog("[DEBUG] Debug system enabled");
} else {
  window.DEBUG_SYSTEM.disable();
}
