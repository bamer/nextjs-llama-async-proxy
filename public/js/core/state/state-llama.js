/**
 * Llama Server State Module - Async + Reactive
 * FIXED: No blocking, no timeouts - just fire requests and update when data arrives
 */

class StateLlamaServer {
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;

    // Initialize with default loading state
    this.core.set("llamaServerStatus", {
      status: "loading",
      port: null,
      url: null,
      models: [],
      mode: "router"
    });

    // Set up handlers and fire requests
    this.setupBroadcastHandlers();
    this.queryStatusOnReady();
  }

  /**
   * Set up broadcast handlers - all go through mergeState
   */
  setupBroadcastHandlers() {
    if (!this.socket.socket) return;

    // Primary: llama:status response (has models)
    this.socket.socket.on("llama:status", (data) => {
      const statusData = data?.data ? data.data : data;
      if (statusData?.status) {
        this.mergeState(statusData, { hasModels: true });
      }
    });

    // Secondary: llama:server-event (status changes only)
    this.socket.socket.on("llama:server-event", (event) => {
      const data = event?.data || event;
      let status = "unknown";
      if (event.type === "started" || event.type === "running") status = "running";
      else if (event.type === "stopped" || event.type === "closed") status = "idle";
      else if (event.type === "error") status = "error";

      this.mergeState({
        status,
        port: data.port || null,
        url: data.url || null,
        mode: data.mode || "router",
      });
    });

    // Tertiary: llama-server:status (metrics only, preserve models)
    this.socket.socket.on("llama-server:status", (data) => {
      if (data?.type === "broadcast") {
        const newStatus = data.data;
        this.mergeState({
          status: newStatus.status,
          url: newStatus.url,
          port: newStatus.port,
          metrics: newStatus.metrics,
          rawMetrics: newStatus.rawMetrics,
        });
      }
    });
  }

  /**
   * Merge new state data, preserving models
   */
  mergeState(newData, options = {}) {
    const existing = this.core.get("llamaServerStatus") || {};

    // Preserve models unless new data explicitly provides them
    const merged = {
      ...existing,
      ...newData,
      models: options.hasModels ? newData.models : (existing.models || newData.models),
    };

    this.core.set("llamaServerStatus", merged);
    if (newData.metrics) {
      this.core.set("llamaServerMetrics", newData.metrics);
    }
  }

  /**
   * Query server status - fire and forget, update when arrives
   */
  queryStatusOnReady() {
    if (!this.socket.socket) return;

    // If already connected, fetch immediately
    if (this.socket.socket.connected) {
      this.fetchStatus();
      return;
    }

    // Otherwise wait for connect event
    this.socket.socket.on("connect", () => {
      this.fetchStatus();
    });
  }

  /**
   * Fetch status - NO TIMEOUT, fire and forget
   */
  fetchStatus() {
    this.socket.request("llama:status")
      .then((result) => {
        const statusData = result?.status || result;
        if (statusData) {
          this.mergeState(statusData, { hasModels: true });
        }
      })
      .catch((e) => {
        // Failed to fetch - set idle state (not a warning, just expected)
        this.mergeState({
          status: "idle",
          port: null,
          url: null,
          mode: "router",
          models: [],
          modelsError: e.message
        });
      });
    // No timeout - let it complete when it completes
  }

  async start() {
    return await this.socket.request("llama:start");
  }

  async stop() {
    return await this.socket.request("llama:stop");
  }

  async getStatus() {
    const result = await this.socket.request("llama:status");
    return result?.status || result;
  }
}

window.StateLlamaServer = StateLlamaServer;
