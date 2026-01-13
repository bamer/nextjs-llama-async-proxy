/**
 * State Connection Handlers - Connection lifecycle management
 */

class StateConnectionHandlers {
  constructor(stateCore, onConnected, onDisconnected) {
    this.core = stateCore;
    this.onConnected = onConnected;
    this.onDisconnected = onDisconnected;
    this.connectionTimeout = null;
    this.connected = false;
  }

  /**
   * Setup connection handlers
   * @param {Object} socket - Socket instance
   */
  setup(socket) {
    socket.on("connect", () => {
      console.log("[STATE-CONNECTION] Socket connected");
      this.connected = true;
      socket.emit("connection:ack");
      this.onConnected();
    });

    socket.on("disconnect", () => {
      console.log("[STATE-CONNECTION] Socket disconnected");
      this.connected = false;
      this.onDisconnected();
    });

    socket.on("connection:established", () => {
      console.log("[STATE-CONNECTION] Connection established event received");
      this.connected = true;
      this.onConnected();
    });

    socket.on("connect_error", (err) => {
      console.log("[STATE-CONNECTION] Connection error:", err.message);
      this.connected = false;
      this.onDisconnected();
    });

    // Initialize as not connected
    this.connected = socket.connected || false;
    if (this.connected) {
      socket.emit("connection:ack");
      this.onConnected();
    }
  }

  /**
   * Check connection status
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}

window.StateConnectionHandlers = StateConnectionHandlers;
