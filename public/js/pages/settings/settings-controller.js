/**
 * Settings Controller
 * Event-driven controller using state subscriptions instead of polling
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsubscribers = [];
    this.statusUnsubscribers = []; // Separate cleanup for status subscriptions
  }

  /**
   * Clean up all status subscriptions.
   */
  _cleanupStatusSubscriptions() {
    this.statusUnsubscribers.forEach((unsub) => {
      try {
        if (typeof unsub === "function") unsub();
      } catch (e) {
        console.warn("[SETTINGS] Error cleaning up status subscription:", e);
      }
    });
    this.statusUnsubscribers = [];
  }

  init() {
    // Clean up any existing status subscriptions first
    this._cleanupStatusSubscriptions();

    // NEW: Listen for action events
    this.unsubscribers.push(
      stateManager.subscribe("action:settings:save", (state) => this._handleSave(state.data)),
      stateManager.subscribe("action:settings:reset", () => this._handleReset()),
      stateManager.subscribe("action:router:start", () => this._handleRouterStart()),
      stateManager.subscribe("action:router:restart", () => this._handleRouterRestart()),
      stateManager.subscribe("action:router:stop", () => this._handleRouterStop()),
      stateManager.subscribe("action:config:import", (state) => this._handleImport(state.data)),
      stateManager.subscribe("action:config:export", () => this._handleExport())
    );

    // Subscribe to router status updates
    this.statusUnsubscribers.push(
      stateManager.subscribe("llamaStatus", (status) => {
        stateManager.set("llamaServerStatus", status);
      })
    );

    // Subscribe to router status updates
    this.statusUnsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        stateManager.set("routerStatus", rs);
      })
    );
  }

  willUnmount() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    }
    this._cleanupStatusSubscriptions();
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    // Create component first (don't wait for data)
    this.comp = new window.SettingsPage({});

    const el = this.comp.render();
    this.comp._el = el;
    this.comp._controller = this;
    this.comp._mounted = true;
    el._component = this.comp;
    this.comp.bindEvents();

    this.comp.didMount && this.comp.didMount();

    this.init();

    // Load data in background (non-blocking)
    this._loadCriticalData().catch(e => {
      console.warn("[SETTINGS] Background data load failed:", e.message);
    });

    // Load optional data in background
    this._loadOptionalData();

    return el;
  }

  /**
   * Load critical data (config and settings) - non-blocking
   * @returns {Promise<void>}
   */
  async _loadCriticalData() {
    console.log("[SETTINGS] Loading critical data...");
    try {
      // Load config
      const configPromise = stateManager.getConfig().then(c => {
        console.log("[SETTINGS] Config response received:", !!c);
        const config = c?.config || c || {};
        stateManager.set("config", config);
        console.log("[SETTINGS] Config loaded, keys:", Object.keys(config));
      }).catch(e => {
        console.error("[SETTINGS] Config load error:", e.message);
        stateManager.set("config", {});
      });

      // Load settings
      const settingsPromise = stateManager.getSettings().then(s => {
        console.log("[SETTINGS] Settings response received:", !!s);
        const settings = s?.settings || s || {};
        stateManager.set("settings", settings);
        console.log("[SETTINGS] Settings loaded, keys:", Object.keys(settings));
      }).catch(e => {
        console.error("[SETTINGS] Settings load error:", e.message);
        stateManager.set("settings", {});
      });

      await Promise.all([configPromise, settingsPromise]);
      console.log("[SETTINGS] All data loaded successfully");
    } catch (e) {
      console.error("[SETTINGS] Data load failed:", e.message);
    }
  }

  /**
   * Load optional data - doesn't block initial render.
   */
  _loadOptionalData() {
    Promise.all([
      stateManager.getLlamaStatus().catch(() => null),
      stateManager.request("presets:list").catch(() => []),
    ])
      .then(([status, presets]) => {
        stateManager.set("llamaStatus", status?.status || null);
        stateManager.set("presets", presets?.presets || []);
      })
      .catch((e) => {
        console.warn("[SETTINGS] Optional data load failed:", e.message);
      });
  }

  /**
   * Handle settings save action.
   * @param {Object} data - Data containing config and settings
   */
  async _handleSave(data) {
    console.log("[SETTINGS] _handleSave called with:", data ? "data present" : "no data");
    const { config, settings } = data;
    try {
      stateManager.setActionStatus("settings:save", { status: "saving" });
      console.log("[SETTINGS] Saving config:", config);
      console.log("[SETTINGS] Saving settings:", settings);

      const configResult = await stateManager.updateConfig(config);
      console.log("[SETTINGS] Config result:", configResult);

      const settingsResult = await stateManager.updateSettings(settings);
      console.log("[SETTINGS] Settings result:", settingsResult);

      stateManager.set("config", config);
      stateManager.set("settings", settings);

      stateManager.setActionStatus("settings:save", { status: "complete" });
      showNotification("Settings saved successfully", "success");
    } catch (error) {
      console.error("[SETTINGS] Save error:", error.message);
      stateManager.setActionStatus("settings:save", {
        status: "error",
        error: error.message,
      });
      showNotification(`Failed to save settings: ${error.message}`, "error");
    }
  }

  /**
   * Handle settings reset action.
   */
  async _handleReset() {
    try {
      stateManager.setActionStatus("settings:reset", { status: "resetting" });

      const config = await stateManager.resetConfig();
      const settings = await stateManager.resetSettings();

      stateManager.set("config", config);
      stateManager.set("settings", settings);

      stateManager.setActionStatus("settings:reset", { status: "complete" });
      showNotification("Settings reset to defaults", "success");
    } catch (error) {
      stateManager.setActionStatus("settings:reset", {
        status: "error",
        error: error.message,
      });
    }
  }

  /**
   * Handle router restart action.
   */
  async _handleRouterRestart() {
    try {
      stateManager.setActionStatus("router:restart", { status: "restarting" });

      await stateManager.restartLlama();

      stateManager.setActionStatus("router:restart", { status: "complete" });
      showNotification("Router restarted successfully", "success");
    } catch (error) {
      stateManager.setActionStatus("router:restart", {
        status: "error",
        error: error.message,
      });
      showNotification(`Failed to restart router: ${error.message}`, "error");
    }
  }

  /**
   * Handle router start action.
   */
  async _handleRouterStart() {
    try {
      stateManager.setActionStatus("router:start", { status: "starting" });

      await stateManager.startLlama();

      stateManager.setActionStatus("router:start", { status: "complete" });
      showNotification("Router started successfully", "success");
    } catch (error) {
      stateManager.setActionStatus("router:start", {
        status: "error",
        error: error.message,
      });
      showNotification(`Failed to start router: ${error.message}`, "error");
    }
  }

  /**
   * Handle router stop action.
   */
  async _handleRouterStop() {
    try {
      stateManager.setActionStatus("router:stop", { status: "stopping" });

      await stateManager.stopLlama();

      stateManager.setActionStatus("router:stop", { status: "complete" });
      showNotification("Router stopped", "success");
    } catch (error) {
      stateManager.setActionStatus("router:stop", {
        status: "error",
        error: error.message,
      });
    }
  }

  /**
   * Handle config import action.
   * @param {Object} data - Data containing config
   */
  _handleImport(data) {
    const { config } = data;
    if (config) {
      stateManager.set("config", config);
      showNotification("Configuration imported", "success");
    }
  }

  /**
   * Handle config export action.
   */
  _handleExport() {
    const config = stateManager.get("config");
    const settings = stateManager.get("settings");
    const data = {
      config,
      settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `llama-proxy-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Handle router actions from the UI (start, stop, restart).
   * @param {string} action - The action to perform.
   * @returns {Promise<void>} Promise that resolves when action is complete.
   */
  async handleRouterAction(action) {
    switch (action) {
    case "start":
      await this._start();
      break;
    case "stop":
      await this._stop();
      break;
    case "restart":
      await this._restart();
      break;
    }
  }

  /**
   * Wait for router status change via event subscription (fully async, no polling).
   * @param {string} targetStatus - Status to wait for (e.g., "running", "idle").
   * @param {number} timeoutMs - Timeout in milliseconds (default: 30000).
   * @returns {Promise<Object|null>} Router status object or null if timeout.
   */
  _waitForStatusChange(targetStatus, timeoutMs = 30000) {
    return new Promise((resolve) => {
      // Check current status first
      const currentStatus = stateManager.get("llamaStatus");
      if (currentStatus?.status === targetStatus) {
        console.log("[SETTINGS] Current status is already:", targetStatus);
        return resolve(currentStatus);
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        unsubscribe();
        console.warn("[SETTINGS] Status change timeout, still waiting for:", targetStatus);
        resolve(null);
      }, timeoutMs);

      // Subscribe to status changes (event-driven, no polling)
      const unsubscribe = stateManager.subscribe("llamaServerStatus", (status) => {
        console.log("[SETTINGS] Status event received:", status?.status);
        if (status?.status === targetStatus) {
          clearTimeout(timeoutId);
          unsubscribe();
          console.log("[SETTINGS] Target status reached:", targetStatus);
          resolve(status);
        }
      });

      // Also track in statusUnsubscribers for cleanup
      this.statusUnsubscribers.push(unsubscribe);
    });
  }

  /**
   * Start the llama router server.
   * Uses event-driven status waiting instead of setTimeout polling.
   * @returns {Promise<void>} Promise that resolves when server is started.
   */
  async _start() {
    try {
      await stateManager.startLlama();
      showNotification("Starting router...", "info");

      // Wait for router to reach "running" status via event subscription
      const status = await this._waitForStatusChange("running", 30000);

      if (status) {
        stateManager.set("llamaStatus", status);
        showNotification("Router started successfully", "success");
      } else {
        showNotification("Router may have started - please refresh to verify", "warning");
      }
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }

  /**
   * Stop the llama router server after user confirmation.
   * Uses event-driven status waiting instead of setTimeout polling.
   * @returns {Promise<void>} Promise that resolves when server is stopped.
   */
  async _stop() {
    if (!confirm("Stop router?")) return;
    try {
      await stateManager.stopLlama();
      showNotification("Stopping router...", "info");

      // Wait for router to reach "idle" status via event subscription
      const status = await this._waitForStatusChange("idle", 15000);

      if (status) {
        stateManager.set("llamaStatus", status);
        stateManager.set("routerStatus", null);
        showNotification("Router stopped successfully", "success");
      } else {
        // Fallback to idle state if timeout
        const idleStatus = { status: "idle", port: null };
        stateManager.set("llamaStatus", idleStatus);
        stateManager.set("routerStatus", null);
        showNotification("Router stopped", "success");
      }
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }

  /**
   * Restart the llama router server.
   * Uses event-driven status waiting instead of setTimeout polling.
   * @returns {Promise<void>} Promise that resolves when server is restarted.
   */
  async _restart() {
    try {
      await stateManager.restartLlama();
      showNotification("Restarting router...", "info");

      // Wait for router to reach "running" status via event subscription
      const status = await this._waitForStatusChange("running", 30000);

      if (status) {
        stateManager.set("llamaStatus", status);
        showNotification("Router restarted successfully", "success");
      } else {
        showNotification("Router may have restarted - please refresh to verify", "warning");
      }
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }
}

window.SettingsController = SettingsController;
