/**
 * Unified Router Card Component - Event-Driven DOM Updates
 * Used in both Dashboard and Settings with real-time state reflection
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
    this.routerLoading = false;
    this.presets = props.presets || [];
    this.selectedPreset = null;
    this.maxModelsLoaded = props.maxModelsLoaded || 4;
    this.ctxSize = props.ctxSize || 4096;
  }

  bindEvents() {
    console.log("[DEBUG] RouterCard.bindEvents called");

    // Start button
    this.on("click", "[data-action=start]", (e) => {
      console.log("[DEBUG] RouterCard START button clicked, preset:", this.selectedPreset);
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();

      // If preset selected, use start-with-preset action
      if (this.selectedPreset) {
        console.log("[DEBUG] RouterCard calling onAction('start-with-preset', preset)");
        this.onAction("start-with-preset", this.selectedPreset);
      } else {
        console.log("[DEBUG] RouterCard calling onAction('start')");
        this.onAction("start");
      }
    });

    // Stop button
    this.on("click", "[data-action=stop]", (e) => {
      console.log("[DEBUG] RouterCard STOP button clicked");
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();
      this.onAction("stop");
    });

    // Restart button
    this.on("click", "[data-action=restart]", (e) => {
      console.log("[DEBUG] RouterCard RESTART button clicked");
      e.preventDefault();
      e.stopPropagation();
      this.routerLoading = true;
      this._updateUI();
      this.onAction("restart");
    });

    // Preset change
    this.on("change", "#preset-select", (e) => {
      this.selectedPreset = e.target.value;
      this._updateUI();
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
        const btnText = routerLoading
          ? "▶ Starting..."
          : this.selectedPreset
            ? "▶ Start with Preset"
            : "▶ Start Router";
        startStopBtn.textContent = btnText;
      }
      startStopBtn.disabled = routerLoading;
    }

    // Update restart button
    const restartBtn = this._el.querySelector("[data-action=\"restart\"]");
    if (restartBtn) {
      restartBtn.disabled = !isRunning || routerLoading;
      restartBtn.textContent = routerLoading ? "🔄 Restarting..." : "🔄 Restart";
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
          // Preset selection (if presets available)
          this.presets && this.presets.length > 0 && Component.h("div", { className: "preset-selector" }, [
            Component.h("select", {
              id: "preset-select",
              className: "preset-dropdown",
              value: this.selectedPreset || "",
            }, [
              Component.h("option", { value: "" }, "📋 Select Preset..."),
              ...this.presets.map((preset) =>
                Component.h("option", { value: preset.name }, preset.name)
              ),
            ]),
          ]),
          // Action buttons
          isRunning
            ? Component.h("button", { className: "btn btn-danger", "data-action": "stop" }, "⏹ Stop Router")
            : Component.h("button", { className: "btn btn-primary", "data-action": "start" }, this.routerLoading
              ? "▶ Starting..."
              : this.selectedPreset
                ? "▶ Start with Preset"
                : "▶ Start Router"),
          Component.h("button", { className: "btn btn-secondary", "data-action": "restart", disabled: !isRunning }, "🔄 Restart"),
        ]),
      ]),
    ]);
  }
}

window.RouterCard = RouterCard;
