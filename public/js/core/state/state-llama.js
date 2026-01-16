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
      // Events are emitted as: io.emit("llama:status", { status, port, url, mode })
      this.socket.socket.on("llama:status", (data) => {
        console.log("[DEBUG] StateLlamaServer received llama:status broadcast:", data);
        // Handle both flat structure (broadcast) and nested structure (legacy)
        const statusData = data?.data ? data.data : data;
        if (statusData?.status) {
          this.core.set("llamaServerStatus", statusData);
          this.core.set("llamaServerMetrics", statusData.metrics || null);
          console.log("[DEBUG] StateLlamaServer: Updated status to:", statusData.status, statusData.port);
        }
      });

      // Listen to llama:server-event broadcasts (for started/stopped/error events)
      this.socket.socket.on("llama:server-event", (event) => {
        console.log("[DEBUG] StateLlamaServer received llama:server-event:", event);
        const data = event?.data || event;
        // Convert event type to status
        let status = "unknown";
        if (event.type === "started" || event.type === "running") {
          status = "running";
        } else if (event.type === "stopped" || event.type === "closed") {
          status = "idle";
        } else if (event.type === "error") {
          status = "error";
        }
        const statusData = {
          status,
          port: data.port || null,
          url: data.url || null,
          mode: data.mode || "router",
          timestamp: data.timestamp || Date.now(),
        };
        this.core.set("llamaServerStatus", statusData);
        console.log("[DEBUG] StateLlamaServer: Updated status from event to:", status);
      });

      // Also listen to llama-server:status broadcasts (legacy)
      this.socket.socket.on("llama-server:status", (data) => {
        if (data?.type === "broadcast") {
          const status = data.data;
          console.log("[DEBUG] StateLlamaServer received llama-server:status (legacy):", status);
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
        console.log("[DEBUG] StateLlamaServer: Socket connected, fetching initial status");
        
        // Small delay to ensure handlers are registered
        setTimeout(() => {
          this.getStatus()
            .then((result) => {
              console.log("[DEBUG] StateLlamaServer: Initial status result:", result);
              // Handle both response formats
              const statusData = result?.status || result;
              if (statusData) {
                console.log("[DEBUG] StateLlamaServer: Setting initial status to:", statusData.status, statusData.port);
                this.core.set("llamaServerStatus", statusData);
                this.core.set("llamaServerMetrics", statusData.metrics || statusData?.metrics || null);
              }
            })
            .catch((e) => {
              console.log("[DEBUG] StateLlamaServer: Could not fetch initial status:", e.message);
              // Set idle status as fallback
              this.core.set("llamaServerStatus", { status: "idle", port: null, url: null, mode: "router" });
            });
        }, 300);
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
