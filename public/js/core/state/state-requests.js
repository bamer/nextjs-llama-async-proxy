/**
 * State Requests Module - Request management with automatic reconnection
 * Uses Promise-based async/await patterns with AbortController for timeouts
 */

const StateRequests = {
  /**
    * Make an async request with automatic reconnection handling
    * @param {Object} socket - Socket.IO socket instance
    * @param {boolean} connected - Current connection status
    * @param {string} event - Event name to request
    * @param {Object} [data={}] - Data payload to send
    * @param {Map} pending - Map of pending requests for cleanup
    * @returns {Promise<Object>} Response data from server
    * @throws {Error} If connection timeout or server error
    */
  async request(socket, connected, event, data = {}, pending) {
    // Wait for connection if needed
    if (!connected) {
      await this._waitForConnection(socket);
    }
    return this._doRequest(socket, event, data, pending);
  },

  /**
   * Wait for socket connection with timeout
   * @private
   * @param {Object} socket - Socket.IO socket instance
   * @returns {Promise<void>} Resolves when connected
   * @throws {Error} If timeout after 10 seconds
   */
  async _waitForConnection(socket) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      await new Promise((resolve, reject) => {
        const onConnect = () => {
          socket.off("connect", onConnect);
          resolve();
        };

        controller.signal.addEventListener("abort", () => {
          socket.off("connect", onConnect);
          reject(new Error("Connection timeout"));
        });

        socket.on("connect", onConnect);
      });
    } finally {
      clearTimeout(timeout);
    }
  },

  /**
   * Execute the actual socket request with timeout
   * @private
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} event - Event name to emit
   * @param {Object} data - Data payload to send
   * @param {Map} pending - Map of pending requests
   * @returns {Promise<Object>} Response from server
   */
  async _doRequest(socket, event, data, pending) {
    const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const isConfigOperation = event.startsWith("config:") || event.startsWith("settings:");
    const timeoutMs = isConfigOperation ? 5000 : 120000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await new Promise((resolve, reject) => {
        // Set up abort handler
        controller.signal.addEventListener("abort", () => {
          pending.delete(reqId);
          console.warn("[STATE-REQUESTS] Request timeout:", event, "requestId:", reqId);
          reject(new Error(`Timeout: ${event}`));
        });

        pending.set(reqId, { resolve, reject, event });
        socket.emit(event, { ...data, requestId: reqId });
      });
    } finally {
      clearTimeout(timeout);
      pending.delete(reqId);
    }
  },
};

window.StateRequests = StateRequests;
