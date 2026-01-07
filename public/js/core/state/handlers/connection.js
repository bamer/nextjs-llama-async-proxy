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
    this.connectionTimeout = setTimeout(() => {
      if (!this.connected) {
        console.log("[STATE-CONNECTION] Connection timeout - setting connected=true");
        this.connected = true;
        this.onConnected();
      }
    }, 3000);

    socket.on("connect", () => {
      socket.emit("connection:ack");
    });

    socket.on("disconnect", () => {
      this.connected = false;
      this.onDisconnected();
    });

    socket.on("connection:established", () => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.connected = true;
      this.onConnected();
    });
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
