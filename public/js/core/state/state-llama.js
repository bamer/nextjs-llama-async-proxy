/**
 * llama-server state management
 */

class StateLlamaServer {
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;
    this.setupBroadcastHandlers();
  }

  setupBroadcastHandlers() {
    // Register broadcast handlers for llama-server events
    if (this.socket.socket) {
      this.socket.socket.on("llama-server:status", (data) => {
        if (data?.type === "broadcast") {
          const status = data.data;
          console.log("[DEBUG] StateLlamaServer received status:", status);
          this.core.set("llamaServerStatus", status);

          // Update UI state based on status
          this.core.set("llamaServerMetrics", status?.metrics);
        }
      });
    }
  }

  /**
   * Start llama-server
   */
  async start() {
    console.log("[DEBUG] StateLlamaServer.start called");
    return await this.socket.request("llama-server:start");
  }

  /**
   * Stop llama-server
   */
  async stop() {
    console.log("[DEBUG] StateLlamaServer.stop called");
    return await this.socket.request("llama-server:stop");
  }

  /**
   * Get status
   */
  async getStatus() {
    console.log("[DEBUG] StateLlamaServer.getStatus called");
    return await this.socket.request("llama-server:status");
  }
}

window.StateLlamaServer = StateLlamaServer;
