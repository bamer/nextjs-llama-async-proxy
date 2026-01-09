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
          this.comp.setState({ llamaStatus: status });
        }
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        if (this.comp) {
          this.comp.setState({ routerStatus: rs });
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
    await this.load();

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
    
    // Call didMount on main component - child didMount calls are handled by Component.h
    this.comp.didMount && this.comp.didMount();

    this.init();

    return el;
  }

  async load() {
    try {
      const c = await stateManager.getConfig();
      stateManager.set("config", c.config || {});

      const s = await stateManager.getSettings();
      stateManager.set("settings", s.settings || {});

      const ls = await stateManager.getLlamaStatus();
      stateManager.set("llamaStatus", ls.status || null);

      try {
        const rs = await stateManager.getRouterStatus();
        stateManager.set("routerStatus", rs.routerStatus || null);
      } catch (e) {
        stateManager.set("routerStatus", null);
      }

      // Load presets for RouterConfig component
      try {
        const p = await stateManager.request("presets:list");
        stateManager.set("presets", p?.presets || []);
      } catch (e) {
        stateManager.set("presets", []);
      }
    } catch (e) {}
  }

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
