/**
 * Llama Server State Module - Manages llama-server state and broadcasts
 * Handles status updates and metrics from the llama-server process
 */

class StateLlamaServer {
  /**
   * Create a new llama-server state manager
   * @param {Object} stateCore - StateCore instance for state management
   * @param {Object} stateSocket - StateSocket instance for socket communication
   */
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;
    this.setupBroadcastHandlers();
    this.queryStatusOnReady();
  }

  /**
   * Set up broadcast handlers for llama-server events
   */
  setupBroadcastHandlers() {
    // Register broadcast handlers for llama-server events
    if (this.socket.socket) {
      // Listen to llama:status broadcasts (from llama.js)
      this.socket.socket.on("llama:status", (data) => {
        console.log("[DEBUG] StateLlamaServer received llama:status:", data);
        if (data?.status) {
          this.core.set("llamaServerStatus", data);
          this.core.set("llamaServerMetrics", data.metrics);
        }
      });

      // Also listen to llama-server:status broadcasts (legacy)
      this.socket.socket.on("llama-server:status", (data) => {
        if (data?.type === "broadcast") {
          const status = data.data;
          console.log("[DEBUG] StateLlamaServer received llama-server:status:", status);
          this.core.set("llamaServerStatus", status);
          this.core.set("llamaServerMetrics", status?.metrics);
        }
      });
    }
  }

  /**
   * Query server status once socket is connected and ready
   * Sets up a connection listener to fetch status on connect
   */
  queryStatusOnReady() {
    // Listen for connect event
    if (this.socket.socket) {
      this.socket.socket.on("connect", () => {
        console.log("[DEBUG] StateLlamaServer: Socket connected, fetching status");
        // Small delay to ensure handlers are registered
        setTimeout(() => {
          this.getStatus()
            .then((result) => {
              console.log("[DEBUG] StateLlamaServer: Status result:", result);
              if (result?.status) {
                console.log("[DEBUG] StateLlamaServer: Setting status to:", result.status.status);
                this.core.set("llamaServerStatus", result.status);
                this.core.set("llamaServerMetrics", result.status?.metrics || null);
              }
            })
            .catch((e) => {
              console.log("[DEBUG] StateLlamaServer: Could not fetch initial status:", e.message);
            });
        }, 200);
      });
    }
  }

  /**
   * Start the llama-server process
   * @returns {Promise<Object>} Server start response
   */
  async start() {
    console.log("[DEBUG] StateLlamaServer.start called");
    return await this.socket.request("llama:start");
  }

  /**
   * Stop the llama-server process
   * @returns {Promise<Object>} Server stop response
   */
  async stop() {
    console.log("[DEBUG] StateLlamaServer.stop called");
    return await this.socket.request("llama:stop");
  }

  /**
   * Get the current llama-server status
   * @returns {Promise<Object>} Server status object
   */
  async getStatus() {
    console.log("[DEBUG] StateLlamaServer.getStatus called");
    return await this.socket.request("llama:status");
  }
}

window.StateLlamaServer = StateLlamaServer;
