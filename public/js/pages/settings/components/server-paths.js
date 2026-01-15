/**
 * Server Paths Form Component - Event-Driven DOM Updates
 */

class ServerPathsForm extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state
    this.baseModelsPath = props.baseModelsPath || "";
    this.serverPath = props.serverPath || "";
    this.host = props.host || "localhost";
    this.port = props.port || 8080;
    this.autoStartOnLaunch = props.autoStartOnLaunch !== false;
    this.metricsEnabled = props.metricsEnabled !== false;
  }

  bindEvents() {
    // Base models path
    this.on("change", "#baseModelsPath", (e) => {
      this.baseModelsPath = e.target.value;
      this._updateUI();
      this.props.onBaseModelsPathChange?.(e.target.value);
    });

    // Server path
    this.on("change", "#serverPath", (e) => {
      this.serverPath = e.target.value;
      this._updateUI();
      this.props.onServerPathChange?.(e.target.value);
    });

    // Host
    this.on("change", "#host", (e) => {
      this.host = e.target.value;
      this._updateUI();
      this.props.onHostChange?.(e.target.value);
    });

    // Port
    this.on("change", "#port", (e) => {
      const val = parseInt(e.target.value) || 8080;
      this.port = val;
      this._updateUI();
      this.props.onPortChange?.(val);
    });

    // Auto-start on launch
    this.on("change", "#autoStartOnLaunch", (e) => {
      this.autoStartOnLaunch = e.target.checked;
      this.props.onAutoStartOnLaunchChange?.(e.target.checked);
    });

    // Metrics Enabled
    this.on("change", "#metricsEnabled", (e) => {
      this.metricsEnabled = e.target.checked;
      this.props.onMetricsEnabledChange?.(e.target.checked);
    });
  }

  /**
   * Update the UI elements to match current component state.
   * @returns {void}
   */
  _updateUI() {
    if (!this._el) return;

    const baseModelsInput = this._el.querySelector("#baseModelsPath");
    if (baseModelsInput && baseModelsInput.value !== this.baseModelsPath) {
      baseModelsInput.value = this.baseModelsPath;
    }

    const serverPathInput = this._el.querySelector("#serverPath");
    if (serverPathInput && serverPathInput.value !== this.serverPath) {
      serverPathInput.value = this.serverPath;
    }

    const hostInput = this._el.querySelector("#host");
    if (hostInput && hostInput.value !== this.host) {
      hostInput.value = this.host;
    }

    const portInput = this._el.querySelector("#port");
    if (portInput && parseInt(portInput.value) !== this.port) {
      portInput.value = this.port;
    }
  }

  render() {
    return Component.h("div", { className: "settings-section" }, [
      Component.h("h2", {}, "Server Paths"),
      Component.h("p", { className: "section-desc" }, "Configure paths and connection"),
      Component.h("div", { className: "card" }, [
        Component.h("div", { className: "form-group checkbox-group" }, [
          Component.h("label", { className: "checkbox-label" }, [
            Component.h("input", {
              type: "checkbox",
              id: "autoStartOnLaunch",
              checked: this.autoStartOnLaunch,
            }),
            Component.h("span", { className: "checkbox-text" }, "Auto-start llama-server on dashboard launch"),
          ]),
        ]),
        Component.h("div", { className: "paths-grid" }, [
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Models Path"),
            Component.h("input", {
              type: "text",
              value: this.baseModelsPath,
              placeholder: "/path/to/models",
              id: "baseModelsPath",
            }),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Server Path"),
            Component.h("input", {
              type: "text",
              value: this.serverPath,
              id: "serverPath",
            }),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Host"),
            Component.h("input", {
              type: "text",
              value: this.host,
              id: "host",
            }),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Port"),
            Component.h("input", {
              type: "number",
              value: this.port,
              min: 1,
              max: 65535,
              id: "port",
            }),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Enable Metrics"),
            Component.h("input", {
              type: "checkbox",
              id: "metricsEnabled",
              checked: this.metricsEnabled,
            }),
          ]),
        ]),
      ]),
    ]);
  }
}

window.ServerPathsForm = ServerPathsForm;
