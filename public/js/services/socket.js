/**
 * Simple Socket.IO Client
 */

class SocketClient {
  constructor(options = {}) {
    this.socket = null;
    this.options = { path: "/llamaproxws", transports: ["websocket"], ...options };
    this.handlers = new Map();
    this._connected = false;
    this._ioLoading = false; // Flag to indicate if io script is currently loading
  }

  // Private method to dynamically load the Socket.IO client script
  _loadIoScript() {
    return new Promise((resolve, reject) => {
      if (typeof io !== "undefined") {
        this._ioLoading = false;
        return resolve();
      }

      const script = document.createElement("script");
      script.src = "/socket.io/socket.io.js";
      script.onload = () => {
        console.log("[SocketClient] Socket.IO script loaded dynamically.");
        this._ioLoading = false;
        resolve();
      };
      script.onerror = (e) => {
        console.error("[SocketClient] Failed to load Socket.IO script dynamically:", e);
        this._ioLoading = false;
        reject(new Error("Failed to load Socket.IO script"));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Establish connection to Socket.IO server
   * Dynamically loads Socket.IO client script if needed
   * @returns {SocketClient} The instance for chaining
   */
  /**
   * Establish connection to Socket.IO server
   * Dynamically loads Socket.IO client script if needed
   * @returns {SocketClient} The instance for chaining
   */
  connect() {
    if (this.socket?.connected) return this;

    // If io is not available and not already loading, trigger dynamic load
    if (typeof io === "undefined" && !this._ioLoading) {
      this._ioLoading = true;
      console.log("[SocketClient] io not found, dynamically loading script...");
      this._loadIoScript()
        .then(() => {
          // Once loaded, re-attempt connection
          this.connect();
        })
        .catch((e) => {
          console.error("[SocketClient] Failed to connect due to script load error:", e);
          this._emit("connect_error", e);
        });
      return this; // Return this to allow chaining for the initial call, subsequent connection will happen via promise
    }

    // If io is still loading, wait for it
    if (this._ioLoading) {
      // This state should ideally not be reached if the above logic is correct
      // But as a safeguard, we return early. The promise from _loadIoScript will re-call connect.
      return this;
    }

    // Proceed with connection if io is available
    console.log("[SocketClient] Connecting to:", window.location.origin);
    console.log("[SocketClient] Options:", this.options);

    this.socket = io(window.location.origin, this.options);

    this.socket.on("connect", () => {
      console.log("[SocketClient] Connected! Socket ID:", this.socket.id);
      this._connected = true;
      this.socket.emit("connection:ack");
      this._emit("connect", this.socket.id);
    });

    this.socket.on("disconnect", (r) => {
      console.log("[SocketClient] Disconnected:", r);
      this._connected = false;
      this._emit("disconnect", r);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SocketClient] Connect error:", err.message);
      this._emit("connect_error", err);
    });

    this.socket.on("connect_timeout", (err) => {
      console.error("[SocketClient] Connect timeout:", err);
    });

    // Log when websocket is used
    this.socket.on("open", () => {
      console.log("[SocketClient] WebSocket open");
    });

    // Forward all events to handlers
    this.socket.onAny((e, d) => {
      this._emit(e, d);
    });
    return this;
  }

  /**
   * Disconnect from Socket.IO server
   * @returns {SocketClient} The instance for chaining
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    return this;
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name to emit
   * @param {Object} data - Data to send with the event
   * @returns {SocketClient} The instance for chaining
   */
  emit(event, data = {}) {
    if (this.socket?.connected) {
      console.log("[SocketClient] Emitting event via raw socket:", event, "connected:", !!this.socket.connected);
      this.socket.emit(event, data);
    } else {
      console.log("[SocketClient] Socket not connected, cannot emit:", event, "connected:", !!this.socket?.connected);
    }
    return this;
  }

  /**
   * Register an event handler
   * @param {string} event - Event name to listen for
   * @param {Function} handler - Callback function to execute when event is received
   * @returns {SocketClient} The instance for chaining
   */
  on(event, handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    if (handler) {
      this.handlers.get(event)?.delete(handler);
    } else {
      this.handlers.delete(event);
    }
    return this;
  }

  once(event, handler) {
    const w = (...args) => {
      this.off(event, w);
      handler(...args);
    };
    this.on(event, w);
    return this;
  }

  /**
   * Make a request and wait for response
   * Returns a Promise that resolves with the response
   */
  async request(event, data = {}) {
    if (!this.socket?.connected) {
      throw new Error("Socket not connected");
    }

    // Generate unique request ID
    const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const responseEvent = `${event}:response:${requestId}`;

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.off(responseEvent);
        reject(new Error(`Request timeout: ${event}`));
      }, 30000);

      // Listen for response
      this.once(responseEvent, (response) => {
        clearTimeout(timeout);
        this.off(responseEvent);
        resolve(response);
      });

      // Send request
      this.socket.emit(event, { ...data, requestId });
    });
  }

  get isConnected() {
    return this.socket?.connected || false;
  }
  get id() {
    return this.socket?.id || null;
  }

  _emit(event, data) {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(data);
      } catch (e) {
        console.error(`[Socket] Handler error (${event}):`, e);
      }
    });
  }
}

const socketClient = new SocketClient();
window.SocketClient = SocketClient;
window.socketClient = socketClient;
