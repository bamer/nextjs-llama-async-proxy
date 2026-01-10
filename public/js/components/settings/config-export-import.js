/**
 * Settings Export/Import Component
 * Adds export and import configuration buttons
 */

class ConfigExportImport extends Component {
  constructor(props) {
    super(props);
    this.onExport = props.onExport || null;
    this.onImport = props.onImport || null;
  }

  render() {
    return Component.h(
      "div",
      { className: "config-export-import" },
      Component.h("h2", {}, "Export / Import Configuration"),
      Component.h(
        "p",
        { className: "hint" },
        "Export your settings to a JSON file or import settings from a file."
      ),
      Component.h(
        "div",
        { className: "export-import-buttons" },
        Component.h(
          "button",
          { className: "btn btn-secondary", "data-action": "export" },
          "Export Configuration"
        ),
        Component.h(
          "button",
          { className: "btn btn-secondary", "data-action": "import" },
          "Import Configuration"
        )
      ),
      Component.h("input", {
        type: "file",
        "data-field": "import-file",
        accept: ".json",
        style: "display: none;",
      })
    );
  }

  getEventMap() {
    return {
      "click [data-action=export]": this.handleExport,
      "click [data-action=import]": this.handleImportTrigger,
      "change [data-field=import-file]": this.handleImportFile,
    };
  }

  handleExport() {
    console.log("[DEBUG] Export configuration triggered");
    if (this.onExport) {
      this.onExport();
    }
  }

  handleImportTrigger() {
    console.log("[DEBUG] Import configuration triggered");
    const fileInput = this._el?.querySelector("[data-field=import-file]");
    if (fileInput) {
      fileInput.click();
    }
  }

  handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log("[DEBUG] Import file selected:", file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target.result);
        console.log("[DEBUG] Parsed config:", config);

        if (this.onImport) {
          this.onImport(config);
        }
      } catch (error) {
        console.error("[DEBUG] Import parse error:", error);
        showNotification("Failed to parse configuration file", "error");
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = "";
  }
}

window.ConfigExportImport = ConfigExportImport;
