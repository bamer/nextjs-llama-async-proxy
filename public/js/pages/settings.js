/**
 * Settings Page - With Comprehensive Debug Logging
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
    console.log("[SETTINGS] SettingsController constructor called");
  }

  init() {
    console.log("[SETTINGS] SettingsController.init() called");
  }

  willUnmount() {
    console.log("[SETTINGS] SettingsController.willUnmount() called");
  }

  destroy() {
    this.willUnmount();
  }

  async render() {
    console.log("[SETTINGS] SettingsController.render() called - START");
    
    await this.load();
    
    const config = stateManager.get("config") || {};
    const settings = stateManager.get("settings") || {};
    
    console.log("[SETTINGS] Config loaded:", Object.keys(config).length, "keys");
    console.log("[SETTINGS] Settings loaded:", Object.keys(settings).length, "keys");
    
    this.comp = new SettingsPage({ config, settings });
    
    console.log("[SETTINGS] Calling component.render()");
    const el = this.comp.render();
    this.comp._el = el;
    el._component = this.comp;
    this.comp.bindEvents();
    
    console.log("[SETTINGS] SettingsController.render() - END");
    return el;
  }

  async load() {
    console.log("[SETTINGS] SettingsController.load() called");
    try {
      console.log("[SETTINGS] Loading config...");
      const c = await stateManager.getConfig();
      stateManager.set("config", c.config || {});
      console.log("[SETTINGS] Config loaded:", Object.keys(c.config || {}).length, "keys");
      
      console.log("[SETTINGS] Loading settings...");
      const s = await stateManager.getSettings();
      stateManager.set("settings", s.settings || {});
      console.log("[SETTINGS] Settings loaded:", Object.keys(s.settings || {}).length, "keys");
      
      console.log("[SETTINGS] SettingsController.load() - END");
    } catch (e) {
      console.log("[SETTINGS] Load error:", e.message);
    }
  }
}

class SettingsPage extends Component {
  constructor(props) {
    super(props);
    console.log("[SETTINGS] SettingsPage constructor called");
    
    const config = props.config || {};
    const settings = props.settings || {};
    
    console.log("[SETTINGS] Config keys:", Object.keys(config).join(", "));
    console.log("[SETTINGS] Settings keys:", Object.keys(settings).join(", "));

    this.state = {
      serverPath: config.serverPath || "",
      host: config.host || "localhost",
      port: config.port || 8080,
      baseModelsPath: config.baseModelsPath || "",
      ctx_size: config.ctx_size || 4096,
      threads: config.threads || 4,
      batch_size: config.batch_size || 512,
      temperature: config.temperature || 0.7,
      repeatPenalty: config.repeatPenalty || 1.1,
      maxModelsLoaded: settings.maxModelsLoaded || 4,
      parallelSlots: settings.parallelSlots || 1,
      gpuLayers: settings.gpuLayers || 0,
      routerStatus: null,
    };
    console.log("[SETTINGS] State initialized");
  }

  render() {
    console.log("[SETTINGS] SettingsPage.render() called");
    
    const rs = this.state.routerStatus || {};
    const isRunning = rs.status === "running";
    const loadedCount = rs.models?.filter((m) => m.state === "loaded").length || 0;
    
    console.log("[SETTINGS] Router status:", rs.status || "unknown", "Loaded:", loadedCount);

    const result = Component.h("div", { className: "settings-page" },
      Component.h("h1", {}, "Settings"),

      Component.h("div", { className: "settings-section" },
        Component.h("h2", {}, "Llama Server (Router Mode)"),
        Component.h("p", { className: "section-desc" }, "Configure llama.cpp server in router mode"),
        Component.h("div", { className: "card router-card " + (isRunning ? "running" : "idle") },
          Component.h("div", { className: "router-header" },
            Component.h("div", { className: "router-title" },
              Component.h("h3", {}, "Router Status"),
              Component.h("span", { className: "status-badge " + (isRunning ? "running" : "idle") }, isRunning ? "RUNNING" : "STOPPED")
            ),
            isRunning && Component.h("div", { className: "router-stats" },
              Component.h("div", { className: "stat" },
                Component.h("span", { className: "stat-label" }, "Port"),
                Component.h("span", { className: "stat-value" }, rs.port || 8080)
              ),
              Component.h("div", { className: "stat" },
                Component.h("span", { className: "stat-label" }, "Loaded"),
                Component.h("span", { className: "stat-value" }, String(loadedCount))
              )
            )
          ),
          Component.h("div", { className: "router-controls" },
            isRunning
              ? Component.h("button", { className: "btn btn-danger", "data-action": "stop" }, "Stop Router")
              : Component.h("button", { className: "btn btn-primary", "data-action": "start" }, "Start Router"),
            Component.h("button", { className: "btn btn-secondary", "data-action": "restart", disabled: !isRunning }, "Restart")
          ),
          Component.h("hr", { className: "divider" }),
          Component.h("h4", {}, "Configuration"),
          Component.h("div", { className: "config-grid" },
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Max Models"),
              Component.h("input", { type: "number", value: this.state.maxModelsLoaded, min: 1, max: 16, id: "maxModelsLoaded" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Slots"),
              Component.h("input", { type: "number", value: this.state.parallelSlots, min: 1, max: 32, id: "parallelSlots" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Context"),
              Component.h("input", { type: "number", value: this.state.ctx_size, min: 512, max: 131072, id: "ctx_size" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "GPU Layers"),
              Component.h("input", { type: "number", value: this.state.gpuLayers, min: 0, max: 999, id: "gpuLayers" })
            )
          )
        )
      ),

      Component.h("div", { className: "settings-section" },
        Component.h("h2", {}, "Server Paths"),
        Component.h("p", { className: "section-desc" }, "Configure paths and connection"),
        Component.h("div", { className: "card" },
          Component.h("div", { className: "paths-grid" },
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Models Path"),
              Component.h("input", { type: "text", value: this.state.baseModelsPath, placeholder: "/path/to/models", id: "baseModelsPath" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Server Path"),
              Component.h("input", { type: "text", value: this.state.serverPath, id: "serverPath" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Host"),
              Component.h("input", { type: "text", value: this.state.host, id: "host" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Port"),
              Component.h("input", { type: "number", value: this.state.port, min: 1, max: 65535, id: "port" })
            )
          )
        )
      ),

      Component.h("div", { className: "settings-section" },
        Component.h("h2", {}, "Model Defaults"),
        Component.h("p", { className: "section-desc" }, "Default inference parameters"),
        Component.h("div", { className: "card" },
          Component.h("div", { className: "defaults-grid" },
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Threads"),
              Component.h("input", { type: "number", value: this.state.threads, min: 1, max: 64, id: "threads" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Batch"),
              Component.h("input", { type: "number", value: this.state.batch_size, min: 1, max: 8192, id: "batch_size" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Temperature"),
              Component.h("input", { type: "number", value: this.state.temperature, min: 0, max: 2, step: 0.1, id: "temperature" })
            ),
            Component.h("div", { className: "form-group" },
              Component.h("label", {}, "Repeat Penalty"),
              Component.h("input", { type: "number", value: this.state.repeatPenalty, min: 0, max: 2, step: 0.1, id: "repeatPenalty" })
            )
          )
        )
      ),

      Component.h("div", { className: "settings-section" },
        Component.h("div", { className: "card actions-card" },
          Component.h("h3", {}, "Save Configuration"),
          Component.h("p", { className: "info" }, "Settings apply on router restart"),
          Component.h("div", { className: "action-buttons" },
            Component.h("button", { className: "btn btn-primary btn-lg", "data-action": "save" }, "Save All Settings")
          )
        )
      ),

      Component.h("div", { className: "settings-section" },
        Component.h("div", { className: "card about-card" },
          Component.h("h3", {}, "Llama Async Proxy Dashboard"),
          Component.h("p", {}, "Version 1.2")
        )
      )
    );
    
    console.log("[SETTINGS] SettingsPage.render() - END");
    return result;
  }

  async _save() {
    console.log("[SETTINGS] _save() called");
    const btn = this._el.querySelector('[data-action="save"]');
    btn.textContent = "Saving...";
    btn.disabled = true;

    try {
      if (!stateManager.connected) {
        throw new Error("Not connected to server");
      }

      console.log("[SETTINGS] Reading values from DOM...");
      const config = {
        serverPath: document.getElementById("serverPath").value,
        host: document.getElementById("host").value,
        port: parseInt(document.getElementById("port").value) || 8080,
        baseModelsPath: document.getElementById("baseModelsPath").value,
        ctx_size: parseInt(document.getElementById("ctx_size").value) || 4096,
        threads: parseInt(document.getElementById("threads").value) || 4,
        batch_size: parseInt(document.getElementById("batch_size").value) || 512,
        temperature: parseFloat(document.getElementById("temperature").value) || 0.7,
        repeatPenalty: parseFloat(document.getElementById("repeatPenalty").value) || 1.1,
      };

      const settings = {
        maxModelsLoaded: parseInt(document.getElementById("maxModelsLoaded").value) || 4,
        parallelSlots: parseInt(document.getElementById("parallelSlots").value) || 1,
        gpuLayers: parseInt(document.getElementById("gpuLayers").value) || 0,
      };

      console.log("[SETTINGS] Saving config...");
      await stateManager.updateConfig(config);
      console.log("[SETTINGS] Config saved");
      
      console.log("[SETTINGS] Saving settings...");
      await stateManager.updateSettings(settings);
      console.log("[SETTINGS] Settings saved");

      stateManager.set("config", config);
      stateManager.set("settings", settings);

      showNotification("Settings saved successfully", "success");
      console.log("[SETTINGS] Settings saved successfully");
    } catch (e) {
      console.log("[SETTINGS] Save error:", e.message);
      showNotification("Save failed: " + e.message, "error");
    } finally {
      btn.textContent = "Save All Settings";
      btn.disabled = false;
    }
  }

  async _startLlama() {
    console.log("[SETTINGS] _startLlama() called");
    try {
      await stateManager.startLlama();
      showNotification("Llama router started", "success");
      console.log("[SETTINGS] Router started");
      setTimeout(() => this._refreshStatus(), 2000);
    } catch (e) {
      console.log("[SETTINGS] Start error:", e.message);
      showNotification("Failed: " + e.message, "error");
    }
  }

  async _stopLlama() {
    console.log("[SETTINGS] _stopLlama() called");
    if (!confirm("Stop router?")) return;
    try {
      await stateManager.stopLlama();
      showNotification("Router stopped", "success");
      console.log("[SETTINGS] Router stopped");
      stateManager.set("routerStatus", null);
      this.setState({ routerStatus: null });
    } catch (e) {
      console.log("[SETTINGS] Stop error:", e.message);
      showNotification("Failed: " + e.message, "error");
    }
  }

  async _restartLlama() {
    console.log("[SETTINGS] _restartLlama() called");
    try {
      await stateManager.restartLlama();
      showNotification("Restarting...", "info");
      console.log("[SETTINGS] Router restarting...");
      setTimeout(() => this._refreshStatus(), 3000);
    } catch (e) {
      console.log("[SETTINGS] Restart error:", e.message);
      showNotification("Failed: " + e.message, "error");
    }
  }

  async _refreshStatus() {
    console.log("[SETTINGS] _refreshStatus() called");
    try {
      const rs = await stateManager.getRouterStatus();
      stateManager.set("routerStatus", rs.routerStatus);
      this.setState({ routerStatus: rs.routerStatus });
      console.log("[SETTINGS] Status refreshed:", rs.routerStatus?.status);
    } catch (e) {
      console.log("[SETTINGS] Status refresh error:", e.message);
    }
  }

  getEventMap() {
    console.log("[SETTINGS] getEventMap() called");
    return {
      "click [data-action=start]": () => this._startLlama(),
      "click [data-action=stop]": () => this._stopLlama(),
      "click [data-action=restart]": () => this._restartLlama(),
      "click [data-action=save]": () => this._save(),
    };
  }
}

window.SettingsController = SettingsController;
window.SettingsPage = SettingsPage;
console.log("[SETTINGS] Settings module loaded");
