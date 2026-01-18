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
      stateManager.subscribe("action:settings:save", (data) => this._handleSave(data)),
      stateManager.subscribe("action:settings:reset", () => this._handleReset()),
      stateManager.subscribe("action:router:start", () => this._handleRouterStart()),
      stateManager.subscribe("action:router:restart", () => this._handleRouterRestart()),
      stateManager.subscribe("action:router:stop", () => this._handleRouterStop()),
      stateManager.subscribe("action:config:import", (data) => this._handleImport(data)),
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
    // Load critical data first
    await this._loadCriticalData();

    this.comp = new window.SettingsPage({});

    const el = this.comp.render();
    this.comp._el = el;
    this.comp._controller = this;
    this.comp._mounted = true;
    el._component = this.comp;
    this.comp.bindEvents();

    this.comp.didMount && this.comp.didMount();

    this.init();

    // Load optional data in background
    this._loadOptionalData();

    return el;
  }

  /**
   * Load critical data that blocks initial render (config and settings).
   * @returns {Promise<void>} Promise that resolves when critical data is loaded.
   */
  async _loadCriticalData() {
    const [c, s] = await Promise.all([
      stateManager.getConfig(),
      stateManager.getSettings(),
    ]);
    stateManager.set("config", c.config || {});
    stateManager.set("settings", s.settings || {});
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
    const { config, settings } = data;
    try {
      stateManager.setActionStatus("settings:save", { status: "saving" });

      await stateManager.updateConfig(config);
      await stateManager.updateSettings(settings);

      stateManager.set("config", config);
      stateManager.set("settings", settings);

      stateManager.setActionStatus("settings:save", { status: "complete" });
      showNotification("Settings saved successfully", "success");
    } catch (error) {
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
