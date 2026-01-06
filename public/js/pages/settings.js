/**
 * Settings Page
 */

class SettingsController {
  constructor(options = {}) {
    this.router = options.router || window.router;
    this.comp = null;
  }

  init() {}

  willUnmount() {}

  destroy() {
    this.willUnmount();
  }

  async render() {
    await this.load();

    const config = stateManager.get("config") || {};
    const settings = stateManager.get("settings") || {};

    this.comp = new SettingsPage({ config, settings });

    const el = this.comp.render();
    this.comp._el = el;
    this.comp._controller = this;
    el._component = this.comp;
    this.comp.bindEvents();

    return el;
  }

  async load() {
    try {
      const c = await stateManager.getConfig();
      stateManager.set("config", c.config || {});

      const s = await stateManager.getSettings();
      stateManager.set("settings", s.settings || {});

      try {
        const rs = await stateManager.getRouterStatus();
        stateManager.set("routerStatus", rs.routerStatus || null);
      } catch (e) {
        stateManager.set("routerStatus", null);
      }
    } catch (e) {}
  }
}

class SettingsPage extends Component {
  constructor(props) {
    super(props);

    const config = props.config || {};
    const settings = props.settings || {};

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
      llamaStatus: null,
    };
  }

  async didMount() {
    // Subscribe to global state changes for real-time updates
    this.unsubscribers = [];
    this.unsubscribers.push(
      stateManager.subscribe("routerStatus", (rs) => {
        this.setState({ routerStatus: rs });
      })
    );
    this.unsubscribers.push(
      stateManager.subscribe("llamaStatus", (ls) => {
        this.setState({ llamaStatus: ls });
      })
    );
  }

  willDestroy() {
    // Cleanup subscriptions
    this.unsubscribers?.forEach((unsub) => unsub());
  }

  render() {
    const rs = this.state.routerStatus || {};
    const ls = this.state.llamaStatus || {};
    // Check both routerStatus and llamaStatus for running state
    const isRunning = rs.status === "running" || ls.status === "running";
    const loadedCount = rs.models?.filter((m) => m.state === "loaded").length || 0;
    // Use actual port from status or fall back to config port
    const displayPort = rs.port || ls.port || this.state.port;

    const result = Component.h(
      "div",
      { className: "settings-page" },
      Component.h("h1", {}, "Settings"),

      Component.h(
        "div",
        { className: "settings-section" },
        Component.h("h2", {}, "Llama Server (Router Mode)"),
        Component.h(
          "p",
          { className: "section-desc" },
          "Configure llama.cpp server in router mode"
        ),
        Component.h(
          "div",
          { className: `card router-card ${isRunning ? "running" : "idle"}` },
          Component.h(
            "div",
            { className: "router-header" },
            Component.h(
              "div",
              { className: "router-title" },
              Component.h("h3", {}, "Router Status"),
              Component.h(
                "span",
                { className: `status-badge ${isRunning ? "running" : "idle"}` },
                isRunning ? "RUNNING" : "STOPPED"
              )
            ),
            isRunning &&
              Component.h(
                "div",
                { className: "router-stats" },
                Component.h(
                  "div",
                  { className: "stat" },
                  Component.h("span", { className: "stat-label" }, "Port"),
                  Component.h("span", { className: "stat-value" }, displayPort)
                ),
                Component.h(
                  "div",
                  { className: "stat" },
                  Component.h("span", { className: "stat-label" }, "Loaded"),
                  Component.h("span", { className: "stat-value" }, String(loadedCount))
                )
              )
          ),
          Component.h(
            "div",
            { className: "router-controls" },
            isRunning
              ? Component.h(
                "button",
                { className: "btn btn-danger", "data-action": "stop" },
                "Stop Router"
              )
              : Component.h(
                "button",
                { className: "btn btn-primary", "data-action": "start" },
                "Start Router"
              ),
            Component.h(
              "button",
              { className: "btn btn-secondary", "data-action": "restart", disabled: !isRunning },
              "Restart"
            )
          ),
          Component.h("hr", { className: "divider" }),
          Component.h("h4", {}, "Configuration"),
          Component.h(
            "div",
            { className: "config-grid" },
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Max Models"),
              Component.h("input", {
                type: "number",
                value: this.state.maxModelsLoaded,
                min: 1,
                max: 16,
                id: "maxModelsLoaded",
                onChange: (e) => this.setState({ maxModelsLoaded: parseInt(e.target.value) || 1 }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Slots"),
              Component.h("input", {
                type: "number",
                value: this.state.parallelSlots,
                min: 1,
                max: 32,
                id: "parallelSlots",
                onChange: (e) => this.setState({ parallelSlots: parseInt(e.target.value) || 1 }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Context"),
              Component.h("input", {
                type: "number",
                value: this.state.ctx_size,
                min: 512,
                max: 131072,
                id: "ctx_size",
                onChange: (e) => this.setState({ ctx_size: parseInt(e.target.value) || 512 }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "GPU Layers"),
              Component.h("input", {
                type: "number",
                value: this.state.gpuLayers,
                min: 0,
                max: 999,
                id: "gpuLayers",
                onChange: (e) => this.setState({ gpuLayers: parseInt(e.target.value) || 0 }),
              })
            )
          )
        )
      ),

      Component.h(
        "div",
        { className: "settings-section" },
        Component.h("h2", {}, "Server Paths"),
        Component.h("p", { className: "section-desc" }, "Configure paths and connection"),
        Component.h(
          "div",
          { className: "card" },
          Component.h(
            "div",
            { className: "paths-grid" },
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Models Path"),
              Component.h("input", {
                type: "text",
                value: this.state.baseModelsPath,
                placeholder: "/path/to/models",
                id: "baseModelsPath",
                onChange: (e) => this.setState({ baseModelsPath: e.target.value }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Server Path"),
              Component.h("input", {
                type: "text",
                value: this.state.serverPath,
                id: "serverPath",
                onChange: (e) => this.setState({ serverPath: e.target.value }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Host"),
              Component.h("input", {
                type: "text",
                value: this.state.host,
                id: "host",
                onChange: (e) => this.setState({ host: e.target.value }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Port"),
              Component.h("input", {
                type: "number",
                value: this.state.port,
                min: 1,
                max: 65535,
                id: "port",
                onChange: (e) => this.setState({ port: parseInt(e.target.value) || 8080 }),
              })
            )
          )
        )
      ),

      Component.h(
        "div",
        { className: "settings-section" },
        Component.h("h2", {}, "Model Defaults"),
        Component.h("p", { className: "section-desc" }, "Default inference parameters"),
        Component.h(
          "div",
          { className: "card" },
          Component.h(
            "div",
            { className: "defaults-grid" },
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Threads"),
              Component.h("input", {
                type: "number",
                value: this.state.threads,
                min: 1,
                max: 64,
                id: "threads",
                onChange: (e) => this.setState({ threads: parseInt(e.target.value) || 1 }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Batch"),
              Component.h("input", {
                type: "number",
                value: this.state.batch_size,
                min: 1,
                max: 8192,
                id: "batch_size",
                onChange: (e) => this.setState({ batch_size: parseInt(e.target.value) || 1 }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Temperature"),
              Component.h("input", {
                type: "number",
                value: this.state.temperature,
                min: 0,
                max: 2,
                step: 0.1,
                id: "temperature",
                onChange: (e) => this.setState({ temperature: parseFloat(e.target.value) || 0 }),
              })
            ),
            Component.h(
              "div",
              { className: "form-group" },
              Component.h("label", {}, "Repeat Penalty"),
              Component.h("input", {
                type: "number",
                value: this.state.repeatPenalty,
                min: 0,
                max: 2,
                step: 0.1,
                id: "repeatPenalty",
                onChange: (e) => this.setState({ repeatPenalty: parseFloat(e.target.value) || 0 }),
              })
            )
          )
        )
      ),

      Component.h(
        "div",
        { className: "settings-section" },
        Component.h(
          "div",
          { className: "card actions-card" },
          Component.h("h3", {}, "Save Configuration"),
          Component.h("p", { className: "info" }, "Settings apply on router restart"),
          Component.h(
            "div",
            { className: "action-buttons" },
            Component.h(
              "button",
              { className: "btn btn-primary btn-lg", "data-action": "save" },
              "Save All Settings"
            )
          )
        )
      ),

      Component.h(
        "div",
        { className: "settings-section" },
        Component.h(
          "div",
          { className: "card about-card" },
          Component.h("h3", {}, "Llama Async Proxy Dashboard"),
          Component.h("p", {}, "Version 1.2")
        )
      )
    );

    return result;
  }

  async _save() {
    const btn = this._el.querySelector("[data-action=\"save\"]");
    btn.textContent = "Saving...";
    btn.disabled = true;

    try {
      if (!stateManager.connected) {
        throw new Error("Not connected to server");
      }

      const config = {
        serverPath: this.state.serverPath,
        host: this.state.host,
        port: this.state.port,
        baseModelsPath: this.state.baseModelsPath,
        ctx_size: this.state.ctx_size,
        threads: this.state.threads,
        batch_size: this.state.batch_size,
        temperature: this.state.temperature,
        repeatPenalty: this.state.repeatPenalty,
      };

      const settings = {
        maxModelsLoaded: this.state.maxModelsLoaded,
        parallelSlots: this.state.parallelSlots,
        gpuLayers: this.state.gpuLayers,
      };

      await stateManager.updateConfig(config);
      await stateManager.updateSettings(settings);

      stateManager.set("config", config);
      stateManager.set("settings", settings);

      showNotification("Settings saved successfully", "success");
    } catch (e) {
      showNotification(`Save failed: ${e.message}`, "error");
    } finally {
      btn.textContent = "Save All Settings";
      btn.disabled = false;
    }
  }

  async _startLlama() {
    try {
      await stateManager.startLlama();
      showNotification("Llama router started", "success");
      setTimeout(() => this._refreshStatus(), 2000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }

  async _stopLlama() {
    if (!confirm("Stop router?")) return;
    try {
      await stateManager.stopLlama();
      showNotification("Router stopped", "success");
      stateManager.set("routerStatus", null);
      this.setState({ routerStatus: null });
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }

  async _restartLlama() {
    try {
      await stateManager.restartLlama();
      showNotification("Restarting...", "info");
      setTimeout(() => this._refreshStatus(), 3000);
    } catch (e) {
      showNotification(`Failed: ${e.message}`, "error");
    }
  }

  async _refreshStatus() {
    try {
      const rs = await stateManager.getRouterStatus();
      stateManager.set("routerStatus", rs.routerStatus);
      this.setState({ routerStatus: rs.routerStatus });
    } catch (e) {}
  }

  getEventMap() {
    return {
      "click [data-action=start]": "handleStart",
      "click [data-action=stop]": "handleStop",
      "click [data-action=restart]": "handleRestart",
      "click [data-action=save]": "handleSave",
    };
  }

  handleStart(event) {
    event.preventDefault();
    this._startLlama();
  }

  handleStop(event) {
    event.preventDefault();
    this._stopLlama();
  }

  handleRestart(event) {
    event.preventDefault();
    this._restartLlama();
  }

  handleSave(event) {
    event.preventDefault();
    this._save();
  }
}

window.SettingsController = SettingsController;
window.SettingsPage = SettingsPage;
