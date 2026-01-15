/**
 * Settings Controller
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsubscribers = [];
  }

  init() {
    // Subscribe to router status updates
    this.unsubscribers.push(
      stateManager.subscribe("llamaStatus", (status) => {
        if (this.comp) {
          this.comp.llamaStatus = status;
          this.comp._updateStatusUI();
        }
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        if (this.comp) {
          this.comp.routerStatus = rs;
          this.comp._updateStatusUI();
        }
      })
    );
  }

  willUnmount() {
    this.unsubscribers.forEach((unsub) => unsub());
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    // Load critical data first
    await this._loadCriticalData();

    // Get available data
    const config = stateManager.get("config") || {};
    const settings = stateManager.get("settings") || {};
    const llamaStatus = stateManager.get("llamaStatus") || null;
    const routerStatus = stateManager.get("routerStatus") || null;
    const presets = stateManager.get("presets") || [];

    this.comp = new window.SettingsPage({
      config,
      settings,
      llamaStatus,
      routerStatus,
      presets,
      controller: this,
    });

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
   * @returns {Promise<void>} Promise that resolves when critical data is loaded
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
   * Load optional data - doesn't block initial render
   */
  _loadOptionalData() {
    Promise.all([
      stateManager.getLlamaStatus().catch(() => null),
      stateManager.request("presets:list").catch(() => []),
    ]).then(([status, presets]) => {
      stateManager.set("llamaStatus", status?.status || null);
      stateManager.set("presets", presets?.presets || []);

      // Update UI if component still mounted
      if (this.comp && this.comp._updateStatusUI) {
        this.comp._updateStatusUI();
      }
    }).catch(e => {
      console.warn("[SETTINGS] Optional data load failed:", e.message);
    });
  }

  /**
   * Handle router actions from the UI (start, stop, restart).
   * @param {string} action - The action to perform
   * @returns {Promise<void>} Promise that resolves when action is complete
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
   * Start the llama router server.
   * @returns {Promise<void>} Promise that resolves when server is started
   */
  async _start() {
    try {
      await stateManager.startLlama();
      showNotification("Starting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router started successfully", "success");
        } catch (e) {
          console.error("[SETTINGS] Error checking status:", e.message);
        }
      }, 3000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }

  /**
   * Stop the llama router server after user confirmation.
   * @returns {Promise<void>} Promise that resolves when server is stopped
   */
  async _stop() {
    if (!confirm("Stop router?")) return;
    try {
      await stateManager.stopLlama();
      showNotification("Stopping router...", "info");
      // Wait a bit for the router to stop, then verify
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          const status = s.status || { status: "idle", port: null };
          stateManager.set("llamaStatus", status);
          stateManager.set("routerStatus", null);
          showNotification("Router stopped successfully", "success");
        } catch (e) {
          console.error("[SETTINGS] Error checking status after stop:", e.message);
          // Set to idle state anyway
          const status = { status: "idle", port: null };
          stateManager.set("llamaStatus", status);
          stateManager.set("routerStatus", null);
          showNotification("Router stopped", "success");
        }
      }, 1000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }

  /**
   * Restart the llama router server.
   * @returns {Promise<void>} Promise that resolves when server is restarted
   */
  async _restart() {
    try {
      await stateManager.restartLlama();
      showNotification("Restarting router...", "info");
      setTimeout(async () => {
        try {
          const s = await stateManager.getLlamaStatus();
          stateManager.set("llamaStatus", s.status || null);
          const rs = await stateManager.getRouterStatus();
          stateManager.set("routerStatus", rs.routerStatus);
          showNotification("Router restarted", "success");
        } catch (e) {
          console.error("[SETTINGS] Error checking status:", e.message);
        }
      }, 5000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }
}

window.SettingsController = SettingsController;
