class RouterCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: props.status || null,
      routerStatus: props.routerStatus || null,
      models: props.models || [],
      configPort: props.configPort || 8080,
      onAction: props.onAction || (() => {}),
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
    this.state.onAction("start");
  }

  handleStop(event) {
    event.preventDefault();
    this.state.onAction("stop");
  }

  handleRestart(event) {
    event.preventDefault();
    this.state.onAction("restart");
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
                { className: "info-item" },
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
