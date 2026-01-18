/**
 * Unified Socket.IO Client
 * Single implementation for all socket communication
 * Used for both server requests and receiving broadcasts
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.options = {
      path: "/llamaproxws",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };
    this.handlers = new Map();
    this._connected = false;
  }

  /**
   * Connect to Socket.IO server
   */
  connect() {
    if (this.socket?.connected) return this;

    console.log("[SocketClient] Connecting...");

    this.socket = io(this.options);

    // Connection events
    this.socket.on("connect", () => {
      console.log("[SocketClient] Connected! ID:", this.socket.id);
      this._connected = true;
      this._emit("socket:connected", { id: this.socket.id });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketClient] Disconnected:", reason);
      this._connected = false;
      this._emit("socket:disconnected", { reason });
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SocketClient] Connection error:", err.message);
      this._connected = false;
    });

    this.socket.on("connect_timeout", () => {
      console.warn("[SocketClient] Connection timeout");
    });

    this.socket.on("reconnect", (attempt) => {
      console.log("[SocketClient] Reconnected after", attempt, "attempts");
      this._connected = true;
    });

    this.socket.on("reconnect_failed", () => {
      console.error("[SocketClient] Reconnection failed");
    });

    // Forward all broadcast events to handlers
    this.socket.onAny((event, data) => {
      if (event !== "connect" && event !== "disconnect" && event !== "connect_error") {
        this._emit(event, data);
      }
    });

    this.socket.connect();
    return this;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._connected = false;
    }
    return this;
  }

  /**
   * Register event handler for broadcasts
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (typeof handler !== "function") return () => {};
    
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
    
    console.log("[SocketClient] Handler registered:", event);
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  /**
   * Remove event handler
   */
  off(event, handler) {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
    } else {
      this.handlers.delete(event);
    }
    return this;
  }

  /**
   * Make a request and wait for response
   * @param {string} event - Event name
   * @param {Object} data - Request data
   * @param {number} timeout - Timeout in ms (default 30s)
   * @returns {Promise} Response {success, data/error}
   */
  async request(event, data = {}, timeout = 30000) {
    if (!this.socket) {
      throw new Error("Socket not initialized. Call connect() first.");
    }

    // Wait for connection
    if (!this.socket.connected) {
      console.log("[SocketClient] Waiting for connection...");
      await this._waitForConnection(10000);
    }

    if (!this.socket.connected) {
      throw new Error("Not connected to server");
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout (${timeout}ms): ${event}`));
      }, timeout);

      try {
        this.socket.emit(event, data, (response) => {
          clearTimeout(timeoutId);
          resolve(response);
        });
      } catch (e) {
        clearTimeout(timeoutId);
        reject(e);
      }
    });
  }

  /**
   * Wait for connection
   */
  async _waitForConnection(timeout = 5000) {
    if (this.socket?.connected) return;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (this.socket?.connected) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error("Connection timeout"));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  /**
   * Emit event without waiting for response
   */
  emit(event, data = {}) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
    return this;
  }

  /**
   * Get connection status
   */
  get isConnected() {
    return this._connected && this.socket?.connected;
  }

  /**
   * Internal emit to handlers
   */
  _emit(event, data) {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (e) {
        console.error(`[SocketClient] Handler error (${event}):`, e);
      }
    });
  }
}

// Create singleton instance
window.socketClient = new SocketClient();

// Auto-connect on load (will work because Socket.IO is loaded before this script)
if (typeof io !== "undefined") {
  window.socketClient.connect();
} else {
  // Wait for Socket.IO to load
  window.addEventListener("DOMContentLoaded", () => {
    if (typeof io !== "undefined") {
      window.socketClient.connect();
    }
  });
}

console.log("[SocketClient] Module loaded");
