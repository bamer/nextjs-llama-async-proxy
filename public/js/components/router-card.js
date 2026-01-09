/**
 * Unified Router Card Component
 * Used in both Dashboard and Settings with real-time state reflection
 */

class RouterCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: props.status || null,
      routerStatus: props.routerStatus || null,
      models: props.models || [],
      configPort: props.configPort || 8080,
      onAction: props.onAction || (() => {}),
      // Loading states
      routerLoading: false,
      // Preset states
      presets: props.presets || [],
      selectedPreset: null,
      maxModelsLoaded: props.maxModelsLoaded || 4,
      ctxSize: props.ctxSize || 4096,
    };
  }

  getEventMap() {
    return {
      "click [data-action=start]": "handleStart",
      "click [data-action=stop]": "handleStop",
      "click [data-action=restart]": "handleRestart",
      "click [data-action=launch-preset]": "handleLaunchPreset",
      "change #preset-select": "handlePresetChange",
    };
  }

  handleStart(event) {
    event.preventDefault();
    event.stopPropagation();
    this.state.routerLoading = true;
    this._updateUI();
    this.state.onAction("start");
  }

  handleStop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.state.routerLoading = true;
    this._updateUI();
    this.state.onAction("stop");
  }

  handleRestart(event) {
    event.preventDefault();
    event.stopPropagation();
    this.state.routerLoading = true;
    this._updateUI();
    this.state.onAction("restart");
  }

  handlePresetChange(event) {
    this.state.selectedPreset = event.target.value;
  }

  async handleLaunchPreset(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.state.selectedPreset) {
      showNotification("Please select a preset", "warning");
      return;
    }

    this.state.routerLoading = true;
    this._updateUI();
    showNotification("Starting llama-server with preset...", "info");

    try {
      const response = await stateManager.request("llama:start-with-preset", {
        presetName: this.state.selectedPreset,
        maxModels: this.state.maxModelsLoaded,
        ctxSize: this.state.ctxSize,
        threads: 4,
      });

      if (response?.success) {
        showNotification(
          `✓ Server started on port ${response.data.port}`,
          "success"
        );
        this.state.selectedPreset = null;
      } else {
        showNotification(
          `Error: ${response?.error?.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("[ROUTER-CARD] Launch preset error:", error);
      showNotification("Failed to start server", "error");
    } finally {
      this.state.routerLoading = false;
      this._updateUI();
    }
  }

  didMount() {
    // Subscribe to status changes and update UI without full re-render
    if (this.props.subscribeToUpdates) {
      this.props.subscribeToUpdates((status) => {
        this.state.status = status;
        this.state.routerLoading = false;
        this._updateUI();
      });
    }
  }

  _updateUI() {
    if (!this._el) return;

    const isRunning = this.state.status?.port;
    const routerLoading = this.state.routerLoading;
    const loadedCount = (this.state.routerStatus?.models || []).filter(
      (x) => x.state === "loaded"
    ).length;

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
      modelsText.textContent = `Models: ${loadedCount}/${this.state.models.length} loaded`;
    }

    // Update buttons
    const startStopBtn = this._el.querySelector('[data-action="start"], [data-action="stop"]');
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
    const restartBtn = this._el.querySelector('[data-action="restart"]');
    if (restartBtn) {
      restartBtn.disabled = !isRunning || routerLoading;
      restartBtn.textContent = routerLoading ? "🔄 Restarting..." : "🔄 Restart";
    }
  }

  render() {
    const isRunning = this.state.status?.port;
    const displayPort = this.state.status?.port || this.state.configPort || 8080;
    const routerModels = this.state.routerStatus?.models || [];
    const loadedCount = routerModels.filter((x) => x.state === "loaded").length;

    return Component.h(
      "div",
      { className: "router-section" },
      Component.h(
        "div",
        { className: `router-card ${isRunning ? "running" : "idle"}` },
        Component.h(
          "div",
          { className: "router-header" },
          Component.h(
            "div",
            { className: "router-title" },
            Component.h("h3", {}, "🦙 Llama Router"),
            Component.h(
              "span",
              { className: `status-badge ${isRunning ? "running" : "idle"}` },
              isRunning ? "RUNNING" : "STOPPED"
            )
          ),
          isRunning &&
            Component.h(
              "div",
              { className: "router-info" },
              Component.h("span", { className: "info-item" }, `Port: ${displayPort}`),
              Component.h(
                "span",
                { className: "info-item models-info" },
                `Models: ${loadedCount}/${this.state.models.length} loaded`
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
                "⏹ Stop Router"
              )
            : Component.h(
                "button",
                { className: "btn btn-primary", "data-action": "start" },
                "▶ Start Router"
              ),
          Component.h(
            "button",
            { className: "btn btn-secondary", "data-action": "restart", disabled: !isRunning },
            "🔄 Restart"
          )
        )
      ),
      // Launch with Preset Section
      this.state.presets && this.state.presets.length > 0 &&
        Component.h(
          "div",
          { className: "preset-launcher-card card" },
          Component.h("h3", {}, "Launch with Preset"),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Select Preset"),
            Component.h(
              "select",
              {
                id: "preset-select",
                value: this.state.selectedPreset || "",
              },
              Component.h("option", { value: "" }, "-- Choose a preset --"),
              ...this.state.presets.map((preset) =>
                Component.h("option", { value: preset.name }, preset.name)
              )
            ),
            Component.h(
              "small",
              {},
              "Presets are created and configured in the Presets page"
            )
          ),
          Component.h(
            "button",
            {
              className: "btn btn-primary",
              "data-action": "launch-preset",
              disabled: this.state.routerLoading,
            },
            this.state.routerLoading ? "🚀 Starting..." : "🚀 Launch Server with Preset"
          )
        )
    );
  }
}

window.RouterCard = RouterCard;
