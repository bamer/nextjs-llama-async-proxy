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
    this.load();
  }
  async load() {
    console.log("[DEBUG] SettingsController load");
    try {
      const c = await stateManager.getConfig();
      console.log("[DEBUG] Config loaded:", `${JSON.stringify(c.config).substring(0, 100)  }...`);
      stateManager.set("config", c.config || {});
    } catch (e) { console.error("[DEBUG] Settings load error:", e); }
  }
  willUnmount() {
    console.log("[DEBUG] SettingsController willUnmount");
    this.unsub?.();
  }
  destroy() { this.willUnmount(); }
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
    return Component.h("div", { className: "settings-page" },
      Component.h("h1", {}, "Settings"),
      Component.h("div", { className: "settings-one-glance" },
        Component.h("div", { className: "card" },
          Component.h("h2", {}, "Server"),
          Component.h("div", { className: "form-grid" },
            this._field("Server Path", "serverPath", c.serverPath || ""),
            this._field("Host", "host", c.host || "localhost"),
            this._field("Port", "port", c.port || 8080, "number"),
            this._field("Models Path", "baseModelsPath", c.baseModelsPath || "")
          ),
          Component.h("label", { className: "checkbox" },
            Component.h("input", { type: "checkbox", checked: !!c.autoStart, onChange: (e) => this._update("autoStart", e.target.checked) }),
            " Auto-start server"
          )
        ),
        Component.h("div", { className: "card" },
          Component.h("h2", {}, "Model Defaults"),
          Component.h("div", { className: "form-grid" },
            this._field("Context Size", "ctx_size", c.ctx_size || 2048, "number"),
            this._field("Batch Size", "batch_size", c.batch_size || 512, "number"),
            this._field("Threads", "threads", c.threads || 4, "number")
          )
        ),
        Component.h("div", { className: "card" },
          Component.h("h2", {}, "About"),
          Component.h("p", {}, "Llama Async Proxy Dashboard v1.0"),
          Component.h("p", { className: "info" }, "Simple dashboard for managing Llama models")
        ),
        Component.h("div", { className: "actions" },
          Component.h("button", { className: "btn btn-primary", onClick: () => this._save() }, "Save Settings"),
          Component.h("button", { className: "btn btn-secondary", onClick: () => this._reset() }, "Reset")
        )
      )
    );
  }

  _field(label, key, val, type = "text") {
    return Component.h("div", { className: "form-group" },
      Component.h("label", {}, label),
      Component.h("input", { type, value: val, onChange: (e) => {
        const v = type === "number" ? parseInt(e.target.value) : e.target.value;
        stateManager.set("config", { ...stateManager.get("config"), [key]: v });
        this.setState({ updated: Date.now() });
      } })
    );
  }

  _update(key, value) {
    stateManager.set("config", { ...stateManager.get("config"), [key]: value });
    this.setState({ updated: Date.now() });
  }

  async _save() {
    console.log("[DEBUG] Settings _save clicked");
    try {
      const config = stateManager.get("config") || {};
      console.log("[DEBUG] Saving config:", JSON.stringify(config).substring(0, 100));
      await stateManager.updateConfig(config);
      showNotification("Settings saved", "success");
    } catch (e) {
      console.error("[DEBUG] Save error:", e);
      showNotification(`Save failed: ${  e.message}`, "error");
    }
  }

  async _reset() {
    console.log("[DEBUG] Settings _reset clicked");
    if (confirm("Reset all settings to defaults?")) {
      try {
        const c = await stateManager.getConfig();
        stateManager.set("config", c.config || {});
        this.setState({ updated: Date.now() });
        showNotification("Settings reset to defaults", "info");
      } catch (e) {
        console.error("[DEBUG] Reset error:", e);
        showNotification(`Reset failed: ${  e.message}`, "error");
      }
    }
  }
}

window.SettingsController = SettingsController;
window.SettingsPage = SettingsPage;
