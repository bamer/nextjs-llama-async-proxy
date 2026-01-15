/**
 * Logging Configuration Component - Event-Driven DOM Updates
 */

class LoggingConfig extends Component {
  constructor(props) {
    super(props);

    // Direct properties instead of state - store in MB
    this.maxFileSizeMB = Math.round((props.maxFileSize || 10485760) / 1024 / 1024);
    this.maxFiles = props.maxFiles || 7;
    this.logLevel = props.logLevel || "info";
    this.enableFileLogging = props.enableFileLogging !== false;
    this.enableDatabaseLogging = props.enableDatabaseLogging !== false;
    this.enableConsoleLogging = props.enableConsoleLogging !== false;
  }

  bindEvents() {
    // Log level
    this.on("change", "[data-field=log-level]", (e) => {
      const val = e.target.value || "info";
      console.log("[DEBUG] LoggingConfig.onLogLevelChange:", {
        value: e.target.value,
        normalized: val,
      });
      this.logLevel = val;
      this._updateUI();
      this.props.onLogLevelChange?.(val);
    });

    // Max file size (in MB)
    this.on("change", "[data-field=max-file-size]", (e) => {
      const val = parseInt(e.target.value) || 10;
      this.maxFileSizeMB = val;
      this._updateUI();
      // Convert MB to bytes for the callback
      this.props.onMaxFileSizeChange?.(val * 1024 * 1024);
    });

    // Max files
    this.on("change", "[data-field=max-files]", (e) => {
      const val = parseInt(e.target.value) || 7;
      this.maxFiles = val;
      this._updateUI();
      this.props.onMaxFilesChange?.(val);
    });

    // Enable file logging
    this.on("change", "[data-field=enable-file-logging]", (e) => {
      this.enableFileLogging = e.target.checked;
      this._updateUI();
      this.props.onEnableFileLoggingChange?.(this.enableFileLogging);
    });

    // Enable database logging
    this.on("change", "[data-field=enable-database-logging]", (e) => {
      this.enableDatabaseLogging = e.target.checked;
      this._updateUI();
      this.props.onEnableDatabaseLoggingChange?.(this.enableDatabaseLogging);
    });

    // Enable console logging
    this.on("change", "[data-field=enable-console-logging]", (e) => {
      this.enableConsoleLogging = e.target.checked;
      this._updateUI();
      this.props.onEnableConsoleLoggingChange?.(this.enableConsoleLogging);
    });
  }

  /**
   * Update the UI elements to match current component state.
   * @returns {void}
   */
  _updateUI() {
    if (!this._el) return;

    // Update log level select
    const logLevelSelect = this._el.querySelector("[data-field=log-level]");
    if (logLevelSelect && logLevelSelect.value !== this.logLevel) {
      logLevelSelect.value = this.logLevel;
    }

    // Update max file size input (in MB)
    const maxFileSizeInput = this._el.querySelector("[data-field=max-file-size]");
    if (maxFileSizeInput && parseInt(maxFileSizeInput.value) !== this.maxFileSizeMB) {
      maxFileSizeInput.value = this.maxFileSizeMB;
    }

    // Update max files input
    const maxFilesInput = this._el.querySelector("[data-field=max-files]");
    if (maxFilesInput && parseInt(maxFilesInput.value) !== this.maxFiles) {
      maxFilesInput.value = this.maxFiles;
    }

    // Update checkboxes
    const fileLoggingCheckbox = this._el.querySelector("[data-field=enable-file-logging]");
    if (fileLoggingCheckbox && fileLoggingCheckbox.checked !== this.enableFileLogging) {
      fileLoggingCheckbox.checked = this.enableFileLogging;
    }

    const dbLoggingCheckbox = this._el.querySelector("[data-field=enable-database-logging]");
    if (dbLoggingCheckbox && dbLoggingCheckbox.checked !== this.enableDatabaseLogging) {
      dbLoggingCheckbox.checked = this.enableDatabaseLogging;
    }

    const consoleLoggingCheckbox = this._el.querySelector("[data-field=enable-console-logging]");
    if (consoleLoggingCheckbox && consoleLoggingCheckbox.checked !== this.enableConsoleLogging) {
      consoleLoggingCheckbox.checked = this.enableConsoleLogging;
    }
  }

  render() {
    return Component.h("div", { className: "settings-section" }, [
      Component.h("h2", {}, "Logging Configuration"),
      Component.h("p", { className: "section-desc" }, "Configure log collection and retention"),
      Component.h("div", { className: "card" }, [
        Component.h("div", { className: "logging-grid" }, [
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Log Level"),
            Component.h("select", { "data-field": "log-level", value: this.logLevel }, [
              Component.h("option", { value: "debug" }, "Debug"),
              Component.h("option", { value: "info" }, "Info"),
              Component.h("option", { value: "warn" }, "Warning"),
              Component.h("option", { value: "error" }, "Error"),
            ]),
            Component.h("small", {}, "Most to least verbose"),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Max File Size (MB)"),
            Component.h("input", {
              type: "number",
              "data-field": "max-file-size",
              value: this.maxFileSizeMB,
              min: "1",
              max: "1000",
              step: "1",
            }),
            Component.h("small", {}, "Per log file"),
          ]),
          Component.h("div", { className: "form-group" }, [
            Component.h("label", {}, "Max Log Files"),
            Component.h("input", {
              type: "number",
              "data-field": "max-files",
              value: this.maxFiles,
              min: "1",
              max: "30",
            }),
            Component.h("small", {}, "Number of days to retain"),
          ]),
        ]),
      ]),
      Component.h("div", { className: "card" }, [
        Component.h("h3", {}, "Logging Targets"),
        Component.h("div", { className: "checkbox-group" }, [
          Component.h("label", { className: "checkbox-label" }, [
            Component.h("input", {
              type: "checkbox",
              "data-field": "enable-file-logging",
              checked: this.enableFileLogging,
            }),
            Component.h("span", {}, "File Logging"),
            Component.h("small", {}, "Write to logs/app-YYYYMMDD.log"),
          ]),
          Component.h("label", { className: "checkbox-label" }, [
            Component.h("input", {
              type: "checkbox",
              "data-field": "enable-database-logging",
              checked: this.enableDatabaseLogging,
            }),
            Component.h("span", {}, "Database Logging"),
            Component.h("small", {}, "Store in SQLite for quick access"),
          ]),
          Component.h("label", { className: "checkbox-label" }, [
            Component.h("input", {
              type: "checkbox",
              "data-field": "enable-console-logging",
              checked: this.enableConsoleLogging,
            }),
            Component.h("span", {}, "Console Logging"),
            Component.h("small", {}, "Output to server stdout"),
          ]),
        ]),
      ]),
    ]);
  }
}

window.LoggingConfig = LoggingConfig;
