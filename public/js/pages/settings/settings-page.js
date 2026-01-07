/**
 * Settings Page Component
 * Composes RouterCard, ServerPathsForm, ModelDefaultsForm, and SaveSection
 */

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
      routerStatus: props.routerStatus || null,
      llamaStatus: props.llamaStatus || null,
    };
  }

  async didMount() {
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
    this.unsubscribers?.forEach((unsub) => unsub());
  }

  async _save() {
    const btn = this._el?.querySelector("[data-action=\"save\"]");
    if (btn) {
      btn.textContent = "Saving...";
      btn.disabled = true;
    }

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
      if (btn) {
        btn.textContent = "Save All Settings";
        btn.disabled = false;
      }
    }
  }

  async _refreshStatus() {
    try {
      const rs = await stateManager.getRouterStatus();
      stateManager.set("routerStatus", rs.routerStatus);
      this.setState({ routerStatus: rs.routerStatus });
    } catch (e) {
      // Ignore status refresh errors
    }
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
    stateManager.startLlama();
    showNotification("Starting router...", "info");
    setTimeout(() => this._refreshStatus(), 2000);
  }

  handleStop(event) {
    event.preventDefault();
    if (!confirm("Stop router?")) return;
    stateManager.stopLlama();
    showNotification("Router stopped", "success");
    stateManager.set("routerStatus", null);
    this.setState({ routerStatus: null });
  }

  handleRestart(event) {
    event.preventDefault();
    stateManager.restartLlama();
    showNotification("Restarting...", "info");
    setTimeout(() => this._refreshStatus(), 3000);
  }

  handleSave(event) {
    event.preventDefault();
    this._save();
  }

  render() {
    const rs = this.state.routerStatus || {};
    const ls = this.state.llamaStatus || {};
    const isRunning = rs.status === "running" || ls.status === "running";
    const displayPort = rs.port || ls.port || this.state.port;

    return Component.h(
      "div",
      { className: "settings-page" },
      Component.h("h1", {}, "Settings"),
      Component.h(window.SettingsRouterCard, {
        routerStatus: this.state.routerStatus,
        llamaStatus: this.state.llamaStatus,
        maxModelsLoaded: this.state.maxModelsLoaded,
        parallelSlots: this.state.parallelSlots,
        ctx_size: this.state.ctx_size,
        gpuLayers: this.state.gpuLayers,
        port: displayPort,
        isRunning,
        loadedCount: rs.models?.filter((m) => m.state === "loaded").length || 0,
        onStart: () => this.handleStart({ preventDefault: () => {} }),
        onStop: () => this.handleStop({ preventDefault: () => {} }),
        onRestart: () => this.handleRestart({ preventDefault: () => {} }),
      }),
      Component.h(window.ServerPathsForm, {
        baseModelsPath: this.state.baseModelsPath,
        serverPath: this.state.serverPath,
        host: this.state.host,
        port: this.state.port,
        onBaseModelsPathChange: (val) => this.setState({ baseModelsPath: val }),
        onServerPathChange: (val) => this.setState({ serverPath: val }),
        onHostChange: (val) => this.setState({ host: val }),
        onPortChange: (val) => this.setState({ port: val }),
      }),
      Component.h(window.ModelDefaultsForm, {
        threads: this.state.threads,
        batch_size: this.state.batch_size,
        temperature: this.state.temperature,
        repeatPenalty: this.state.repeatPenalty,
        onThreadsChange: (val) => this.setState({ threads: val }),
        onBatchSizeChange: (val) => this.setState({ batch_size: val }),
        onTemperatureChange: (val) => this.setState({ temperature: val }),
        onRepeatPenaltyChange: (val) => this.setState({ repeatPenalty: val }),
      }),
      Component.h(window.SaveSection)
    );
  }
}

window.SettingsPage = SettingsPage;
