/**
 * Settings Export/Import Component
 * Card-style with export and import buttons inside
 */

class ConfigExportImport extends Component {
  constructor(props) {
    super(props);
    this.onExport = props.onExport || null;
    this.onImport = props.onImport || null;
  }

  /**
   * Renders the export/import component UI.
   * @returns {HTMLElement} The export/import element.
   */
  render() {
    return Component.h(
      "div",
      { className: "config-export-import" },
      // Single card with Export/Import
      Component.h("div", { className: "card settings-card" }, [
        Component.h("h3", { className: "card-title" }, "Export / Import Configuration"),
        Component.h(
          "p",
          { className: "card-desc" },
          "Export your settings to a JSON file or import settings from a file."
        ),
        // Buttons inside the card
        Component.h("div", { className: "card-actions" }, [
          Component.h(
            "button",
            { className: "btn btn-secondary", "data-action": "export" },
            "Export"
          ),
          Component.h(
            "button",
            { className: "btn btn-secondary", "data-action": "import" },
            "Import"
          ),
        ]),
      ]),
      Component.h("input", {
        type: "file",
        "data-field": "import-file",
        accept: ".json",
        style: "display: none;",
      })
    );
  }

  /**
   * Returns the event map for binding events to handlers.
   * @returns {Object} Event map with selector to handler mappings.
   */
  getEventMap() {
    return {
      "click [data-action=export]": this.handleExport,
      "click [data-action=import]": this.handleImportTrigger,
      "change [data-field=import-file]": this.handleImportFile,
    };
  }

  /**
   * Handles the export button click. Triggers the onExport callback.
   */
  handleExport() {
    console.log("[DEBUG] Export configuration triggered");
    if (this.onExport) {
      this.onExport();
    }
  }

  /**
   * Handles the import button click. Opens file picker dialog.
   */
  handleImportTrigger() {
    console.log("[DEBUG] Import configuration triggered");
    const fileInput = this._el?.querySelector("[data-field=import-file]");
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handles the import file selection and parsing.
   * @param {Event} e - The change event from file input.
   */
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
