/**
 * Logging Configuration Component - Event-Driven DOM Updates
 * Styled consistently with dashboard and settings page
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
      e.target.classList.add("changed");
      setTimeout(() => e.target.classList.remove("changed"), 500);
      this.props.onLogLevelChange?.(val);
    });

    // Max file size (in MB)
    this.on("change", "[data-field=max-file-size]", (e) => {
      const val = parseInt(e.target.value) || 10;
      this.maxFileSizeMB = val;
      this._updateUI();
      e.target.classList.add("changed");
      setTimeout(() => e.target.classList.remove("changed"), 500);
      // Convert MB to bytes for the callback
      this.props.onMaxFileSizeChange?.(val * 1024 * 1024);
    });

    // Max files
    this.on("change", "[data-field=max-files]", (e) => {
      const val = parseInt(e.target.value) || 7;
      this.maxFiles = val;
      this._updateUI();
      e.target.classList.add("changed");
      setTimeout(() => e.target.classList.remove("changed"), 500);
      this.props.onMaxFilesChange?.(val);
    });

    // Enable file logging
    this.on("change", "[data-field=enable-file-logging]", (e) => {
      this.enableFileLogging = e.target.checked;
      this._updateUI();
      e.target.classList.add("changed");
      setTimeout(() => e.target.classList.remove("changed"), 500);
      this.props.onEnableFileLoggingChange?.(this.enableFileLogging);
    });

    // Enable database logging
    this.on("change", "[data-field=enable-database-logging]", (e) => {
      this.enableDatabaseLogging = e.target.checked;
      this._updateUI();
      e.target.classList.add("changed");
      setTimeout(() => e.target.classList.remove("changed"), 500);
      this.props.onEnableDatabaseLoggingChange?.(this.enableDatabaseLogging);
    });

    // Enable console logging
    this.on("change", "[data-field=enable-console-logging]", (e) => {
      this.enableConsoleLogging = e.target.checked;
      this._updateUI();
      e.target.classList.add("changed");
      setTimeout(() => e.target.classList.remove("changed"), 500);
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

  /**
   * Render a checkbox with label and description
   */
  _renderCheckbox(field, label, description, checked) {
    return Component.h("label", { className: "checkbox-label" }, [
      Component.h("input", {
        type: "checkbox",
        "data-field": field,
        checked: checked,
        className: "checkbox-input",
      }),
      Component.h("div", { className: "checkbox-content" }, [
        Component.h("span", { className: "checkbox-title" }, label),
        Component.h("small", { className: "checkbox-desc" }, description),
      ]),
    ]);
  }

  render() {
    // Container class changed from "settings-section" to "logging-config-form"
    // to avoid conflicts with parent section containers
    return Component.h("div", { className: "logging-config-form" }, [

      // Main settings card
      Component.h("div", { className: "card settings-card" }, [
        Component.h("h3", { className: "card-title" }, "General Settings"),
        Component.h("div", { className: "form-grid logging-grid" }, [
          // Log Level
          Component.h("div", { className: "form-group" }, [
            Component.h("label", { for: "log-level", className: "field-label" }, "Log Level"),
            Component.h("select", {
              id: "log-level",
              "data-field": "log-level",
              value: this.logLevel,
              className: "field-select",
            }, [
              Component.h("option", { value: "debug" }, "Debug"),
              Component.h("option", { value: "info" }, "Info"),
              Component.h("option", { value: "warn" }, "Warning"),
              Component.h("option", { value: "error" }, "Error"),
            ]),
            Component.h("small", { className: "field-help" }, "Most to least verbose"),
          ]),
          // Max File Size
          Component.h("div", { className: "form-group" }, [
            Component.h("label", { for: "max-file-size", className: "field-label" }, "Max File Size (MB)"),
            Component.h("input", {
              type: "number",
              id: "max-file-size",
              "data-field": "max-file-size",
              value: this.maxFileSizeMB,
              min: "1",
              max: "1000",
              step: "1",
              className: "field-input",
            }),
            Component.h("small", { className: "field-help" }, "Per log file"),
          ]),
          // Max Files
          Component.h("div", { className: "form-group" }, [
            Component.h("label", { for: "max-files", className: "field-label" }, "Max Log Files"),
            Component.h("input", {
              type: "number",
              id: "max-files",
              "data-field": "max-files",
              value: this.maxFiles,
              min: "1",
              max: "30",
              className: "field-input",
            }),
            Component.h("small", { className: "field-help" }, "Number of days to retain"),
          ]),
        ]),
      ]),

      // Logging Targets card
      Component.h("div", { className: "card settings-card" }, [
        Component.h("h3", { className: "card-title" }, "Logging Targets"),
        Component.h("div", { className: "checkbox-group" }, [
          this._renderCheckbox(
            "enable-file-logging",
            "File Logging",
            "Write to logs/app-YYYYMMDD.log",
            this.enableFileLogging
          ),
          this._renderCheckbox(
            "enable-database-logging",
            "Database Logging",
            "Store in SQLite for quick access",
            this.enableDatabaseLogging
          ),
          this._renderCheckbox(
            "enable-console-logging",
            "Console Logging",
            "Output to server stdout",
            this.enableConsoleLogging
          ),
        ]),
      ]),
    ]);
  }
}

window.LoggingConfig = LoggingConfig;
