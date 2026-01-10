/**
 * RouterCard Component - Event-Driven DOM Updates
 */

class RouterCard extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.status = props.status || null;
    this.routerStatus = props.routerStatus || null;
    this.models = props.models || [];
    this.configPort = props.configPort || 8080;
    this.onAction = props.onAction || (() => {});
    this.presets = props.presets || [];
    this.selectedPreset = null;
    this.routerLoading = false;
    this.maxModelsLoaded = props.maxModelsLoaded || 4;
    this.ctxSize = props.ctxSize || 4096;
  }

  bindEvents() {
    // Start button
    this.on("click", "[data-action=start]", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();
      this.onAction("start");
    });

    // Stop button
    this.on("click", "[data-action=stop]", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();
      this.onAction("stop");
    });

    // Restart button
    this.on("click", "[data-action=restart]", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();
      this.onAction("restart");
    });

    // Preset change
    this.on("change", "#preset-select", (e) => {
      this.selectedPreset = e.target.value;
    });

    // Launch preset button
    this.on("click", "[data-action=launch-preset]", (e) => {
      this.handleLaunchPreset(e);
    });
  }

  onMount() {
    // Subscribe to status changes and update UI without full re-render
    if (this.props.subscribeToUpdates) {
      this.props.subscribeToUpdates((status) => {
        this.status = status;
        this.routerLoading = false;
        this._updateUI();
      });
    }
  }

  handleLaunchPreset(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.selectedPreset) {
      showNotification("Please select a preset", "warning");
      return;
    }

    this.routerLoading = true;
    this._updateUI();
    showNotification("Starting llama-server with preset...", "info");

    stateManager
      .request("llama:start-with-preset", {
        presetName: this.selectedPreset,
        maxModels: this.maxModelsLoaded,
        ctxSize: this.ctxSize,
        threads: 4,
      })
      .then((response) => {
        if (response?.success) {
          showNotification(`Server started on port ${response.data.port}`, "success");
          this.selectedPreset = null;
        } else {
          showNotification(`Error: ${response?.error?.message || "Unknown error"}`, "error");
        }
      })
      .catch((error) => {
        console.error("[ROUTER-CARD] Launch preset error:", error);
        showNotification("Failed to start server", "error");
      })
      .finally(() => {
        this.routerLoading = false;
        this._updateUI();
      });
  }

  _updateUI() {
    if (!this._el) return;

    const isRunning = this.status?.port;
    const routerLoading = this.routerLoading;
    const loadedCount = (this.routerStatus?.models || []).filter((x) => x.state === "loaded").length;

    // Update status badge
    const statusBadge = this._el.querySelector(".status-badge");
    if (statusBadge) {
      if (routerLoading) {
        statusBadge.textContent = isRunning ? "STOPPING..." : "STARTING...";
        statusBadge.className = "status-badge loading";
      } else {
        statusBadge.textContent = isRunning ? "RUNNING" : "STOPPED";
        statusBadge.className = `status-badge ${isRunning ? "running" : "idle"}`;
      }
    }

    // Update router info
    const routerInfo = this._el.querySelector(".router-info");
    if (routerInfo) {
      routerInfo.style.display = isRunning ? "flex" : "none";
    }

    // Update loaded count text if present
    const modelsText = this._el.querySelector(".router-info .models-info");
    if (modelsText && isRunning) {
      modelsText.textContent = `Models: ${loadedCount}/${this.models.length} loaded`;
    }

    // Update buttons
    const startStopBtn = this._el.querySelector("[data-action=\"start\"], [data-action=\"stop\"]");
    if (startStopBtn) {
      if (isRunning) {
        startStopBtn.setAttribute("data-action", "stop");
        startStopBtn.className = "btn btn-danger";
        startStopBtn.textContent = routerLoading ? "⏹ Stopping..." : "⏹ Stop Router";
      } else {
        startStopBtn.setAttribute("data-action", "start");
        startStopBtn.className = "btn btn-primary";
        startStopBtn.textContent = routerLoading ? "▶ Starting..." : "▶ Start Router";
      }
      startStopBtn.disabled = routerLoading;
    }

    // Update restart button
    const restartBtn = this._el.querySelector("[data-action=\"restart\"]");
    if (restartBtn) {
      restartBtn.disabled = !isRunning || routerLoading;
      restartBtn.textContent = routerLoading ? "🔄 Restarting..." : "🔄 Restart";
    }

    // Update launch preset button
    const launchPresetBtn = this._el.querySelector("[data-action=\"launch-preset\"]");
    if (launchPresetBtn) {
      launchPresetBtn.disabled = this.routerLoading;
      launchPresetBtn.textContent = this.routerLoading ? "🚀 Starting..." : "🚀 Launch Server with Preset";
    }
  }

  render() {
    const isRunning = this.status?.port;
    const displayPort = this.status?.port || this.configPort || 8080;
    const routerModels = this.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

    return Component.h("div", { className: "router-section" }, [
      Component.h("div", { className: `router-card ${isRunning ? "running" : "idle"}` }, [
        Component.h("div", { className: "router-header" }, [
          Component.h("div", { className: "router-title" }, [
            Component.h("h3", {}, "🦙 Llama Router"),
            Component.h("span", { className: `status-badge ${isRunning ? "running" : "idle"}` }, isRunning ? "RUNNING" : "STOPPED"),
          ]),
          isRunning && Component.h("div", { className: "router-info" }, [
            Component.h("span", { className: "info-item" }, `Port: ${displayPort}`),
            Component.h("span", { className: "info-item models-info" }, `Models: ${loadedCount}/${this.models.length} loaded`),
          ]),
        ]),
        Component.h("div", { className: "router-controls" }, [
          isRunning
            ? Component.h("button", { className: "btn btn-danger", "data-action": "stop" }, "⏹ Stop Router")
            : Component.h("button", { className: "btn btn-primary", "data-action": "start" }, "▶ Start Router"),
          Component.h("button", { className: "btn btn-secondary", "data-action": "restart", disabled: !isRunning }, "🔄 Restart"),
        ]),
      ]),
      // Launch with Preset Section
      this.presets && this.presets.length > 0 && Component.h("div", { className: "preset-launcher-card card" }, [
        Component.h("h3", {}, "Launch with Preset"),
        Component.h("div", { className: "form-group" }, [
          Component.h("label", {}, "Select Preset"),
          Component.h("select", { id: "preset-select", value: this.selectedPreset || "" }, [
            Component.h("option", { value: "" }, "-- Choose a preset --"),
            ...this.presets.map((preset) =>
              Component.h("option", { value: preset.name }, preset.name)
            ),
          ]),
          Component.h("small", {}, "Presets are created and configured in the Presets page"),
        ]),
        Component.h("button", {
          className: "btn btn-primary",
          "data-action": "launch-preset",
          disabled: this.routerLoading,
        }, this.routerLoading ? "🚀 Starting..." : "🚀 Launch Server with Preset"),
      ]),
    ]);
  }
}

window.RouterCard = RouterCard;
