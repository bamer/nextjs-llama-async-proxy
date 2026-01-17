/**
 * Llama Server State Module - Single Source of Truth
 * ALL router status flows through this module
 */

class StateLlamaServer {
  constructor(stateCore, stateSocket) {
    this.core = stateCore;
    this.socket = stateSocket;

    // Initialize with default loading state
    // THIS IS THE SINGLE SOURCE OF TRUTH for router status
    // Schema-compatible structure matching state-validator.js expectations
    const initialState = {
      status: "idle", // Start as idle, not loading (schema expects running/stopped/error)
      port: null,
      models: [],
      // Additional fields not in schema (will be ignored by validator)
      url: null,
      mode: "router",
      lastUpdated: Date.now(),
      lastError: null,
    };

    this.core.set("llamaServerStatus", initialState);
    // Also expose as routerStatus for backward compatibility (SAME data)
    this.core.set("routerStatus", initialState);

    // Set up handlers and fire requests
    this.setupBroadcastHandlers();
    this.queryStatusOnReady();
  }

  /**
   * Set up broadcast handlers - ALL status updates flow through here
   */
  setupBroadcastHandlers() {
    if (!this.socket.socket) return;

    // Primary: llama:status response (authoritative status from backend)
    this.socket.socket.on("llama:status", (data) => {
      const statusData = data?.data ? data.data : data;
      if (statusData?.status) {
        this.updateUnifiedStatus(statusData, { hasModels: true, source: "llama:status" });
      }
    });

    // Secondary: llama:server-event (state change events)
    this.socket.socket.on("llama:server-event", (event) => {
      const data = event?.data || event;
      let status = "unknown";
      if (event.type === "started" || event.type === "running") status = "running";
      else if (event.type === "stopped" || event.type === "closed") status = "idle";
      else if (event.type === "error") status = "error";

      this.updateUnifiedStatus({
        status,
        port: data.port || null,
        url: data.url || null,
        mode: data.mode || "router",
      }, { source: "llama:server-event" });
    });

    // Tertiary: llama-server:status (metrics updates, preserve status)
    this.socket.socket.on("llama-server:status", (data) => {
      if (data?.type === "broadcast") {
        const newStatus = data.data;
        // Only update metrics, don't change running state
        const current = this.core.get("llamaServerStatus") || {};
        this.core.set("llamaServerMetrics", newStatus.metrics || {});
        
        // Sync both states
        this.core.set("routerStatus", { ...current, metrics: newStatus.metrics });
      }
    });

    // Handle router-stopped broadcast (clear models, keep status)
    this.socket.socket.on("models:router-stopped", () => {
      const current = this.core.get("llamaServerStatus") || {};
      const newState = { ...current, models: [], status: "idle", port: null, url: null };
      this.core.set("llamaServerStatus", newState);
      this.core.set("routerStatus", newState);
      console.log("[StateLlamaServer] Router stopped - cleared models and status");
    });
  }

  /**
   * UPDATE BOTH STATUS KEYS SIMULTANEOUSLY
   * This ensures no state drift between llamaServerStatus and routerStatus
   */
  updateUnifiedStatus(newData, options = {}) {
    const existing = this.core.get("llamaServerStatus") || {};

    // Normalize status to match schema enum (running, stopped, error)
    let normalizedStatus = newData.status || existing.status || "idle";
    if (!["running", "stopped", "error"].includes(normalizedStatus)) {
      normalizedStatus = "idle"; // Default to idle for unknown statuses
    }

    // Merge new data
    const merged = {
      ...existing,
      ...newData,
      status: normalizedStatus,
      port: newData.port !== undefined ? newData.port : existing.port,
      lastUpdated: Date.now(),
      lastError: null,
      // Preserve models unless explicitly provided
      models: options.hasModels ? (newData.models || []) : (existing.models || newData.models || []),
    };

    // Set BOTH keys to the SAME value
    this.core.set("llamaServerStatus", merged);
    this.core.set("routerStatus", merged);

    console.log(`[StateLlamaServer] Updated unified status: ${merged.status} (source: ${options.source || "unknown"})`);
  }

  /**
   * Query server status - fire and forget
   */
  queryStatusOnReady() {
    if (!this.socket.socket) return;

    if (this.socket.socket.connected) {
      this.fetchStatus();
      return;
    }

    this.socket.socket.on("connect", () => {
      this.fetchStatus();
    });
  }

  /**
   * Fetch status from backend
   */
  fetchStatus() {
    this.socket.request("llama:status")
      .then((result) => {
        const statusData = result?.status || result;
        if (statusData) {
          this.updateUnifiedStatus(statusData, { hasModels: true, source: "fetchStatus" });
        }
      })
      .catch((e) => {
        // Failed to fetch - set idle state
        const idleState = {
          status: "idle",
          port: null,
          url: null,
          mode: "router",
          models: [],
          lastUpdated: Date.now(),
          lastError: e.message,
        };
        this.core.set("llamaServerStatus", idleState);
        this.core.set("routerStatus", idleState);
      });
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
