/**
 * Router Card Component
 */

class SettingsRouterCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      routerStatus: props.routerStatus || null,
      llamaStatus: props.llamaStatus || null,
      maxModelsLoaded: props.maxModelsLoaded || 4,
      parallelSlots: props.parallelSlots || 1,
      ctx_size: props.ctx_size || 4096,
      gpuLayers: props.gpuLayers || 0,
      port: props.port || 8080,
      isRunning: props.isRunning || false,
      loadedCount: props.loadedCount || 0,
      displayPort: props.displayPort || 8080,
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
    this.props.onStart?.();
  }

  handleStop(event) {
    event.preventDefault();
    this.props.onStop?.();
  }

  handleRestart(event) {
    event.preventDefault();
    this.props.onRestart?.();
  }

  render() {
    const { isRunning, displayPort, loadedCount } = this.state;

    return Component.h(
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
      )
    );
  }
}

window.SettingsRouterCard = SettingsRouterCard;
