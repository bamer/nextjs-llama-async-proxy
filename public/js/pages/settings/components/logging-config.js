/**
 * Logging Configuration Component
 * Allows users to configure logging parameters
 */

class LoggingConfig extends Component {
  constructor(props) {
    super(props);

    this.state = {
      maxFileSize: props.maxFileSize || 10485760,
      maxFiles: props.maxFiles || 7,
      logLevel: props.logLevel || "info",
      enableFileLogging: props.enableFileLogging !== false,
      enableDatabaseLogging: props.enableDatabaseLogging !== false,
      enableConsoleLogging: props.enableConsoleLogging !== false,
    };
  }

  componentWillReceiveProps(newProps) {
    // Only sync state if props actually changed (avoid overwriting user input)
    const newState = {};
    let hasChanges = false;

    if (newProps.maxFileSize !== undefined && newProps.maxFileSize !== this.state.maxFileSize) {
      newState.maxFileSize = newProps.maxFileSize;
      hasChanges = true;
    }
    if (newProps.maxFiles !== undefined && newProps.maxFiles !== this.state.maxFiles) {
      newState.maxFiles = newProps.maxFiles;
      hasChanges = true;
    }
    if (newProps.logLevel !== undefined && newProps.logLevel !== this.state.logLevel) {
      newState.logLevel = newProps.logLevel;
      hasChanges = true;
    }
    if (
      newProps.enableFileLogging !== undefined &&
      newProps.enableFileLogging !== this.state.enableFileLogging
    ) {
      newState.enableFileLogging = newProps.enableFileLogging;
      hasChanges = true;
    }
    if (
      newProps.enableDatabaseLogging !== undefined &&
      newProps.enableDatabaseLogging !== this.state.enableDatabaseLogging
    ) {
      newState.enableDatabaseLogging = newProps.enableDatabaseLogging;
      hasChanges = true;
    }
    if (
      newProps.enableConsoleLogging !== undefined &&
      newProps.enableConsoleLogging !== this.state.enableConsoleLogging
    ) {
      newState.enableConsoleLogging = newProps.enableConsoleLogging;
      hasChanges = true;
    }

    if (hasChanges) {
      this.setState(newState);
    }
  }

  getEventMap() {
    return {
      "change [data-field=log-level]": "onLogLevelChange",
      "change [data-field=max-file-size]": "onMaxFileSizeChange",
      "change [data-field=max-files]": "onMaxFilesChange",
      "change [data-field=enable-file-logging]": "onEnableFileLoggingChange",
      "change [data-field=enable-database-logging]": "onEnableDatabaseLoggingChange",
      "change [data-field=enable-console-logging]": "onEnableConsoleLoggingChange",
    };
  }

  onLogLevelChange(e) {
    const val = e.target.value || "info";
    console.log("[DEBUG] LoggingConfig.onLogLevelChange:", {
      value: e.target.value,
      normalized: val,
    });
    this.setState({ logLevel: val });
    if (this.props.onLogLevelChange) {
      console.log("[DEBUG] Calling parent callback with value:", val);
      this.props.onLogLevelChange(val);
    } else {
      console.warn("[DEBUG] No onLogLevelChange callback provided!");
    }
  }

  onMaxFileSizeChange(e) {
    const val = parseInt(e.target.value) || 10485760;
    this.setState({ maxFileSize: val });
    this.props.onMaxFileSizeChange?.(val);
  }

  onMaxFilesChange(e) {
    const val = parseInt(e.target.value) || 7;
    this.setState({ maxFiles: val });
    this.props.onMaxFilesChange?.(val);
  }

  onEnableFileLoggingChange(e) {
    const val = e.target.checked;
    this.setState({ enableFileLogging: val });
    this.props.onEnableFileLoggingChange?.(val);
  }

  onEnableDatabaseLoggingChange(e) {
    const val = e.target.checked;
    this.setState({ enableDatabaseLogging: val });
    this.props.onEnableDatabaseLoggingChange?.(val);
  }

  onEnableConsoleLoggingChange(e) {
    const val = e.target.checked;
    this.setState({ enableConsoleLogging: val });
    this.props.onEnableConsoleLoggingChange?.(val);
  }

  render() {
    const sizeInMB = (this.state.maxFileSize / 1024 / 1024).toFixed(1);

    return Component.h(
      "div",
      { className: "settings-section" },
      Component.h("h2", {}, "Logging Configuration"),
      Component.h("p", { className: "section-desc" }, "Configure log collection and retention"),
      Component.h(
        "div",
        { className: "card" },
        Component.h(
          "div",
          { className: "logging-grid" },
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Log Level"),
            Component.h(
              "select",
              {
                "data-field": "log-level",
                value: this.state.logLevel,
              },
              Component.h("option", { value: "debug" }, "Debug"),
              Component.h("option", { value: "info" }, "Info"),
              Component.h("option", { value: "warn" }, "Warning"),
              Component.h("option", { value: "error" }, "Error")
            ),
            Component.h("small", {}, "Most to least verbose")
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Max File Size"),
            Component.h("input", {
              type: "number",
              "data-field": "max-file-size",
              value: this.state.maxFileSize,
              min: "1048576",
              step: "1048576",
            }),
            Component.h("small", {}, `${sizeInMB} MB`)
          ),
          Component.h(
            "div",
            { className: "form-group" },
            Component.h("label", {}, "Max Log Files"),
            Component.h("input", {
              type: "number",
              "data-field": "max-files",
              value: this.state.maxFiles,
              min: "1",
              max: "30",
            }),
            Component.h("small", {}, "Number of days to retain")
          )
        )
      ),
      Component.h(
        "div",
        { className: "card" },
        Component.h("h3", {}, "Logging Targets"),
        Component.h(
          "div",
          { className: "checkbox-group" },
          Component.h(
            "label",
            { className: "checkbox-label" },
            Component.h("input", {
              type: "checkbox",
              "data-field": "enable-file-logging",
              checked: this.state.enableFileLogging,
            }),
            Component.h("span", {}, "File Logging"),
            Component.h("small", {}, "Write to logs/app-YYYYMMDD.log")
          ),
          Component.h(
            "label",
            { className: "checkbox-label" },
            Component.h("input", {
              type: "checkbox",
              "data-field": "enable-database-logging",
              checked: this.state.enableDatabaseLogging,
            }),
            Component.h("span", {}, "Database Logging"),
            Component.h("small", {}, "Store in SQLite for quick access")
          ),
          Component.h(
            "label",
            { className: "checkbox-label" },
            Component.h("input", {
              type: "checkbox",
              "data-field": "enable-console-logging",
              checked: this.state.enableConsoleLogging,
            }),
            Component.h("span", {}, "Console Logging"),
            Component.h("small", {}, "Output to server stdout")
          )
        )
      )
    );
  }
}

window.LoggingConfig = LoggingConfig;
