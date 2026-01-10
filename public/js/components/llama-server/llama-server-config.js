/**
 * llama-server Configuration Component
 */

class LlamaServerConfig extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      enabled,
      port,
      host,
      metricsEnabled,
      onEnabledChange,
      onPortChange,
      onHostChange,
      onMetricsEnabledChange,
    } = this.props;

    return Component.h(
      "section",
      { className: "settings-section" },
      Component.h("h2", {}, "llama-server Settings"),
      Component.h(
        "div",
        { className: "form-group" },
        Component.h("label", { for: "llamaServerEnabled" }, "Enable llama-server"),
        Component.h("input", {
          type: "checkbox",
          id: "llamaServerEnabled",
          checked: enabled,
          onChange: (e) => onEnabledChange(e.target.checked),
        })
      ),
      Component.h(
        "div",
        { className: "form-group" },
        Component.h("label", { for: "llamaServerPort" }, "Port"),
        Component.h("input", {
          type: "number",
          id: "llamaServerPort",
          value: port,
          onChange: (e) => onPortChange(parseInt(e.target.value)),
        })
      ),
      Component.h(
        "div",
        { className: "form-group" },
        Component.h("label", { for: "llamaServerHost" }, "Host"),
        Component.h("input", {
          type: "text",
          id: "llamaServerHost",
          value: host,
          onChange: (e) => onHostChange(e.target.value),
        })
      ),
      Component.h(
        "div",
        { className: "form-group" },
        Component.h("label", { for: "llamaServerMetrics" }, "Enable Metrics"),
        Component.h("input", {
          type: "checkbox",
          id: "llamaServerMetrics",
          checked: metricsEnabled,
          onChange: (e) => onMetricsEnabledChange(e.target.checked),
        })
      )
    );
  }
}

window.LlamaServerConfig = LlamaServerConfig;
