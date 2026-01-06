/**
 * Settings Page - Simple one-glance layout
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    this.unsub = null;
    console.log("[DEBUG] SettingsController created");
  }
  init() {
    console.log("[DEBUG] SettingsController init");
    this.unsub = stateManager.subscribe("config", () => {
      console.log("[DEBUG] Config state changed");
      if (this.comp) {
        this.comp.setState({ updated: Date.now() });
      }
    });
    this.unsubSettings = stateManager.subscribe("settings", () => {
      console.log("[DEBUG] Settings state changed");
      if (this.comp) {
        this.comp.setState({ updated: Date.now() });
      }
    });
    this.load();
  }
  async load() {
    console.log("[DEBUG] SettingsController load");
    try {
      const c = await stateManager.getConfig();
      console.log("[DEBUG] Config loaded:", `${JSON.stringify(c.config).substring(0, 100)}...`);
      stateManager.set("config", c.config || {});
      const s = await stateManager.getSettings();
      console.log("[DEBUG] Settings loaded:", `${JSON.stringify(s.settings).substring(0, 200)}...`);
      stateManager.set("settings", s.settings || {});
    } catch (e) {
      console.error("[DEBUG] Settings load error:", e);
    }
  }
  willUnmount() {
    console.log("[DEBUG] SettingsController willUnmount");
    this.unsub?.();
    this.unsubSettings?.();
  }
  destroy() {
    this.willUnmount();
  }
  render() {
    this.comp = new SettingsPage({});
    this.init();
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    return el;
  }
}

class SettingsPage extends Component {
  constructor(props) {
    super(props);
    this.state = { updated: 0 };
  }

  render() {
    // Always read latest config from stateManager
    const c = stateManager.get("config") || {};
    const s = stateManager.get("settings") || {};
    return Component.h(
      "div",
      { className: "settings-page" },
      Component.h("h1", {}, "Settings"),
      Component.h(
        "div",
        { className: "settings-one-glance" },
        Component.h(
          "div",
          { className: "card" },
          Component.h("h2", {}, "Server"),
          Component.h(
            "div",
            { className: "form-grid" },
            this._field("Server Path", "serverPath", c.serverPath || ""),
            this._field("Host", "host", c.host || "localhost"),
            this._field("Port", "port", c.port || 8080, "number"),
            this._field("Models Path", "baseModelsPath", c.baseModelsPath || "")
          ),
          Component.h(
            "label",
            { className: "checkbox" },
            Component.h("input", {
              type: "checkbox",
              checked: !!c.autoStart,
              onChange: (e) => this._updateConfig("autoStart", e.target.checked),
            }),
            " Auto-start server"
          )
        ),
        Component.h(
          "div",
          { className: "card" },
          Component.h("h2", {}, "Router Mode Settings"),
          Component.h("p", { className: "info" }, "Settings for llama.cpp router mode (multi-model support)"),
          Component.h(
            "div",
            { className: "form-grid" },
            this._field("Max Models Loaded", "maxModelsLoaded", s.maxModelsLoaded || 4, "number"),
            this._field("Parallel Slots", "parallelSlots", s.parallelSlots || 1, "number"),
            this._field("Context Size", "ctx_size", c.ctx_size || 4096, "number"),
            this._field("Threads", "threads", c.threads || 4, "number")
          ),
          Component.h(
            "label",
            { className: "checkbox" },
            Component.h("input", {
              type: "checkbox",
              checked: s.autoLoadModels !== false,
              onChange: (e) => this._updateSettings("autoLoadModels", e.target.checked),
            }),
            " Auto-load models on first request"
          ),
          Component.h(
            "label",
            { className: "checkbox" },
            Component.h("input", {
              type: "checkbox",
              checked: !!s.noAutoLoadModels,
              onChange: (e) => this._updateSettings("noAutoLoadModels", e.target.checked),
            }),
            " Require explicit load (disables auto-load)"
          )
        ),
        Component.h(
          "div",
          { className: "card" },
          Component.h("h2", {}, "Model Defaults"),
          Component.h(
            "div",
            { className: "form-grid" },
            this._field("Context Size", "ctx_size", c.ctx_size || 2048, "number"),
            this._field("Batch Size", "batch_size", c.batch_size || 512, "number"),
            this._field("Threads", "threads", c.threads || 4, "number")
          )
        ),
        Component.h(
          "div",
          { className: "card" },
          Component.h("h2", {}, "Llama Server Control"),
          Component.h(
            "div",
            { className: "button-group" },
            Component.h(
              "button",
              { className: "btn btn-primary", "data-action": "startLlama" },
              "Start Router"
            ),
            Component.h(
              "button",
              { className: "btn", "data-action": "restartLlama" },
              "Restart Router"
            ),
            Component.h(
              "button",
              { className: "btn btn-danger", "data-action": "stopLlama" },
              "Stop Router"
            )
          ),
          Component.h(
            "div",
            { className: "router-status", "data-field": "routerStatus" },
            "Router status will appear here..."
          )
        ),
        Component.h(
          "div",
          { className: "card" },
          Component.h("h2", {}, "About"),
          Component.h("p", {}, "Llama Async Proxy Dashboard v1.1"),
          Component.h("p", { className: "info" }, "Multi-model support via llama.cpp router mode")
        ),
        Component.h(
          "div",
          { className: "actions" },
          Component.h(
            "button",
            { className: "btn btn-primary", onClick: () => this._save() },
            "Save Settings"
          ),
          Component.h(
            "button",
            { className: "btn btn-secondary", onClick: () => this._reset() },
            "Reset"
          )
        )
      )
    );
  }

  _field(label, key, val, type = "text") {
    return Component.h(
      "div",
      { className: "form-group" },
      Component.h("label", {}, label),
      Component.h("input", {
        type,
        value: val,
        onChange: (e) => {
          const v = type === "number" ? parseInt(e.target.value) : e.target.value;
          this.setState({ updated: Date.now() });
        },
      })
    );
  }

  _updateConfig(key, value) {
    stateManager.set("config", { ...stateManager.get("config"), [key]: value });
    this.setState({ updated: Date.now() });
  }

  _updateSettings(key, value) {
    stateManager.set("settings", { ...stateManager.get("settings"), [key]: value });
    this.setState({ updated: Date.now() });
  }

  async _save() {
    console.log("[DEBUG] Settings _save clicked");
    try {
      const config = stateManager.get("config") || {};
      const settings = stateManager.get("settings") || {};
      console.log("[DEBUG] Saving config:", JSON.stringify(config).substring(0, 100));
      console.log("[DEBUG] Saving settings:", JSON.stringify(settings).substring(0, 200));
      await stateManager.updateConfig(config);
      await stateManager.updateSettings(settings);
      // Apply llama config if router is running
      try {
        await stateManager.configureLlama(settings);
        console.log("[DEBUG] Llama router configured");
      } catch (e) {
        console.warn("[DEBUG] Could not configure llama router:", e.message);
      }
      showNotification("Settings saved", "success");
    } catch (e) {
      console.error("[DEBUG] Save error:", e);
      showNotification(`Save failed: ${e.message}`, "error");
    }
  }

  async _reset() {
    console.log("[DEBUG] Settings _reset clicked");
    if (confirm("Reset all settings to defaults?")) {
      try {
        const c = await stateManager.getConfig();
        stateManager.set("config", c.config || {});
        const s = await stateManager.getSettings();
        stateManager.set("settings", s.settings || {});
        this.setState({ updated: Date.now() });
        showNotification("Settings reset to defaults", "info");
      } catch (e) {
        console.error("[DEBUG] Reset error:", e);
        showNotification(`Reset failed: ${e.message}`, "error");
      }
    }
  }

  async _refreshLlamaStatus() {
    console.log("[DEBUG] Refreshing llama status");
    try {
      const status = await stateManager.getLlamaStatus();
      const statusEl = this._el?.querySelector?.("[data-field='routerStatus']");
      if (statusEl) {
        const statusText = status.status === "running"
          ? `Running on port ${status.port} | Mode: ${status.mode || "router"} | Models: ${status.models?.length || 0}`
          : "Router is not running";
        statusEl.textContent = statusText;
      }
    } catch (e) {
      console.error("[DEBUG] Failed to get llama status:", e.message);
    }
  }

  async _startLlama() {
    console.log("[DEBUG] Starting llama router");
    showNotification("Starting llama router...", "info");
    try {
      await stateManager.startLlama();
      showNotification("Llama router started", "success");
      this._refreshLlamaStatus();
    } catch (e) {
      console.error("[DEBUG] Start error:", e);
      showNotification(`Failed to start: ${e.message}`, "error");
    }
  }

  async _restartLlama() {
    console.log("[DEBUG] Restarting llama router");
    showNotification("Restarting llama router...", "info");
    try {
      await stateManager.restartLlama();
      setTimeout(() => {
        showNotification("Llama router restarted", "success");
        this._refreshLlamaStatus();
      }, 3000);
    } catch (e) {
      console.error("[DEBUG] Restart error:", e);
      showNotification(`Failed to restart: ${e.message}`, "error");
    }
  }

  async _stopLlama() {
    console.log("[DEBUG] Stopping llama router");
    if (!confirm("Stop the llama router? All loaded models will be unloaded.")) {
      return;
    }
    showNotification("Stopping llama router...", "info");
    try {
      await stateManager.stopLlama();
      showNotification("Llama router stopped", "success");
      this._refreshLlamaStatus();
    } catch (e) {
      console.error("[DEBUG] Stop error:", e);
      showNotification(`Failed to stop: ${e.message}`, "error");
    }
  }

  getEventMap() {
    return {
      "click [data-action=startLlama]": () => this._startLlama(),
      "click [data-action=restartLlama]": () => this._restartLlama(),
      "click [data-action=stopLlama]": () => this._stopLlama(),
    };
  }

  didMount() {
    // Refresh llama status on mount
    this._refreshLlamaStatus();
    // Refresh every 10 seconds
    this._statusInterval = setInterval(() => this._refreshLlamaStatus(), 10000);
  }

  willUnmount() {
    if (this._statusInterval) {
      clearInterval(this._statusInterval);
    }
  }
}

window.SettingsController = SettingsController;
window.SettingsPage = SettingsPage;
