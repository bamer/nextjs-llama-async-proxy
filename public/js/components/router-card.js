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
    };
  }

  getEventMap() {
    return {
      "click [data-action=start]": "handleStart",
      "click [data-action=stop]": "handleStop",
      "click [data-action=restart]": "handleRestart",
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
    const startStopBtn = this._el.querySelector(
      "[data-action=\"start\"], [data-action=\"stop\"]"
    );
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
      )
    );
  }
}

window.RouterCard = RouterCard;
