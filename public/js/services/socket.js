/**
 * Simple Socket.IO Client
 */

class SocketClient {
  constructor(options = {}) {
    this.socket = null;
    this.options = { path: "/llamaproxws", transports: ["websocket"], ...options };
    this.handlers = new Map();
    this._connected = false;
  }

  connect() {
    if (this.socket?.connected) return this;

    if (!window.io) {
      const s = document.createElement("script");
      s.src = "/socket.io/socket.io.js";
      s.onload = () => this._connect();
      document.head.appendChild(s);
    } else {
      this._connect();
    }
    return this;
  }

  _connect() {
    this.socket = window.io(window.location.origin, this.options);

    this.socket.on("connect", () => {
      this._connected = true;
      console.log("[Socket] Connected:", this.socket.id);
      this.socket.emit("connection:ack");
      this._emit("connect", this.socket.id);
    });

    this.socket.on("disconnect", (r) => {
      this._connected = false;
      this._emit("disconnect", r);
    });

    this.socket.on("connect_error", (e) => {
      console.error("[Socket] Error:", e.message);
      this._emit("connect_error", e);
    });

    // Forward all events to handlers
    this.socket.onAny((e, d) => {
      this._emit(e, d);
    });
  }

  disconnect() {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
    return this;
  }

  emit(event, data = {}) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
    return this;
  }

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
    const w = (...args) => { this.off(event, w); handler(...args); };
    this.on(event, w);
    return this;
  }

  get isConnected() { return this.socket?.connected || false; }
  get id() { return this.socket?.id || null; }

  _emit(event, data) {
    this.handlers.get(event)?.forEach(h => {
      try { h(data); } catch (e) { console.error(`[Socket] Handler error (${event}):`, e); }
    });
  }
}

const socketClient = new SocketClient();
window.SocketClient = SocketClient;
window.socketClient = socketClient;
