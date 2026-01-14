/**
 * llama-server state management
 */

class StateLlamaServer {
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;
    this.setupBroadcastHandlers();
    this.queryStatusOnReady();
  }

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
   * Start llama-server
   */
  async start() {
    console.log("[DEBUG] StateLlamaServer.start called");
    return await this.socket.request("llama:start");
  }

  /**
   * Stop llama-server
   */
  async stop() {
    console.log("[DEBUG] StateLlamaServer.stop called");
    return await this.socket.request("llama:stop");
  }

  /**
   * Get status
   */
  async getStatus() {
    console.log("[DEBUG] StateLlamaServer.getStatus called");
    return await this.socket.request("llama:status");
  }
}

window.StateLlamaServer = StateLlamaServer;
