# Frontend Example: Launch Llama Server with Presets

Complete example showing how to add a "Launch Server" button to the Presets page.

## Quick Start

### 1. Add Launch Button to Presets UI

In `public/js/pages/presets.js`, modify the presets editor render:

```javascript
_renderPresetEditor() {
  if (!this.state.selectedPreset) return "";

  return `
    <div class="presets-editor-header">
      <h2>${this.state.selectedPreset.name}</h2>
      <div class="presets-editor-actions">
        <button class="btn btn-primary" id="btn-launch-server">
          🚀 Launch Server
        </button>
        <button class="btn btn-secondary" id="btn-export-ini">
          📥 Export INI
        </button>
      </div>
    </div>
    ${this._renderEditorContent()}
  `;
}
```

### 2. Add Event Handler

In `PresetsPage.getEventMap()`:

```javascript
getEventMap() {
  return {
    "click [data-action]": "handleAction",
    "change [data-field]": "handleFieldChange",
    "click #btn-launch-server": "handleLaunchServer",
    "click #btn-export-ini": "handleExportIni",
  };
}
```

### 3. Implement Launch Handler

```javascript
/**
 * Handle launching llama-server with current preset
 */
async handleLaunchServer() {
  if (!this.state.selectedPreset) {
    showNotification("No preset selected", "warning");
    return;
  }

  const preset = this.state.selectedPreset;

  // Validate preset first
  try {
    const validationResponse = await stateManager.request("presets:validate-config", {
      config: this.state.selectedPreset.config,
    });

    if (!validationResponse.success) {
      const errors = validationResponse.data.errors || [];
      const warnings = validationResponse.data.warnings || [];

      if (errors.length > 0) {
        showNotification(
          `Validation errors:\n${errors.join("\n")}`,
          "error"
        );
        return;
      }

      if (warnings.length > 0) {
        const confirmed = confirm(
          `Warnings:\n${warnings.join("\n")}\n\nContinue anyway?`
        );
        if (!confirmed) return;
      }
    }
  } catch (error) {
    console.error("[PRESETS] Validation error:", error);
    showNotification("Failed to validate preset", "error");
    return;
  }

  // Show options dialog
  const options = {
    maxModels: prompt("Max models to load (default 4):", "4") || "4",
    threads: prompt("CPU threads (default 4):", "4") || "4",
    ctxSize: prompt("Context size (default 4096):", "4096") || "4096",
  };

  // Convert to numbers
  options.maxModels = parseInt(options.maxModels);
  options.threads = parseInt(options.threads);
  options.ctxSize = parseInt(options.ctxSize);

  // Validate inputs
  if (!options.maxModels || !options.threads || !options.ctxSize) {
    showNotification("Invalid options", "error");
    return;
  }

  showNotification(`Starting llama-server with preset "${preset.name}"...`, "info");

  try {
    // Request to start server with preset
    const response = await stateManager.request("presets:start-with-preset", {
      filename: preset.name,
      options: options,
    });

    if (response.success) {
      const data = response.data;
      showNotification(
        `✓ llama-server started!\n` +
        `Port: ${data.port}\n` +
        `URL: ${data.url}\n` +
        `Preset: ${data.preset}`,
        "success"
      );

      // Update UI to show server is running
      this.setState({
        serverRunning: true,
        serverInfo: {
          port: data.port,
          url: data.url,
          preset: data.preset,
        },
      });

      // Update button text
      this._updateServerStatus();
    } else {
      showNotification(
        `Error: ${response.error.message}`,
        "error"
      );
    }
  } catch (error) {
    console.error("[PRESETS] Launch error:", error);
    showNotification(
      `Failed to start server: ${error.message}`,
      "error"
    );
  }
}

/**
 * Handle exporting preset as INI file
 */
async handleExportIni() {
  if (!this.state.selectedPreset) {
    showNotification("No preset selected", "warning");
    return;
  }

  try {
    const preset = this.state.selectedPreset;
    const response = await stateManager.request("presets:read", {
      filename: preset.name,
    });

    if (response.success) {
      const iniContent = response.data.content;

      // Create download link
      const blob = new Blob([iniContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${preset.name}.ini`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification(
        `Downloaded ${preset.name}.ini`,
        "success"
      );
    } else {
      showNotification(
        `Error: ${response.error.message}`,
        "error"
      );
    }
  } catch (error) {
    console.error("[PRESETS] Export error:", error);
    showNotification("Failed to export preset", "error");
  }
}

/**
 * Update server status display
 */
_updateServerStatus() {
  const serverStatusEl = document.getElementById("server-status");
  if (serverStatusEl && this.state.serverRunning) {
    serverStatusEl.innerHTML = `
      <div class="server-running">
        <span class="status-indicator active"></span>
        <div class="status-details">
          <strong>Server Running</strong>
          <p>Port: ${this.state.serverInfo.port}</p>
          <p>Preset: ${this.state.serverInfo.preset}</p>
          <button class="btn btn-small btn-danger" id="btn-stop-server">
            Stop Server
          </button>
        </div>
      </div>
    `;

    // Bind stop button
    const stopBtn = document.getElementById("btn-stop-server");
    if (stopBtn) {
      stopBtn.onclick = () => this.handleStopServer();
    }
  }
}

/**
 * Handle stopping llama-server
 */
async handleStopServer() {
  try {
    showNotification("Stopping llama-server...", "info");

    const response = await stateManager.request("presets:stop-server");

    if (response.success) {
      showNotification("✓ llama-server stopped", "success");
      this.setState({ serverRunning: false, serverInfo: null });
      this._updateServerStatus();
    } else {
      showNotification(
        `Error: ${response.error.message}`,
        "error"
      );
    }
  } catch (error) {
    console.error("[PRESETS] Stop error:", error);
    showNotification("Failed to stop server", "error");
  }
}
```

### 4. Add CSS Styling

Add to `public/css/pages/presets.css`:

```css
.presets-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.presets-editor-header h2 {
  margin: 0;
  font-size: 1.5rem;
  flex: 1;
}

.presets-editor-actions {
  display: flex;
  gap: 10px;
}

.presets-editor-actions .btn {
  min-width: 150px;
}

.server-running {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background-color: #e8f5e9;
  border-left: 4px solid #4caf50;
  border-radius: 4px;
  margin-bottom: 20px;
}

.server-running .status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  background-color: #ff9800;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.server-running .status-indicator.active {
  background-color: #4caf50;
  box-shadow: 0 0 10px #4caf50;
}

.server-running .status-details {
  flex: 1;
}

.server-running strong {
  display: block;
  margin-bottom: 5px;
  color: #2e7d32;
}

.server-running p {
  margin: 3px 0;
  font-size: 0.9rem;
  color: #558b2f;
}

.server-running .btn-danger {
  margin-top: 10px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.btn-small {
  padding: 5px 10px;
  font-size: 0.85rem;
}
```

### 5. Update State Initialization

In `PresetsController.loadPresetsData()`:

```javascript
async loadPresetsData(preset) {
  console.log("[DEBUG] Loading preset data:", preset.name);

  try {
    // ... existing code ...

    // Initialize server status
    this.component.setState({
      serverRunning: false,
      serverInfo: null,
    });
  } catch (error) {
    console.error("[PRESETS] Load error:", error);
  }
}
```

## Complete Workflow

### User Perspective

1. **Create Preset** → Name it (e.g., "production")
2. **Configure Models** → Add models and parameters
3. **Save Preset** → Click Save to write INI file
4. **Launch** → Click "🚀 Launch Server" button
5. **Configure** → Enter max models, threads, context size
6. **Monitor** → See server running status
7. **Stop** → Click "Stop Server" to shut down

### Behind the Scenes

1. Validate preset configuration
2. Send `presets:start-with-preset` event with filename
3. Server finds preset INI file in `./config/`
4. Starts `llama-server --models-preset ./config/my-preset.ini`
5. Waits for server to respond on configured port
6. Returns port and URL to frontend
7. Frontend displays running status and stop button

## Error Handling

```javascript
// Validation errors
"Validation errors:
[*]: Missing required 'model' parameter
[model-name]: Invalid context size value: abc"

// File not found
"Preset file not found: production"

// Port already in use
"Port already in use" → System auto-finds next available port

// Invalid options
"Invalid options" → Check that options are valid numbers
```

## Advanced Features

### Launch with Custom Options Dialog

```javascript
async _showLaunchDialog() {
  // Use a modal dialog instead of prompt
  const dialog = Component.h(
    "div",
    { className: "launch-options-dialog" },
    Component.h("h3", {}, "Launch Server Options"),
    Component.h("div", { className: "form-group" },
      Component.h("label", {}, "Max Models"),
      Component.h("input", {
        type: "number",
        defaultValue: "4",
        min: "1",
        max: "16",
        id: "opt-max-models",
      })
    ),
    Component.h("div", { className: "form-group" },
      Component.h("label", {}, "Threads"),
      Component.h("input", {
        type: "number",
        defaultValue: "4",
        min: "1",
        max: "256",
        id: "opt-threads",
      })
    ),
    Component.h("div", { className: "form-actions" },
      Component.h("button", { className: "btn btn-primary" }, "Launch"),
      Component.h("button", { className: "btn btn-secondary" }, "Cancel")
    )
  );

  // Render and handle response
}
```

### Monitor Server Status

```javascript
// Poll server status periodically
startServerMonitoring() {
  this.monitorInterval = setInterval(async () => {
    if (!this.state.serverRunning) return;

    try {
      const response = await fetch(
        `${this.state.serverInfo.url}/models`
      );
      if (!response.ok) {
        // Server down
        this.setState({ serverRunning: false });
        showNotification("Server disconnected", "warning");
      }
    } catch {
      // No connection
      this.setState({ serverRunning: false });
    }
  }, 5000); // Check every 5 seconds
}

stopServerMonitoring() {
  if (this.monitorInterval) {
    clearInterval(this.monitorInterval);
  }
}
```

## Related Files

- `server/handlers/presets.js` - Backend handlers
- `server/handlers/llama-router/start.js` - Router startup logic
- `public/js/pages/presets.js` - Frontend UI
- `PRESETS_LLAMA_LAUNCH.md` - Integration guide

---

**Ready to use!** Copy the code above into your presets.js page controller.
