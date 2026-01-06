class ServerPathsForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      baseModelsPath: props.baseModelsPath || "",
      serverPath: props.serverPath || "",
      host: props.host || "localhost",
      port: props.port || 8080,
    };
  }

  componentWillReceiveProps(newProps) {
    this.state = {
      baseModelsPath: newProps.baseModelsPath || "",
      serverPath: newProps.serverPath || "",
      host: newProps.host || "localhost",
      port: newProps.port || 8080,
    };
  }

  render() {
    return Component.h(
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
              onChange: (e) => {
                this.setState({ baseModelsPath: e.target.value });
                this.props.onBaseModelsPathChange?.(e.target.value);
              },
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
              onChange: (e) => {
                this.setState({ serverPath: e.target.value });
                this.props.onServerPathChange?.(e.target.value);
              },
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
              onChange: (e) => {
                this.setState({ host: e.target.value });
                this.props.onHostChange?.(e.target.value);
              },
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
              onChange: (e) => {
                const val = parseInt(e.target.value) || 8080;
                this.setState({ port: val });
                this.props.onPortChange?.(val);
              },
            })
          )
        )
      )
    );
  }
}

window.ServerPathsForm = ServerPathsForm;
